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
let lastReleasePayload = null;
let lastCancelPayload = null;
let lastQuotePayload = null;
let lastBookingPayload = null;
let bookingRecord = null;
let transactionRecord = null;
let chapaVerification = null;
let rejectPaymentClaim = false;
let extraBookableTrips = [];
let closeoutPaymentChecks = [];
const paymentSteps = [];
const collectingTrip = { id: tripId, destination_id: 'destination', provider_id: 'provider', price: 100, status: 'collecting_interest', minimum_interest: 3, interest_count: 2 };
const bookableTrip = { id: nextTripId, destination_id: 'destination', provider_id: 'provider', price: 200, status: 'upcoming', minimum_interest: null, interest_count: 0 };
globalThis.fetch = async (url, options = {}) => {
  const value = String(url);
  const requestUrl = new URL(value);
  switch (requestUrl.pathname) {
    case '/rest/v1/rpc/delete_expired_unpaid_bookings':
      return Response.json(0);
    case '/rest/v1/rpc/list_closeout_payment_checks':
      return Response.json(closeoutPaymentChecks);
    case '/rest/v1/rpc/create_miniapp_booking':
      lastBookingPayload = JSON.parse(options.body);
      return Response.json({ id: bookingId, pickup_station: { pickup_address: lastBookingPayload.p_pickup_address } });
    case '/rest/v1/bookings':
      if (options.method === 'PATCH') {
        paymentSteps.push({ method: 'BOOKING', body: JSON.parse(options.body) });
        return new Response(null, { status: 204 });
      }
      assert.equal(requestUrl.searchParams.get('user_id'), `eq.${userId}`);
      assert.match(requestUrl.searchParams.get('select'), /scheduled_trip:trips\(status,departure_date,return_date,duration_minutes,revised_end_at,closeout_reason\)/);
      // The My Trips list (select=*) carries refunds; payment lookups don't need them.
      if (requestUrl.searchParams.get('select').startsWith('*')) {
        assert.match(requestUrl.searchParams.get('select'), /refunds\(status,amount,currency\)/);
      }
      return Response.json(bookingRecord ? [bookingRecord] : []);
    case '/rest/v1/payment_transactions': {
      if (!options.method || options.method === 'GET') {
        return Response.json(transactionRecord ? [transactionRecord] : []);
      }
      paymentSteps.push({ method: options.method, body: JSON.parse(options.body) });
      if (options.method === 'POST' && rejectPaymentClaim) {
        return Response.json({ message: 'Payment opens when this trip becomes active' }, { status: 409 });
      }
      return new Response(null, { status: 204 });
    }
    case '/v1/transaction/initialize':
      paymentSteps.push({ method: 'CHAPA', body: JSON.parse(options.body) });
      return Response.json({ status: 'success', data: { checkout_url: 'https://checkout.chapa.co/test' } });
    case '/rest/v1/rpc/booking_cancellation_terms':
      lastQuotePayload = JSON.parse(options.body);
      return Response.json({ can_cancel: true, paid: true, refund_amount: 1050, refund_percentage: 100, currency: 'ETB' });
    case '/rest/v1/rpc/cancel_paid_booking_for_user':
      lastCancelPayload = JSON.parse(options.body);
      return Response.json({ status: 'cancelled', refund_amount: 1050 });
    case '/rest/v1/rpc/release_unpaid_booking_for_user':
      lastReleasePayload = JSON.parse(options.body);
      return Response.json({ booking_id: lastReleasePayload.p_booking_id, status: 'cancelled', seats_released: 2 });
    case '/rest/v1/rpc/express_trip_interest_for_user': {
      lastInterestPayload = JSON.parse(options.body);
      return Response.json({ trip_id: tripId, status: 'upcoming', minimum_interest: 3, interest_count: 3, interested: true });
    }
    case '/rest/v1/destinations':
      return Response.json([{ id: 'destination', name: 'Test destination' }]);
    case '/rest/v1/trips':
      assert.equal(requestUrl.searchParams.get('status'), 'in.(active,upcoming,collecting_interest)');
      return Response.json([collectingTrip, bookableTrip, ...extraBookableTrips]);
    case '/rest/v1/providers':
      return Response.json([{ id: 'provider', name: 'Test provider' }]);
    case '/rest/v1/pickup_stations':
    case '/rest/v1/trip_pickup_stations':
      return Response.json([]);
    case '/rest/v1/trip_interests':
      assert.equal(requestUrl.searchParams.get('user_id'), `eq.${userId}`);
      return Response.json([{ trip_id: tripId, seats: 3, pickup_station_id: '7d1e3c2a-5b4f-4a8e-9c1d-2f3e4a5b6c7d', pickup_address: null, booking_id: null }]);
  }
  if (requestUrl.pathname.startsWith('/v1/transaction/verify/')) {
    assert.equal(requestUrl.pathname.split('/').at(-1), transactionRecord.transaction_ref);
    return Response.json({ status: 'success', data: chapaVerification });
  }
  if (requestUrl.pathname.startsWith('/v1/transaction/cancel/')) {
    assert.equal(options.method, 'PUT');
    assert.equal(requestUrl.pathname.split('/').at(-1), transactionRecord.transaction_ref);
    paymentSteps.push({ method: 'CANCEL_LINK' });
    return Response.json({ status: 'success' });
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
test('checks an overdue payment and closes an unpaid checkout before loading trip history', async (t) => {
  const reference = 'overdue-payment-test';
  closeoutPaymentChecks = [{ transaction_ref: reference }];
  transactionRecord = { transaction_ref: reference, user_id: userId, booking_id: bookingId, status: 'pending', currency: 'USD', amount: 25 };
  chapaVerification = { tx_ref: reference, status: 'pending', currency: 'USD', amount: 25 };
  paymentSteps.length = 0;
  t.after(() => {
    closeoutPaymentChecks = [];
    transactionRecord = null;
    chapaVerification = null;
    paymentSteps.length = 0;
  });

  const response = await worker.fetch(new Request(env.APP_ORIGIN + '/api/bookings', {
    headers: { cookie: travelerSession() },
  }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(paymentSteps, [{ method: 'CANCEL_LINK' }, { method: 'PATCH', body: { status: 'cancelled' } }]);
});

test('passes the traveler pickup address to the booking RPC after validating it', async () => {
  const reserve = pickup_address => worker.fetch(new Request(`${env.APP_ORIGIN}/api/bookings`, {
    method: 'POST',
    headers: { cookie: travelerSession(), origin: env.APP_ORIGIN, 'content-type': 'application/json' },
    body: JSON.stringify({
      trip_id: tripId, station_id: nextTripId, idempotency_key: bookingId, seats: 1,
      passengers: [{ name: 'Test Traveler', age: 30 }], pickup_address,
    }),
  }), env);

  assert.equal((await reserve('   ')).status, 400);
  assert.equal(lastBookingPayload, null);

  const reservation = await reserve('  Sample Hotel, Main Lobby  ');
  assert.equal(reservation.status, 201);
  assert.equal(lastBookingPayload.p_pickup_address, 'Sample Hotel, Main Lobby');
  assert.equal((await reservation.json()).booking.pickup_station.pickup_address, 'Sample Hotel, Main Lobby');

  assert.equal((await reserve(undefined)).status, 201);
  assert.equal(lastBookingPayload.p_pickup_address, null);
});

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
    body: JSON.stringify({ user_id: 'ignore-caller-identity', seats: 3, pickup_station_id: '7d1e3c2a-5b4f-4a8e-9c1d-2f3e4a5b6c7d', pickup_address: '  Bole  ' }),
  }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(lastInterestPayload, {
    p_trip_id: tripId, p_user_id: userId, p_seats: 3, p_pickup_station_id: '7d1e3c2a-5b4f-4a8e-9c1d-2f3e4a5b6c7d', p_pickup_address: 'Bole',
  });
  assert.deepEqual(await response.json(), {
    interest: { trip_id: tripId, status: 'upcoming', minimum_interest: 3, interest_count: 3, interested: true },
  });

  // Older clients send no seat count: one seat.
  await worker.fetch(new Request(interestUrl, {
    method: 'POST',
    headers: { cookie: travelerSession(), origin: env.APP_ORIGIN },
  }), env);
  assert.deepEqual(lastInterestPayload, {
    p_trip_id: tripId, p_user_id: userId, p_seats: 1, p_pickup_station_id: null, p_pickup_address: null,
  });

  lastInterestPayload = null;
  for (const seats of [0, 9, 2.5, 'four']) {
    const invalid = await worker.fetch(new Request(interestUrl, {
      method: 'POST',
      headers: { cookie: travelerSession(), origin: env.APP_ORIGIN },
      body: JSON.stringify({ seats }),
    }), env);
    assert.equal(invalid.status, 400, `seats ${seats} should be rejected`);
  }
  assert.equal(lastInterestPayload, null);

  const badPickup = await worker.fetch(new Request(interestUrl, {
    method: 'POST',
    headers: { cookie: travelerSession(), origin: env.APP_ORIGIN },
    body: JSON.stringify({ seats: 2, pickup_station_id: 'not-a-uuid' }),
  }), env);
  assert.equal(badPickup.status, 400);
  assert.equal(lastInterestPayload, null);
});

test('travelers quote and cancel their own paid booking through the Worker', async () => {
  const base = `${env.APP_ORIGIN}/api/bookings/c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f`;
  assert.equal((await worker.fetch(new Request(`${base}/cancellation`), env)).status, 401);
  assert.equal((await worker.fetch(new Request(`${base}/cancel`, { method: 'POST' }), env)).status, 401);
  assert.equal(lastQuotePayload, null);
  assert.equal(lastCancelPayload, null);

  const quote = await worker.fetch(new Request(`${base}/cancellation`, { headers: { cookie: travelerSession() } }), env);
  assert.equal(quote.status, 200);
  assert.deepEqual(lastQuotePayload, { p_booking_id: 'c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f', p_user_id: userId });
  assert.equal((await quote.json()).quote.refund_amount, 1050);

  const cancelled = await worker.fetch(new Request(`${base}/cancel`, {
    method: 'POST',
    headers: { cookie: travelerSession(), origin: env.APP_ORIGIN },
    body: JSON.stringify({ user_id: 'ignore-caller-identity', reason: '  Plans changed  ' }),
  }), env);
  assert.equal(cancelled.status, 200);
  assert.deepEqual(lastCancelPayload, { p_booking_id: 'c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f', p_user_id: userId, p_reason: 'Plans changed' });
});

test('travelers release their own unpaid reservation through the Worker', async () => {
  const releaseUrl = `${env.APP_ORIGIN}/api/bookings/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e/release`;
  const unauthorized = await worker.fetch(new Request(releaseUrl, { method: 'POST' }), env);
  assert.equal(unauthorized.status, 401);
  assert.equal(lastReleasePayload, null);

  const response = await worker.fetch(new Request(releaseUrl, {
    method: 'POST',
    headers: { cookie: travelerSession(), origin: env.APP_ORIGIN },
    body: JSON.stringify({ user_id: 'ignore-caller-identity' }),
  }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(lastReleasePayload, { p_booking_id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', p_user_id: userId });
  assert.equal((await response.json()).released.status, 'cancelled');
});

test('catalog displays interest progress without using gated fares as bookable prices', async () => {
  const catalogUrl = `${env.APP_ORIGIN}/api/catalog`;
  const authorized = await worker.fetch(new Request(catalogUrl, { headers: { cookie: travelerSession() } }), env);
  const anonymous = await worker.fetch(new Request(catalogUrl), env);
  assert.equal(authorized.status, 200);
  assert.equal(anonymous.status, 200);
  const catalog = await authorized.json();
  assert.equal(catalog.destinations[0].price, 200);
  assert.equal(catalog.destinations[0].currency, 'ETB');
  assert.deepEqual(catalog.trips, [
    {
      ...collectingTrip, interested: true, pledged_seats: 3,
      pledged_pickup_station_id: '7d1e3c2a-5b4f-4a8e-9c1d-2f3e4a5b6c7d', pledged_pickup_address: null, reserved_booking_id: null,
    },
    {
      ...bookableTrip, interested: false, pledged_seats: null,
      pledged_pickup_station_id: null, pledged_pickup_address: null, reserved_booking_id: null,
    },
  ]);
  assert.equal((await anonymous.json()).trips[0].interested, false);
});

test('catalog avoids comparing prices in different currencies', async (t) => {
  extraBookableTrips = [{ ...bookableTrip, id: 'dollar-trip', currency: 'USD', price: 10 }];
  t.after(() => { extraBookableTrips = []; });

  const response = await worker.fetch(new Request(`${env.APP_ORIGIN}/api/catalog`), env);
  assert.equal(response.status, 200);
  const catalog = await response.json();
  assert.equal(catalog.destinations[0].price, null);
  assert.equal(catalog.destinations[0].currency, null);
  assert.equal(catalog.trips.find(trip => trip.id === 'dollar-trip').currency, 'USD');
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
  assert.equal(paymentSteps[0].body.currency, 'ETB');
  assert.equal(paymentSteps[1].body.currency, 'ETB');
  assert.deepEqual(paymentSteps[2].body, { checkout_url: checkout.checkout_url });

  paymentSteps.length = 0;
  rejectPaymentClaim = true;
  const statusChanged = await payment();
  assert.equal(statusChanged.status, 409);
  assert.deepEqual(paymentSteps.map(step => step.method), ['POST']);
});

test('charges a USD booking in USD and verifies its currency, amount, and reference', async (t) => {
  const future = new Date(Date.now() + 3600000).toISOString();
  const headers = { cookie: travelerSession(), origin: env.APP_ORIGIN };
  bookingRecord = {
    id: bookingId,
    status: 'confirmed',
    payment_status: 'pending',
    payment_deadline: future,
    total_price: 21.49,
    currency: 'USD',
    scheduled_trip: { status: 'active', departure_date: future },
  };
  rejectPaymentClaim = false;
  paymentSteps.length = 0;
  t.after(() => {
    bookingRecord = null;
    transactionRecord = null;
    chapaVerification = null;
    paymentSteps.length = 0;
  });

  const created = await worker.fetch(new Request(`${env.APP_ORIGIN}/api/payments/chapa`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ booking_id: bookingId }),
  }), env);
  assert.equal(created.status, 200);
  const { transaction_ref: reference } = await created.json();
  assert.equal(paymentSteps[0].body.currency, 'USD');
  assert.equal(paymentSteps[1].body.currency, 'USD');
  assert.equal(paymentSteps[1].body.amount, '21.49');
  transactionRecord = paymentSteps[0].body;
  paymentSteps.length = 0;

  const verify = async () => {
    const response = await worker.fetch(new Request(`${env.APP_ORIGIN}/api/payments/status?tx_ref=${reference}`, { headers }), env);
    assert.equal(response.status, 200);
    return (await response.json()).paid;
  };
  chapaVerification = { status: 'success', currency: 'ETB', amount: 21.49, tx_ref: reference };
  assert.equal(await verify(), false);
  chapaVerification = { ...chapaVerification, currency: 'USD', amount: 21.50 };
  assert.equal(await verify(), false);
  chapaVerification = { ...chapaVerification, amount: 21.49, tx_ref: 'another-reference' };
  assert.equal(await verify(), false);
  assert.deepEqual(paymentSteps, []);
  chapaVerification = { ...chapaVerification, tx_ref: reference };
  assert.equal(await verify(), true);
  assert.deepEqual(paymentSteps.map(step => step.method), ['PATCH', 'BOOKING']);
});
