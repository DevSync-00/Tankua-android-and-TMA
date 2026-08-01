const files = new Map(globalThis.__TANKUA_ASSET_MANIFEST__ || []);
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

function readableError(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(readableError).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([field, detail]) => {
        const message = readableError(detail);
        return message ? `${field}: ${message}` : '';
      })
      .filter(Boolean)
      .join('; ');
  }
  return String(value);
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

async function telegramWidgetPayload(telegram, botToken) {
  const payload = {
    id: String(telegram.id),
    first_name: String(telegram.first_name || 'Telegram User'),
    auth_date: String(Math.floor(Date.now() / 1000)),
  };
  if (telegram.last_name) payload.last_name = String(telegram.last_name);
  if (telegram.username) payload.username = String(telegram.username);
  if (telegram.photo_url) payload.photo_url = String(telegram.photo_url);
  const dataCheckString = Object.entries(payload)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(botToken)));
  payload.hash = hex(await hmac(secret, dataCheckString));
  return payload;
}

async function resolveTelegramAuthUser(env, telegram) {
  // The deployed mobile function accepts Login Widget fields. Re-sign the
  // identity that was already verified from Mini App initData in that format.
  // The newer function accepts this format too, keeping rollout backwards-compatible.
  const authPayload = await telegramWidgetPayload(telegram, env.TELEGRAM_BOT_TOKEN);
  const response = await fetch(`${env.SUPABASE_URL}/functions/v1/telegram-auth`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(authPayload),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.session?.user?.id) {
    throw new Error(payload?.error || 'Unable to resolve the shared Telegram account');
  }
  return payload.session.user.id;
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
    profile_photo_url: user.profile_photo_url || '',
    photo_url: user.profile_photo_url || user.telegram_photo_url || '',
    referral_code: user.referral_code || '',
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
  // The Edge Function owns Telegram -> Supabase Auth identity resolution.
  // Both the native app and TMA therefore receive the same canonical UUID.
  const canonicalUserId = await resolveTelegramAuthUser(env, telegram);
  const existing = await supabase(
    env,
    `users?select=id&id=eq.${canonicalUserId}&limit=1`,
  );
  let users;
  if (existing?.[0]?.id) {
    const loginUpdate = {
      telegram_id: profile.telegram_id,
      telegram_username: profile.telegram_username,
      telegram_photo_url: profile.telegram_photo_url,
      telegram_language_code: profile.telegram_language_code,
      last_login_at: profile.last_login_at,
    };
    users = await supabase(
      env,
      `users?id=eq.${existing[0].id}&select=id,name,email,phone_number,emergency_contact,location,telegram_id,telegram_username,telegram_photo_url,profile_photo_url,referral_code`,
      { method: 'PATCH', body: loginUpdate, headers: { Prefer: 'return=representation' } },
    );
  } else {
    users = await supabase(
      env,
      'users?select=id,name,email,phone_number,emergency_contact,location,telegram_id,telegram_username,telegram_photo_url,profile_photo_url,referral_code',
      { method: 'POST', body: { id: canonicalUserId, ...profile }, headers: { Prefer: 'return=representation' } },
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
  const [destinations, trips, providers, stations, links] = await Promise.all([
    supabase(env, 'destinations?select=id,name,description,region,city,distance,images,tags,category,location&order=name.asc'),
    supabase(env, `trips?select=id,destination_id,provider_id,trip_type,departure_date,return_date,price,available_seats,max_seats,itinerary,status&status=in.(active,upcoming)&departure_date=gt.${encodeURIComponent(new Date().toISOString())}&order=departure_date.asc`),
    supabase(env, 'providers?select=id,name,description,logo_url,rating,total_trips&status=eq.active&order=name.asc'),
    supabase(env, 'pickup_stations?select=id,provider_id,name,city,address,is_active&is_active=eq.true&order=name.asc'),
    supabase(env, 'trip_pickup_stations?select=trip_id,station_id,pickup_time,extra_price'),
  ]);
  const catalogDestinations = destinations.map(destination => {
    const prices = trips
      .filter(trip => trip.destination_id === destination.id)
      .map(trip => Number(trip.price))
      .filter(Number.isFinite);
    return {
      ...destination,
      price: prices.length ? Math.min(...prices) : null,
      is_verified: true,
    };
  });
  const catalogProviders = providers.map(provider => ({
    ...provider,
    logo_url: provider.logo_url ? `/api/providers/${provider.id}/logo` : null,
  }));
  return json({ destinations: catalogDestinations, trips, providers: catalogProviders, stations, trip_pickup_stations: links });
}

async function getProviderLogo(providerId, env) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(providerId)) {
    return json({ error: 'Invalid provider' }, 400);
  }
  const providers = await supabase(env, `providers?select=logo_url&id=eq.${providerId}&limit=1`);
  const logoUrl = providers?.[0]?.logo_url;
  if (!logoUrl) return json({ error: 'Provider logo not found' }, 404);
  const logoResponse = await fetch(logoUrl);
  if (!logoResponse.ok) return json({ error: 'Provider logo unavailable' }, 502);
  const contentType = logoResponse.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) return json({ error: 'Invalid provider logo' }, 502);
  return new Response(logoResponse.body, {
    status: 200,
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
      'x-content-type-options': 'nosniff',
    },
  });
}

