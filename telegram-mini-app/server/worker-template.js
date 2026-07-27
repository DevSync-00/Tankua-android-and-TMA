const files = new Map(__ASSET_MANIFEST__);
const SESSION_COOKIE = 'tankua_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const TELEGRAM_MAX_AGE_SECONDS = 5 * 60;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      ...extraHeaders,
    },
  });
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decodeBase64url(value) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function hex(bytes) {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return mismatch === 0;
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    typeof secret === 'string' ? new TextEncoder().encode(secret) : secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

async function verifyTelegramInitData(initData, botToken) {
  if (!initData || initData.length > 8192) throw new Error('Missing Telegram launch data');
  const params = new URLSearchParams(initData);
  const suppliedHash = params.get('hash');
  const authDate = Number(params.get('auth_date'));
  if (!suppliedHash || !authDate) throw new Error('Incomplete Telegram launch data');
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age < -30 || age > TELEGRAM_MAX_AGE_SECONDS) throw new Error('Telegram launch data has expired');
  params.delete('hash');
  params.delete('signature');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = await hmac('WebAppData', botToken);
  const calculatedHash = hex(await hmac(secretKey, dataCheckString));
  if (!constantTimeEqual(calculatedHash, suppliedHash.toLowerCase())) throw new Error('Invalid Telegram signature');
  const user = JSON.parse(params.get('user') || 'null');
  if (!user?.id || !Number.isSafeInteger(Number(user.id))) throw new Error('Telegram user is missing');
  return user;
}

async function signSession(payload, secret) {
  const encoded = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${encoded}.${base64url(await hmac(secret, encoded))}`;
}

async function readSession(request, env) {
  const cookie = request.headers.get('cookie') || '';
  const raw = cookie.split(';').map(item => item.trim()).find(item => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!raw) return null;
  const [encoded, signature] = raw.split('.');
  if (!encoded || !signature) return null;
  const expected = base64url(await hmac(env.SESSION_SECRET, encoded));
  if (!constantTimeEqual(expected, signature)) return null;
  const payload = JSON.parse(new TextDecoder().decode(decodeBase64url(encoded)));
  if (!payload?.uid || !payload?.tid || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function requireEnvironment(env) {
  const keys = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TELEGRAM_BOT_TOKEN', 'SESSION_SECRET'];
  const missing = keys.filter(key => !env[key]);
  if (missing.length) throw new Error(`Server configuration missing: ${missing.join(', ')}`);
}

async function supabase(env, path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || data?.hint || `Database request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function auditTelegramAuth(request, env, { telegramId = null, userId = null, success, reason = null }) {
  try {
    const ip = request.headers.get('cf-connecting-ip') || '';
    await supabase(env, 'telegram_auth_events', {
      method: 'POST',
      body: {
        telegram_id: telegramId,
        user_id: userId,
        success,
        failure_reason: reason ? String(reason).slice(0, 240) : null,
        ip_hash: ip ? await sha256(`${env.SESSION_SECRET}:${ip}`) : null,
        user_agent: (request.headers.get('user-agent') || '').slice(0, 500),
      },
      headers: { Prefer: 'return=minimal' },
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'telegram_auth_audit_failed', message: error.message }));
  }
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    emergency_contact: user.emergency_contact || '',
    location: user.location || '',
    telegram_username: user.telegram_username || '',
    telegram_photo_url: user.telegram_photo_url || '',
  };
}

async function authenticate(request, env) {
  const body = await request.json();
  let telegram;
  try {
    telegram = await verifyTelegramInitData(body.initData, env.TELEGRAM_BOT_TOKEN);
  } catch (error) {
    await auditTelegramAuth(request, env, { success: false, reason: error.message });
    throw error;
  }
  const telegramId = Number(telegram.id);
  const name = [telegram.first_name, telegram.last_name].filter(Boolean).join(' ').slice(0, 120);
  const profile = {
    telegram_id: telegramId,
    telegram_username: telegram.username || null,
    telegram_photo_url: telegram.photo_url || null,
    telegram_language_code: telegram.language_code || null,
    name: name || 'Telegram User',
    phone_number: `telegram:${telegramId}`,
    last_login_at: new Date().toISOString(),
  };
  const existing = await supabase(
    env,
    `users?select=id&or=(telegram_id.eq.${telegramId},phone_number.eq.${encodeURIComponent(`telegram:${telegramId}`)})&limit=1`,
  );
  let users;
  if (existing?.[0]?.id) {
    users = await supabase(
      env,
      `users?id=eq.${existing[0].id}&select=id,name,email,phone_number,emergency_contact,location,telegram_id,telegram_username,telegram_photo_url`,
      { method: 'PATCH', body: profile, headers: { Prefer: 'return=representation' } },
    );
  } else {
    users = await supabase(
      env,
      'users?select=id,name,email,phone_number,emergency_contact,location,telegram_id,telegram_username,telegram_photo_url',
      { method: 'POST', body: profile, headers: { Prefer: 'return=representation' } },
    );
  }
  const user = users?.[0];
  if (!user) throw new Error('Unable to create Telegram profile');
  const now = Math.floor(Date.now() / 1000);
  const token = await signSession({ uid: user.id, tid: String(telegramId), iat: now, exp: now + SESSION_TTL_SECONDS }, env.SESSION_SECRET);
  await auditTelegramAuth(request, env, { telegramId, userId: user.id, success: true });
  return json(
    { user: safeUser(user) },
    200,
    { 'set-cookie': `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}` },
  );
}

