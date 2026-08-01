export type TelegramPayloadType = 'mini_app' | 'mini_app_worker' | 'login_widget';

const encode = new TextEncoder();
const bytesToHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hmac(key: string | Uint8Array, value: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', typeof key === 'string' ? encode.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encode.encode(value)));
}

export async function verifyTelegram(
  payload: Record<string, unknown>,
  loginBotToken: string,
  miniAppBotToken: string,
) {
  let fields: Record<string, string>;
  let user: Record<string, unknown>;
  let payloadType: TelegramPayloadType;
  if (typeof payload.init_data === 'string') {
    const params = new URLSearchParams(payload.init_data);
    fields = Object.fromEntries(params.entries());
    user = JSON.parse(fields.user || 'null');
    payloadType = 'mini_app';
  } else {
    fields = Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, String(value ?? '')]));
    user = payload;
    payloadType = 'login_widget';
  }
  const suppliedHash = fields.hash;
  const authDate = Number(fields.auth_date);
  if (!suppliedHash || !authDate || !user?.id) throw new Error('Incomplete Telegram authentication data');
  if (Math.abs(Math.floor(Date.now() / 1000) - authDate) > 300) throw new Error('Telegram authentication data expired');
  const check = Object.entries(fields)
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`).join('\n');
  const token = payloadType === 'mini_app' ? miniAppBotToken : loginBotToken;
  if (!token) throw new Error(`Missing ${payloadType} bot token`);
  const key = payloadType === 'mini_app'
    ? await hmac('WebAppData', token)
    : new Uint8Array(await crypto.subtle.digest('SHA-256', encode.encode(token)));
  const expected = bytesToHex(await hmac(key, check));
  if (expected.length !== suppliedHash.length || expected !== suppliedHash.toLowerCase()) {
    throw new Error('Invalid Telegram signature');
  }
  return { user, payloadType };
}
