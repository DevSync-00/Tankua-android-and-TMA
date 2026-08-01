import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

const worker = (await import('../server/worker-template.js')).default;
const botToken = '123456:test-bot-token';
const sessionSecret = 'a-production-session-secret-with-more-than-32-bytes';
const userId = '7864c70e-43e8-4ded-85b5-63395076899a';

function telegramInitData(user, authDate = Math.floor(Date.now() / 1000)) {
  const params = new URLSearchParams({
    auth_date: String(authDate),
    query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
    signature: 'telegram-third-party-signature',
    user: JSON.stringify(user),
  });
  const check = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  params.set('hash', createHmac('sha256', secret).update(check).digest('hex'));
  return params.toString();
}

const originalFetch = globalThis.fetch;
let lastEdgePayload = null;
globalThis.fetch = async (url, options = {}) => {
  const value = String(url);
  if (value.includes('/functions/v1/telegram-auth')) {
    lastEdgePayload = JSON.parse(options.body);
    return new Response(JSON.stringify({ session: { user: { id: userId } } }), { status: 200 });
  }
  if (value.includes('/rest/v1/telegram_auth_events')) {
    return new Response(null, { status: 201 });
  }
  if (value.includes('/rest/v1/users?select=id&id=')) {
    return new Response(JSON.stringify([]), { status: 200 });
  }
  if (value.includes('/rest/v1/users?select=id,name')) {
    return new Response(JSON.stringify([{
      id: userId,
      name: 'Production Traveler',
      email: '',
      phone_number: 'telegram:99887766',
      emergency_contact: '',
      location: '',
      telegram_id: 99887766,
      telegram_username: 'tankua_test',
      telegram_photo_url: null,
    }]), { status: 201 });
  }
  return originalFetch(url, options);
};

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
  TELEGRAM_BOT_TOKEN: botToken,
  SESSION_SECRET: sessionSecret,
  APP_ORIGIN: 'https://tankua.example',
};

test('rejects forged Telegram launch data', async () => {
  const forged = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify({ id: 99887766, first_name: 'Attacker' }),
    hash: '00'.repeat(32),
  }).toString();
  const response = await worker.fetch(new Request('https://tankua.example/api/auth/telegram', {
    method: 'POST',
    headers: { origin: 'https://tankua.example', 'content-type': 'application/json' },
    body: JSON.stringify({ initData: forged }),
  }), env);
  assert.equal(response.status, 400);
});

test('accepts signed Telegram launch data and sets an HttpOnly session', async () => {
  const initData = telegramInitData({
    id: 99887766,
    first_name: 'Production',
    last_name: 'Traveler',
    username: 'tankua_test',
    language_code: 'en',
  });
  const response = await worker.fetch(new Request('https://tankua.example/api/auth/telegram', {
    method: 'POST',
    headers: { origin: 'https://tankua.example', 'content-type': 'application/json' },
    body: JSON.stringify({ initData }),
  }), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.user.name, 'Production Traveler');
  assert.equal(typeof lastEdgePayload.init_data, 'string');
  assert.equal(lastEdgePayload.init_data, initData);
  assert.deepEqual(Object.keys(lastEdgePayload), ['init_data']);
  assert.match(response.headers.get('set-cookie'), /tankua_session=.*HttpOnly.*Secure.*SameSite=Lax/);
});