async function getCatalog(env) {
  const [destinations, trips, stations, links] = await Promise.all([
    supabase(env, 'destinations?select=id,name,description,region,city,distance,images,tags,category,location,rating,review_count,price,estimated_duration,price_range,is_verified,place_type&order=rating.desc.nullslast'),
    supabase(env, `trips?select=id,destination_id,provider_id,trip_type,departure_date,return_date,price,available_seats,max_seats,itinerary,status&status=in.(active,upcoming)&departure_date=gt.${encodeURIComponent(new Date().toISOString())}&order=departure_date.asc`),
    supabase(env, 'pickup_stations?select=id,provider_id,name,city,address,lat,lng,is_active&is_active=eq.true&order=name.asc'),
    supabase(env, 'trip_pickup_stations?select=trip_id,station_id,pickup_time,extra_price'),
  ]);
  return json({ destinations, trips, stations, trip_pickup_stations: links });
}

async function getBookings(session, env) {
  const bookings = await supabase(
    env,
    `bookings?select=*&user_id=eq.${session.uid}&order=created_at.desc`,
  );
  return json({ bookings });
}

function validatePassengers(passengers, seats) {
  if (!Array.isArray(passengers) || passengers.length !== seats) throw new Error('Passenger count must match seats');
  return passengers.map(passenger => {
    const name = String(passenger?.name || '').trim().slice(0, 120);
    const age = Number(passenger?.age);
    if (name.length < 2 || !Number.isInteger(age) || age < 1 || age > 120) throw new Error('Invalid passenger details');
    return { name, age };
  });
}

async function createBooking(request, session, env) {
  const body = await request.json();
  const seats = Number(body.seats);
  if (!Number.isInteger(seats) || seats < 1 || seats > 8) throw new Error('Seats must be between 1 and 8');
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (![body.trip_id, body.station_id, body.idempotency_key].every(value => uuid.test(value || ''))) throw new Error('Invalid booking identifiers');
  const passengers = validatePassengers(body.passengers, seats);
  const booking = await supabase(env, 'rpc/create_miniapp_booking', {
    method: 'POST',
    body: {
      p_user_id: session.uid,
      p_trip_id: body.trip_id,
      p_station_id: body.station_id,
      p_seats: seats,
      p_passengers: passengers,
      p_idempotency_key: body.idempotency_key,
    },
  });
  return json({ booking: Array.isArray(booking) ? booking[0] : booking }, 201);
}

async function initializePayment(request, session, env) {
  if (!env.CHAPA_SECRET_KEY || !env.APP_ORIGIN) throw new Error('Payment service is not configured');
  const { booking_id } = await request.json();
  const bookings = await supabase(env, `bookings?select=id,total_price,payment_status,payment_deadline,user_id&user_id=eq.${session.uid}&id=eq.${booking_id}&limit=1`);
  const booking = bookings?.[0];
  if (!booking) return json({ error: 'Booking not found' }, 404);
  if (booking.payment_status === 'paid') return json({ error: 'Booking is already paid' }, 409);
  if (new Date(booking.payment_deadline) <= new Date()) return json({ error: 'Payment deadline has expired' }, 409);
  const txRef = `tankua-${booking.id}-${Date.now()}`.slice(0, 50);
  const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.CHAPA_SECRET_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      amount: Number(booking.total_price).toFixed(2),
      currency: 'ETB',
      email: `telegram-${session.tid}@tankua.app`,
      first_name: 'Tankua',
      last_name: 'Traveler',
      tx_ref: txRef,
      callback_url: `${env.APP_ORIGIN}/api/webhooks/chapa`,
      return_url: `${env.APP_ORIGIN}/?payment_return=1&tx_ref=${encodeURIComponent(txRef)}`,
      customization: { title: 'Tankua Booking', description: 'Trip booking payment' },
    }),
  });
  const result = await response.json();
  if (!response.ok || result.status !== 'success' || !result.data?.checkout_url) {
    throw new Error(result.message || 'Unable to initialize payment');
  }
  await supabase(env, 'payment_transactions', {
    method: 'POST',
    body: {
      booking_id: booking.id,
      user_id: session.uid,
      amount: booking.total_price,
      currency: 'ETB',
      payment_method: 'chapa',
      transaction_ref: txRef,
      checkout_url: result.data.checkout_url,
      status: 'pending',
    },
    headers: { Prefer: 'return=minimal' },
  });
  return json({ checkout_url: result.data.checkout_url, transaction_ref: txRef });
}

