import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import test from 'node:test';
import { verifyTelegram } from '../../supabase/functions/telegram-auth/telegram-verifier.ts';

const loginToken = '111111:mobile-login-token';
const miniToken = '222222:mini-app-token';
const authDate = Math.floor(Date.now() / 1000);

function signWidget(fields, token) {
  const check = Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = createHash('sha256').update(token).digest();
  return { ...fields, hash: createHmac('sha256', secret).update(check).digest('hex') };
}

function signMiniApp(user, token) {
  const params = new URLSearchParams({ auth_date: String(authDate), user: JSON.stringify(user) });
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  params.set('hash', createHmac('sha256', secret).update(check).digest('hex'));
  return { init_data: params.toString() };
}

test('validates Login Widget data only with the login bot token', async () => {
  const payload = signWidget({ id: '99887766', first_name: 'Mobile', auth_date: String(authDate) }, loginToken);
  assert.equal((await verifyTelegram(payload, loginToken, miniToken)).payloadType, 'login_widget');
  await assert.rejects(() => verifyTelegram(payload, miniToken, loginToken), /Invalid Telegram signature/);
});

test('validates Mini App initData only with the Mini App bot token', async () => {
  const payload = signMiniApp({ id: 99887766, first_name: 'Mini' }, miniToken);
  assert.equal((await verifyTelegram(payload, loginToken, miniToken)).payloadType, 'mini_app');
  await assert.rejects(() => verifyTelegram(payload, miniToken, loginToken), /Invalid Telegram signature/);
});

test('rejects modified and expired Telegram payloads', async () => {
  const modified = signWidget({ id: '99887766', first_name: 'Original', auth_date: String(authDate) }, loginToken);
  modified.first_name = 'Modified';
  await assert.rejects(() => verifyTelegram(modified, loginToken, miniToken), /Invalid Telegram signature/);
  const expired = signWidget({ id: '99887766', first_name: 'Old', auth_date: String(authDate - 301) }, loginToken);
  await assert.rejects(() => verifyTelegram(expired, loginToken, miniToken), /expired/);
});