async function getBookings(session, env) {
  await supabase(env, 'rpc/delete_expired_unpaid_bookings', { method: 'POST', body: {} });
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
      email: 'payments@tankua.co',
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
    const details = readableError(result.message || result.errors || result.data);
    console.error(JSON.stringify({
      event: 'chapa_initialize_failed',
      status: response.status,
      details: details || 'No error details returned',
    }));
    const error = new Error(details || 'Unable to initialize payment');
    error.status = response.status >= 500 ? 502 : 400;
    throw error;
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

async function updateProfile(request, session, env) {
  const body = await request.json();
  const updates = {};
  const clean = (value, limit) => String(value || '').trim().slice(0, limit);
  if (body.name !== undefined) {
    updates.name = clean(body.name, 120);
    if (updates.name.length < 2) throw new Error('Name must contain at least 2 characters');
  }
  if (body.email !== undefined) {
    updates.email = clean(body.email, 254);
    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) throw new Error('Enter a valid email address');
  }
  if (body.phone_number !== undefined) {
    updates.phone_number = clean(body.phone_number, 32);
    if (updates.phone_number.length < 7) throw new Error('Enter a valid phone number');
  }
  if (body.emergency_contact !== undefined) updates.emergency_contact = clean(body.emergency_contact, 32);
  if (body.location !== undefined) updates.location = clean(body.location, 180);

  const users = await supabase(env, `users?id=eq.${session.uid}&select=id,name,email,phone_number,emergency_contact,location,telegram_username,telegram_photo_url,profile_photo_url,referral_code`, {
    method: 'PATCH',
    body: updates,
    headers: { Prefer: 'return=representation' },
  });
  return json({ user: safeUser(users?.[0] || {}) });
}

