import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyTelegram, type TelegramPayloadType } from './telegram-verifier.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  let attemptedPayloadType: TelegramPayloadType | 'unknown' = 'unknown';
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const loginBotToken = Deno.env.get('TELEGRAM_LOGIN_BOT_TOKEN') || '';
    const miniAppBotToken = Deno.env.get('TELEGRAM_MINI_APP_BOT_TOKEN') || '';
    if (!url || !anonKey || !serviceKey) throw new Error('Telegram auth service is not configured');
    const payload = await req.json();
    attemptedPayloadType = typeof payload?.init_data === 'string' ? 'mini_app' : 'login_widget';
    const { user: telegram, payloadType } = await verifyTelegram(payload, loginBotToken, miniAppBotToken);
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
    console.info(JSON.stringify({ event: 'telegram_auth_success', payload_type: payloadType, telegram_id: telegramId }));
    return new Response(JSON.stringify({ session: verified.session }), { headers: { ...cors, 'content-type': 'application/json' } });
  } catch (error) {
    console.error(JSON.stringify({
      event: 'telegram_auth_failed',
      payload_type: attemptedPayloadType,
      reason: error instanceof Error ? error.message : 'Unknown authentication failure',
    }));
    return new Response(JSON.stringify({ error: 'Telegram authentication failed. Please try again.' }), {
      status: 400, headers: { ...cors, 'content-type': 'application/json' },
    });
  }
});
