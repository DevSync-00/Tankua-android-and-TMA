import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

const worker = (await import('../server/worker-template.js')).default;
const botToken = '123456:test-bot-token';
const sessionSecret = 'a-production-session-secret-with-more-than-32-bytes';
const userId = '7864c70e-43e8-4ded-85b5-63395076899a';
const tripId = '86d68800-4bf8-411f-a4f4-066c25201549';
const nextTripId = '29472ff9-377c-42f2-88c5-72ade933d7fd';
const bookingId = '3cf8ff1b-bdfd-47b5-96ff-8ca95cd4ce04';

function travelerSession() {
  const session = Buffer.from(JSON.stringify({
    uid: userId,
    tid: '99887766',
    exp: Math.floor(Date.now() / 1000) + 60,
  })).toString('base64url');
  const signature = createHmac('sha256', sessionSecret).update(session).digest('base64url');
  return `tankua_session=${session}.${signature}`;
}

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
let lastInterestPayload = null;
let bookingRecord = null;
let rejectPaymentClaim = false;
const paymentSteps = [];
const collectingTrip = { id: tripId, destination_id: 'destination', provider_id: 'provider', price: 100, status: 'collecting_interest', minimum_interest: 3, interest_count: 2 };
const bookableTrip = { id: nextTripId, destination_id: 'destination', provider_id: 'provider', price: 200, status: 'upcoming', minimum_interest: null, interest_count: 0 };
globalThis.fetch = async (url, options = {}) => {
  const value = String(url);
  const requestUrl = new URL(value);
  switch (requestUrl.pathname) {
    case '/rest/v1/rpc/delete_expired_unpaid_bookings':
      return Response.json(0);
    case '/rest/v1/bookings':
      assert.equal(requestUrl.searchParams.get('user_id'), `eq.${userId}`);
      assert.match(requestUrl.searchParams.get('select'), /scheduled_trip:trips\(status,departure_date\)/);
      return Response.json(bookingRecord ? [bookingRecord] : []);
    case '/rest/v1/payment_transactions': {
      paymentSteps.push({ method: options.method, body: JSON.parse(options.body) });
      if (options.method === 'POST' && rejectPaymentClaim) {
        return Response.json({ message: 'Payment opens when this trip becomes active' }, { status: 409 });
      }
      return new Response(null, { status: 204 });
    }
    case '/v1/transaction/initialize':
      paymentSteps.push({ method: 'CHAPA', body: JSON.parse(options.body) });
      return Response.json({ status: 'success', data: { checkout_url: 'https://checkout.chapa.co/test' } });
    case '/rest/v1/rpc/express_trip_interest_for_user': {
      lastInterestPayload = JSON.parse(options.body);
      return Response.json({ trip_id: tripId, status: 'upcoming', minimum_interest: 3, interest_count: 3, interested: true });
    }
    case '/rest/v1/destinations':
      return Response.json([{ id: 'destination', name: 'Test destination' }]);
    case '/rest/v1/trips':
      assert.equal(requestUrl.searchParams.get('status'), 'in.(active,upcoming,collecting_interest)');
      return Response.json([collectingTrip, bookableTrip]);
    case '/rest/v1/providers':
      return Response.json([{ id: 'provider', name: 'Test provider' }]);
    case '/rest/v1/pickup_stations':
    case '/rest/v1/trip_pickup_stations':
      return Response.json([]);
    case '/rest/v1/trip_interests':
      assert.equal(requestUrl.searchParams.get('user_id'), `eq.${userId}`);
      return Response.json([{ trip_id: tripId }]);
  }
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
  CHAPA_SECRET_KEY: 'test-payment-key',
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
  assert.equal(lastEdgePayload.verified_telegram_user.id, 99887766);
  assert.equal(typeof lastEdgePayload.verified_at, 'number');
  assert.deepEqual(Object.keys(lastEdgePayload), ['init_data', 'verified_telegram_user', 'verified_at']);
  assert.match(response.headers.get('set-cookie'), /tankua_session=.*HttpOnly.*Secure.*SameSite=Lax/);
});

