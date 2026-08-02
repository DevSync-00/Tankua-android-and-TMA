import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyTelegram, type TelegramPayloadType } from './telegram-verifier.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
};

async function hasServiceRoleAccess(req: Request, supabaseUrl: string, runtimeServiceKey: string) {
  const authorization = req.headers.get('authorization') || '';
  const apiKey = req.headers.get('apikey') || '';
  if (authorization === `Bearer ${runtimeServiceKey}` || apiKey === runtimeServiceKey) return true;
  if (!authorization || !apiKey) return false;

  // Supabase may issue more than one valid service credential (legacy JWT and
  // sb_secret keys). Ask Auth's admin-only endpoint to validate the caller
  // instead of comparing two potentially different valid key strings.
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`, {
      method: 'GET',
      headers: { authorization, apikey: apiKey },
    });
    return response.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  let attemptedPayloadType: TelegramPayloadType | 'unknown' = 'unknown';
  let trustedCaller = false;
  let failureStage = 'request_validation';
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // TELEGRAM_BOT_TOKEN is retained as a backwards-compatible mobile-login
    // token while production transitions to the explicit variable name.
    const loginBotToken = Deno.env.get('TELEGRAM_LOGIN_BOT_TOKEN')
      || Deno.env.get('TELEGRAM_BOT_TOKEN')
      || '';
    const miniAppBotToken = Deno.env.get('TELEGRAM_MINI_APP_BOT_TOKEN') || '';
    if (!url || !anonKey || !serviceKey) throw new Error('Telegram auth service is not configured');
    const payload = await req.json();
    attemptedPayloadType = typeof payload?.init_data === 'string' ? 'mini_app' : 'login_widget';
    const serviceRoleAuthorized = await hasServiceRoleAccess(req, url, serviceKey);
    trustedCaller = serviceRoleAuthorized;
    const workerUser = payload?.verified_telegram_user;
    const workerVerifiedAt = Number(payload?.verified_at);
    const freshWorkerAssertion = Number.isFinite(workerVerifiedAt)
      && Math.abs(Math.floor(Date.now() / 1000) - workerVerifiedAt) <= 60;

    let telegram: Record<string, unknown>;
    let payloadType: TelegramPayloadType;
    if (serviceRoleAuthorized && freshWorkerAssertion && workerUser?.id && typeof payload?.init_data === 'string') {
      // The TMA Worker has already verified initData with its bot token. A
      // service-role bearer is the trust boundary; callers without it always
      // go through Telegram HMAC verification below.
      telegram = workerUser;
      payloadType = 'mini_app_worker';
    } else {
      failureStage = 'telegram_signature';
      ({ user: telegram, payloadType } = await verifyTelegram(payload, loginBotToken, miniAppBotToken));
    }
    failureStage = 'supabase_auth_session';
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
    failureStage = 'profile_reconciliation';
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
      stage: failureStage,
      reason: error instanceof Error ? error.message : 'Unknown authentication failure',
    }));
    const responseBody: Record<string, string> = {
      error: 'Telegram authentication failed. Please try again.',
      code: `TELEGRAM_AUTH_${failureStage.toUpperCase()}`,
    };
    if (trustedCaller) {
      responseBody.internal_error = error instanceof Error ? error.message : 'Unknown authentication failure';
    }
    return new Response(JSON.stringify(responseBody), {
      status: 400, headers: { ...cors, 'content-type': 'application/json' },
    });
  }
});