async function verifyPayment(txRef, env, expectedUserId = null) {
  if (!env.CHAPA_SECRET_KEY) throw new Error('Payment service is not configured');
  const transactions = await supabase(env, `payment_transactions?select=*&transaction_ref=eq.${encodeURIComponent(txRef)}&limit=1`);
  const transaction = transactions?.[0];
  if (!transaction) return json({ error: 'Transaction not found' }, 404);
  if (expectedUserId && transaction.user_id !== expectedUserId) return json({ error: 'Transaction not found' }, 404);
  const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: { authorization: `Bearer ${env.CHAPA_SECRET_KEY}` },
  });
  const result = await response.json();
  const paid = response.ok && result.status === 'success' && ['success', 'successful'].includes(result.data?.status);
  const amountMatches = Number(result.data?.amount) === Number(transaction.amount);
  if (paid && amountMatches) {
    await Promise.all([
      supabase(env, `payment_transactions?transaction_ref=eq.${encodeURIComponent(txRef)}`, {
        method: 'PATCH',
        body: { status: 'success', verified_at: new Date().toISOString(), verified_by: 'api', provider_response: result.data, completed_at: new Date().toISOString() },
        headers: { Prefer: 'return=minimal' },
      }),
      supabase(env, `bookings?id=eq.${transaction.booking_id}`, {
        method: 'PATCH',
        body: { payment_status: 'paid' },
        headers: { Prefer: 'return=minimal' },
      }),
    ]);
  }
  return json({ paid: paid && amountMatches, status: paid && amountMatches ? 'paid' : transaction.status, booking_id: transaction.booking_id });
}

function assertSameOrigin(request, env) {
  const origin = request.headers.get('origin');
  if (origin && env.APP_ORIGIN && origin !== env.APP_ORIGIN) {
    const error = new Error('Invalid request origin');
    error.status = 403;
    throw error;
  }
}

async function handleApi(request, env, requestId) {
  requireEnvironment(env);
  const url = new URL(request.url);
  if (request.method === 'POST') assertSameOrigin(request, env);
  if (url.pathname === '/api/auth/telegram' && request.method === 'POST') return authenticate(request, env);
  if (url.pathname === '/api/catalog' && request.method === 'GET') return getCatalog(env);
  if (url.pathname === '/api/webhooks/chapa' && ['GET', 'POST'].includes(request.method)) {
    const payload = request.method === 'POST' ? await request.json() : Object.fromEntries(url.searchParams);
    const txRef = payload.tx_ref || payload.trx_ref || payload.reference;
    if (!txRef) return json({ error: 'Missing transaction reference' }, 400);
    await verifyPayment(txRef, env);
    return json({ received: true });
  }
  const session = await readSession(request, env);
  if (!session) return json({ error: 'Authentication required' }, 401);
  if (url.pathname === '/api/session' && request.method === 'GET') {
    const users = await supabase(env, `users?select=id,name,email,phone_number,emergency_contact,location,telegram_username,telegram_photo_url&id=eq.${session.uid}&limit=1`);
    return json({ user: safeUser(users?.[0] || {}) });
  }
  if (url.pathname === '/api/bookings' && request.method === 'GET') return getBookings(session, env);
  if (url.pathname === '/api/bookings' && request.method === 'POST') return createBooking(request, session, env);
  if (url.pathname === '/api/payments/chapa' && request.method === 'POST') return initializePayment(request, session, env);
  if (url.pathname === '/api/payments/status' && request.method === 'GET') return verifyPayment(url.searchParams.get('tx_ref') || '', env, session.uid);
  if (url.pathname === '/api/logout' && request.method === 'POST') {
    return json({ success: true }, 200, { 'set-cookie': `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` });
  }
  return json({ error: 'API route not found', request_id: requestId }, 404);
}

function decode(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function serveAsset(request) {
  const url = new URL(request.url);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname.endsWith('/')) pathname += 'index.html';
  const asset = files.get(pathname) || (!pathname.includes('.') && files.get('/index.html'));
  if (!asset) return new Response('Not found', { status: 404 });
  return new Response(request.method === 'HEAD' ? null : decode(asset[0]), {
    status: 200,
    headers: {
      'content-type': asset[1],
      'cache-control': pathname.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'self'; script-src 'self' https://telegram.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https://api.chapa.co; frame-ancestors https://web.telegram.org https://*.telegram.org;",
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    },
  });
}

export default {
  async fetch(request, env) {
    const requestId = crypto.randomUUID();
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, requestId);
      return serveAsset(request);
    } catch (error) {
      console.error(JSON.stringify({ request_id: requestId, message: error.message, stack: error.stack }));
      const status = Number(error.status) || (error.message?.startsWith('Server configuration') ? 503 : 400);
      return json({ error: status >= 500 ? 'Service temporarily unavailable' : error.message, request_id: requestId }, status);
    }
  },
};
