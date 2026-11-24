import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Sends a traveler notification outside the app: Telegram bot message and
// Expo push. Called by the queue_notification_delivery trigger (pg_net), which
// authenticates with the shared NOTIFICATION_DELIVERY_SECRET header.
// Deploy with --no-verify-jwt: pg_net does not send a user JWT.

type Outcome = string;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function sameSecret(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function sendTelegram(
  chatId: string,
  title: string,
  message: string,
  tripId: string | null,
): Promise<Outcome> {
  const tokens = [
    Deno.env.get('TELEGRAM_MINI_APP_BOT_TOKEN'),
    Deno.env.get('TELEGRAM_LOGIN_BOT_TOKEN'),
  ].filter((token): token is string => Boolean(token));
  if (!tokens.length) return 'skipped: no bot token';

  const appUrl = (Deno.env.get('TELEGRAM_MINI_APP_URL') || 'https://t.me/tankua_tma_bot').replace(/\/$/, '');
  const replyMarkup = tripId
    ? { inline_keyboard: [[{ text: 'Open trip', url: `${appUrl}?startapp=${encodeURIComponent(`trip_${tripId}`)}` }]] }
    : undefined;

  const errors: string[] = [];
  // A bot can only message people who started it, so try each Tankua bot in turn.
  for (const token of tokens) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `<b>${escapeHtml(title)}</b>\n${escapeHtml(message)}`,
          parse_mode: 'HTML',
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) return 'sent';
      const result = await response.json().catch(() => ({}));
      errors.push(result?.description || `status ${response.status}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'network error');
    }
  }
  return `failed: ${errors.join('; ')}`.slice(0, 300);
}

async function sendPush(
  token: string,
  title: string,
  message: string,
  data: Record<string, unknown>,
): Promise<Outcome> {
  if (!/^Expo(nent)?PushToken\[.+\]$/.test(token)) return 'skipped: not an Expo token';
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ to: token, title, body: message, data, sound: 'default', priority: 'high' }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!response) return 'failed: network';
  const result = await response.json().catch(() => ({}));
  const ticket = Array.isArray(result?.data) ? result.data[0] : result?.data;
  if (response.ok && ticket?.status === 'ok') return 'sent';
  return `failed: ${ticket?.message || result?.errors?.[0]?.message || `status ${response.status}`}`.slice(0, 300);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const expected = Deno.env.get('NOTIFICATION_DELIVERY_SECRET') || '';
  if (!sameSecret(req.headers.get('x-delivery-secret') || '', expected)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Not configured' }, 503);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { notification_id: notificationId } = await req.json().catch(() => ({}));
  if (typeof notificationId !== 'string') return json({ error: 'Missing notification_id' }, 400);

  // Claim the row first so a retried request never sends twice.
  const { data: notification, error } = await admin
    .from('notifications')
    .update({ delivered_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('delivered_at', null)
    .eq('recipient_type', 'user')
    .select('id, recipient_id, title, message, type, data')
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!notification) return json({ skipped: 'already delivered or not a traveler notification' });

  const { data: user } = await admin
    .from('users')
    .select('telegram_id, push_token')
    .eq('id', notification.recipient_id)
    .maybeSingle();

  const data = (notification.data ?? {}) as Record<string, unknown>;
  const tripId = typeof data.trip_id === 'string' ? data.trip_id : null;

  const [telegram, push] = await Promise.all([
    user?.telegram_id
      ? sendTelegram(String(user.telegram_id), notification.title, notification.message, tripId)
      : Promise.resolve('skipped: no Telegram account'),
    user?.push_token
      ? sendPush(user.push_token, notification.title, notification.message, { ...data, type: notification.type })
      : Promise.resolve('skipped: no push token'),
  ]);

  const delivery = { telegram, push };
  await admin.from('notifications').update({ delivery }).eq('id', notification.id);
  return json({ id: notification.id, delivery });
});