test('interest registration requires a session and uses its traveler identity', async () => {
  const interestUrl = `${env.APP_ORIGIN}/api/trips/${tripId}/interest`;
  const unauthorized = await worker.fetch(new Request(interestUrl, { method: 'POST' }), env);
  assert.equal(unauthorized.status, 401);
  assert.equal(lastInterestPayload, null);

  const denied = await worker.fetch(new Request(interestUrl, {
    method: 'POST',
    headers: { cookie: travelerSession(), origin: 'https://other.example' },
  }), env);
  assert.equal(denied.status, 403);
  assert.equal(lastInterestPayload, null);

  const response = await worker.fetch(new Request(interestUrl, {
    method: 'POST',
    headers: { cookie: travelerSession(), origin: env.APP_ORIGIN },
    body: JSON.stringify({ user_id: 'ignore-caller-identity' }),
  }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(lastInterestPayload, { p_trip_id: tripId, p_user_id: userId });
  assert.deepEqual(await response.json(), {
    interest: { trip_id: tripId, status: 'upcoming', minimum_interest: 3, interest_count: 3, interested: true },
  });
});

test('catalog displays interest progress without using gated fares as bookable prices', async () => {
  const catalogUrl = `${env.APP_ORIGIN}/api/catalog`;
  const authorized = await worker.fetch(new Request(catalogUrl, { headers: { cookie: travelerSession() } }), env);
  const anonymous = await worker.fetch(new Request(catalogUrl), env);
  assert.equal(authorized.status, 200);
  assert.equal(anonymous.status, 200);
  const catalog = await authorized.json();
  assert.equal(catalog.destinations[0].price, 200);
  assert.deepEqual(catalog.trips, [{ ...collectingTrip, interested: true }, { ...bookableTrip, interested: false }]);
  assert.equal((await anonymous.json()).trips[0].interested, false);
});

test('keeps an upcoming reservation in Trips and enables checkout only after activation', async () => {
  const future = new Date(Date.now() + 3600000).toISOString();
  const headers = { cookie: travelerSession(), origin: env.APP_ORIGIN };
  const bookingList = () => worker.fetch(new Request(`${env.APP_ORIGIN}/api/bookings`, { headers }), env);
  const payment = () => worker.fetch(new Request(`${env.APP_ORIGIN}/api/payments/chapa`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ booking_id: bookingId }),
  }), env);
  bookingRecord = {
    id: bookingId,
    status: 'confirmed',
    payment_status: 'pending',
    payment_deadline: null,
    total_price: 210,
    scheduled_trip: { status: 'upcoming', departure_date: future },
  };
  assert.deepEqual((await (await bookingList()).json()).bookings, [bookingRecord]);
  assert.equal((await payment()).status, 409);

  // An older reservation can still have a deadline. Trip status controls checkout.
  bookingRecord.payment_deadline = future;
  const upcoming = await payment();
  assert.equal(upcoming.status, 409);
  assert.match((await upcoming.json()).error, /becomes active/);
  assert.deepEqual(paymentSteps, []);

  bookingRecord.scheduled_trip.status = 'active';
  bookingRecord.payment_deadline = null;
  assert.equal((await payment()).status, 409);
  assert.deepEqual(paymentSteps, []);

  bookingRecord.payment_deadline = future;
  assert.equal((await (await bookingList()).json()).bookings[0].scheduled_trip.status, 'active');
  const active = await payment();
  assert.equal(active.status, 200);
  const checkout = await active.json();
  assert.equal(checkout.checkout_url, 'https://checkout.chapa.co/test');
  assert.deepEqual(paymentSteps.map(step => step.method), ['POST', 'CHAPA', 'PATCH']);
  assert.equal(paymentSteps[0].body.transaction_ref, checkout.transaction_ref);
  assert.equal(paymentSteps[1].body.tx_ref, checkout.transaction_ref);
  assert.deepEqual(paymentSteps[2].body, { checkout_url: checkout.checkout_url });

  paymentSteps.length = 0;
  rejectPaymentClaim = true;
  const statusChanged = await payment();
  assert.equal(statusChanged.status, 409);
  assert.deepEqual(paymentSteps.map(step => step.method), ['POST']);
});