async function updateProfilePhoto(request, session, env) {
  const { data_url: dataUrl } = await request.json();
  const match = String(dataUrl || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Choose a JPG, PNG, or WebP image');
  if (match[2].length > 2800000) throw new Error('Profile image must be smaller than 2 MB');
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const contentType = match[1] === 'jpeg' ? 'image/jpeg' : `image/${match[1]}`;
  const bytes = Uint8Array.from(atob(match[2]), character => character.charCodeAt(0));
  const objectPath = `${session.uid}/avatar.${extension}`;
  const upload = await fetch(`${env.SUPABASE_URL}/storage/v1/object/user-avatars/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': contentType,
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!upload.ok) {
    const details = await upload.text();
    console.error(JSON.stringify({ event: 'profile_photo_upload_failed', status: upload.status, details }));
    throw new Error('Unable to upload profile photo');
  }
  const photoUrl = `${env.SUPABASE_URL}/storage/v1/object/public/user-avatars/${objectPath}?v=${Date.now()}`;
  const users = await supabase(env, `users?id=eq.${session.uid}&select=id,name,email,phone_number,emergency_contact,location,telegram_username,telegram_photo_url,profile_photo_url,referral_code`, {
    method: 'PATCH',
    body: { profile_photo_url: photoUrl },
    headers: { Prefer: 'return=representation' },
  });
  return json({ user: safeUser(users?.[0] || {}) });
}

async function getCloseFriends(session, env) {
  const relationships = await supabase(env, `close_friends?select=id,friend_user_id,created_at&user_id=eq.${session.uid}&order=created_at.desc`);
  const friendIds = relationships.map(item => item.friend_user_id).filter(Boolean);
  if (!friendIds.length) return [];
  const users = await supabase(env, `users?select=id,name,phone_number,telegram_username,telegram_photo_url,profile_photo_url&id=in.(${friendIds.join(',')})`);
  const usersById = new Map(users.map(user => [user.id, user]));
  return relationships.map(relationship => {
    const friend = usersById.get(relationship.friend_user_id) || {};
    return {
      id: relationship.id,
      friend_user_id: relationship.friend_user_id,
      name: friend.name || friend.telegram_username || 'Tankua traveler',
      phone: friend.phone_number?.startsWith('telegram:') ? '' : (friend.phone_number || ''),
      photo_url: friend.profile_photo_url || friend.telegram_photo_url || '',
      trips_together: 0,
      created_at: relationship.created_at,
    };
  });
}

async function getProfileOverview(session, env) {
  const [users, favorites, suggestions, friends, rewards, rewardTransactions, coupons, notifications, preferences] = await Promise.all([
    supabase(env, `users?select=id,name,email,phone_number,emergency_contact,location,telegram_username,telegram_photo_url,profile_photo_url,referral_code&id=eq.${session.uid}&limit=1`),
    supabase(env, `user_favorites?select=destination_id&user_id=eq.${session.uid}&order=created_at.desc`),
    supabase(env, `trip_suggestions?select=id,origin,destination,message,status,created_at&user_id=eq.${session.uid}&order=created_at.desc`),
    getCloseFriends(session, env),
    supabase(env, `rewards_points?select=current_points&user_id=eq.${session.uid}&limit=1`),
    supabase(env, `rewards_transactions?select=id,type,amount,description,created_at&user_id=eq.${session.uid}&order=created_at.desc&limit=20`),
    supabase(env, `promotions?select=id,code,name,description,discount_type,discount_value,valid_until&is_active=eq.true&valid_from=lte.${encodeURIComponent(new Date().toISOString())}&valid_until=gt.${encodeURIComponent(new Date().toISOString())}&order=valid_until.asc`),
    supabase(env, `notifications?select=id,title,message,type,is_read,created_at,data&recipient_type=eq.user&recipient_id=eq.${session.uid}&order=created_at.desc&limit=50`),
    supabase(env, `user_notification_preferences?select=push_enabled,sms_enabled&user_id=eq.${session.uid}&limit=1`),
  ]);
  const user = safeUser(users?.[0] || {});
  return json({
    user,
    favorites: favorites.map(item => item.destination_id),
    suggestions,
    friends,
    rewards: rewards?.[0] || { current_points: 0, total_earned: 0, total_redeemed: 0 },
    reward_transactions: rewardTransactions,
    coupons,
    payment_methods: [],
    notifications,
    notification_preferences: preferences?.[0] || { push_enabled: true, sms_enabled: false },
    referral_code: user.referral_code || `TNK-${String(session.uid).replaceAll('-', '').slice(0, 8).toUpperCase()}`,
  });
}

async function changeFavorite(request, session, env, remove = false) {
  const { destination_id: destinationId } = await request.json();
  if (!/^[0-9a-f-]{36}$/i.test(String(destinationId || ''))) throw new Error('Invalid destination');
  if (remove) {
    await supabase(env, `user_favorites?user_id=eq.${session.uid}&destination_id=eq.${destinationId}`, {
      method: 'DELETE', headers: { Prefer: 'return=minimal' },
    });
  } else {
    await supabase(env, 'user_favorites?on_conflict=user_id,destination_id', {
      method: 'POST',
      body: { user_id: session.uid, destination_id: destinationId },
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
  }
  return json({ success: true });
}

async function suggestTrip(request, session, env) {
  const body = await request.json();
  const origin = String(body.origin || '').trim().slice(0, 120);
  const destination = String(body.destination || '').trim().slice(0, 120);
  const message = String(body.message || '').trim().slice(0, 1000);
  if (origin.length < 2 || destination.length < 2) throw new Error('Origin and destination are required');
  const rows = await supabase(env, 'trip_suggestions?select=id,origin,destination,message,status,created_at', {
    method: 'POST',
    body: { user_id: session.uid, origin, destination, message: message || null },
    headers: { Prefer: 'return=representation' },
  });
  return json({ suggestion: rows?.[0] }, 201);
}

async function addFriend(request, session, env) {
  const body = await request.json();
  const phone = String(body.phone || '').trim().slice(0, 32);
  if (phone.length < 7) throw new Error('Enter a valid phone number');
  const matches = await supabase(env, `users?select=id,name,phone_number,telegram_username,telegram_photo_url,profile_photo_url&phone_number=eq.${encodeURIComponent(phone)}&limit=1`);
  const friend = matches?.[0];
  if (!friend) return json({ error: 'No Tankua account was found with that phone number' }, 404);
  if (friend.id === session.uid) throw new Error('You cannot add yourself as a friend');
  const existing = await supabase(env, `close_friends?select=id,friend_user_id,created_at&user_id=eq.${session.uid}&friend_user_id=eq.${friend.id}&limit=1`);
  if (existing?.[0]) return json({ friend: { ...existing[0], name: friend.name, phone: friend.phone_number, photo_url: friend.profile_photo_url || friend.telegram_photo_url || '' } });
  const rows = await supabase(env, 'close_friends?select=id,friend_user_id,created_at', {
    method: 'POST',
    body: { user_id: session.uid, friend_user_id: friend.id },
    headers: { Prefer: 'return=representation' },
  });
  return json({ friend: { ...rows?.[0], name: friend.name, phone: friend.phone_number, photo_url: friend.profile_photo_url || friend.telegram_photo_url || '' } }, 201);
}

async function updateNotificationPreferences(request, session, env) {
  const body = await request.json();
  const preferences = {
    user_id: session.uid,
    push_enabled: Boolean(body.push_enabled),
    sms_enabled: Boolean(body.sms_enabled),
    updated_at: new Date().toISOString(),
  };
  const rows = await supabase(env, 'user_notification_preferences?on_conflict=user_id&select=push_enabled,sms_enabled', {
    method: 'POST', body: preferences, headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
  return json({ preferences: rows?.[0] || preferences });
}

async function deleteProfile(session, env) {
  await supabase(env, `users?id=eq.${session.uid}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return json({ success: true });
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
  const providerLogoMatch = url.pathname.match(/^\/api\/providers\/([0-9a-f-]+)\/logo$/i);
  if (providerLogoMatch && request.method === 'GET') return getProviderLogo(providerLogoMatch[1], env);
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
    const users = await supabase(env, `users?select=id,name,email,phone_number,emergency_contact,location,telegram_username,telegram_photo_url,profile_photo_url,referral_code&id=eq.${session.uid}&limit=1`);
    return json({ user: safeUser(users?.[0] || {}) });
  }
  if (url.pathname === '/api/bookings' && request.method === 'GET') return getBookings(session, env);
  if (url.pathname === '/api/bookings' && request.method === 'POST') return createBooking(request, session, env);
  if (url.pathname === '/api/payments/chapa' && request.method === 'POST') return initializePayment(request, session, env);
  if (url.pathname === '/api/payments/status' && request.method === 'GET') return verifyPayment(url.searchParams.get('tx_ref') || '', env, session.uid);
  if (url.pathname === '/api/profile' && request.method === 'PUT') return updateProfile(request, session, env);
  if (url.pathname === '/api/profile' && request.method === 'DELETE') return deleteProfile(session, env);
  if (url.pathname === '/api/profile/photo' && request.method === 'POST') return updateProfilePhoto(request, session, env);
  if (url.pathname === '/api/profile/overview' && request.method === 'GET') return getProfileOverview(session, env);
  if (url.pathname === '/api/favorites' && request.method === 'POST') return changeFavorite(request, session, env);
  if (url.pathname === '/api/favorites' && request.method === 'DELETE') return changeFavorite(request, session, env, true);
  if (url.pathname === '/api/suggestions' && request.method === 'POST') return suggestTrip(request, session, env);
  if (url.pathname === '/api/friends' && request.method === 'POST') return addFriend(request, session, env);
  const friendMatch = url.pathname.match(/^\/api\/friends\/([0-9a-f-]{36})$/i);
  if (friendMatch && request.method === 'DELETE') {
    await supabase(env, `close_friends?id=eq.${friendMatch[1]}&user_id=eq.${session.uid}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    return json({ success: true });
  }
  if (url.pathname === '/api/notification-preferences' && request.method === 'PUT') return updateNotificationPreferences(request, session, env);
  const notificationMatch = url.pathname.match(/^\/api\/notifications\/([0-9a-f-]{36})\/read$/i);
  if (notificationMatch && request.method === 'POST') {
    await supabase(env, `notifications?id=eq.${notificationMatch[1]}&recipient_type=eq.user&recipient_id=eq.${session.uid}`, {
      method: 'PATCH', body: { is_read: true, read_at: new Date().toISOString() }, headers: { Prefer: 'return=minimal' },
    });
    return json({ success: true });
  }
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
      'content-security-policy': "default-src 'self'; script-src 'self' https://telegram.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' https: data:; connect-src 'self' https://api.chapa.co; frame-ancestors https://web.telegram.org https://*.telegram.org;",
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
