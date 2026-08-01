import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
};

const bytesToHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
const encode = new TextEncoder();

async function hmac(key: string | Uint8Array, value: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', typeof key === 'string' ? encode.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encode.encode(value)));
}

async function verifyTelegram(payload: Record<string, unknown>, botToken: string) {
  let fields: Record<string, string>;
  let user: Record<string, unknown>;
  let webApp = false;
  if (typeof payload.init_data === 'string') {
    const params = new URLSearchParams(payload.init_data);
    fields = Object.fromEntries(params.entries());
    user = JSON.parse(fields.user || 'null');
    webApp = true;
  } else {
    fields = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v ?? '')]));
    user = payload;
  }
  const suppliedHash = fields.hash;
  const authDate = Number(fields.auth_date);
  if (!suppliedHash || !authDate || !user?.id) throw new Error('Incomplete Telegram authentication data');
  if (Math.abs(Math.floor(Date.now() / 1000) - authDate) > 300) throw new Error('Telegram authentication data expired');
  const check = Object.entries(fields)
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`).join('\n');
  const key = webApp
    ? await hmac('WebAppData', botToken)
    : new Uint8Array(await crypto.subtle.digest('SHA-256', encode.encode(botToken)));
  const expected = bytesToHex(await hmac(key, check));
  if (expected.length !== suppliedHash.length || expected !== suppliedHash.toLowerCase()) throw new Error('Invalid Telegram signature');
  return user;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    if (!url || !anonKey || !serviceKey || !botToken) throw new Error('Telegram auth is not configured');
    const telegram = await verifyTelegram(await req.json(), botToken);
    const telegramId = String(telegram.id);
    const email = `telegram-${telegramId}@auth.tankua.app`;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const publicClient = createClient(url, anonKey, { auth: { persistSession: false } });

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink', email,
      options: { data: { telegram_id: telegramId, provider: 'telegram' } },
    });
    if (linkError || !link?.properties?.hashed_token) throw linkError || new Error('Could not create Telegram session');
    const { data: verified, error: verifyError } = await publicClient.auth.verifyOtp({
      token_hash: link.properties.hashed_token, type: 'magiclink',
    });
    if (verifyError || !verified.session?.user?.id) throw verifyError || new Error('Could not verify Telegram session');

    const name = [telegram.first_name, telegram.last_name].filter(Boolean).join(' ') || 'Telegram User';
    const { error: profileError } = await admin.rpc('link_telegram_auth_user', {
      p_auth_user_id: verified.session.user.id,
      p_telegram_id: Number(telegram.id),
      p_name: name,
      p_username: telegram.username || null,
      p_photo_url: telegram.photo_url || null,
      p_language_code: telegram.language_code || null,
    });
    if (profileError) throw profileError;
    return new Response(JSON.stringify({ session: verified.session }), { headers: { ...cors, 'content-type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Telegram login failed' }), {
      status: 400, headers: { ...cors, 'content-type': 'application/json' },
    });
  }
});
