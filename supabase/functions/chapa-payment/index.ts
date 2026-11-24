import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Server-side Chapa integration for the mobile app. The Chapa secret key lives
// only in this function's environment (CHAPA_SECRET_KEY); the app never sees it.
//
// POST { action: 'initialize', bookingId }            -> { checkoutUrl, transactionRef }
// POST { action: 'initialize_change', bookingId, change } -> { checkoutUrl, transactionRef, amount, currency }
//      change = { action: 'pickup'|'seats'|'reschedule', seats, tripId, stationId, pickupAddress }
// POST { action: 'verify', transactionRef }           -> { paid, status, bookingId, purpose, applied?, reason? }
// POST { action: 'verify_pending' }                   -> { checked, completed } (top-ups left mid-checkout)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
};

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const strictEmail = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function chapaEmail(email: unknown) {
  const value = typeof email === 'string' ? email.trim() : '';
  // Synthetic Telegram addresses are not deliverable; Chapa only needs a valid shape.
  if (value && strictEmail.test(value) && !value.endsWith('@auth.tankua.app')) {
    return value.toLowerCase();
  }
  return 'payments@tankua.co';
}

function chapaPhone(phone: unknown) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.startsWith('251')) return digits;
  if (digits.startsWith('0')) return `251${digits.slice(1)}`;
  if (digits.length === 9) return `251${digits}`;
  return undefined;
}

function readableChapaError(message: unknown) {
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object') {
    return Object.entries(message as Record<string, unknown>)
      .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`)
      .join('\n');
  }
  return '';
}

function httpsUrl(value: string | undefined, fallback: string) {
  const url = value?.trim();
  return url && /^https:\/\//i.test(url) ? url.replace(/\/$/, '') : fallback;
}

function dbError(error: { message?: string; code?: string }) {
  // Business-rule refusals from the database come back as PT409 / 22023 / P0002.
  if (error.code === 'PT409') return new HttpError(409, error.message || 'Request refused');
  if (error.code === '22023') return new HttpError(400, error.message || 'Invalid request');
  if (error.code === 'P0002') return new HttpError(404, error.message || 'Not found');
  return error as Error;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const chapaKey = Deno.env.get('CHAPA_SECRET_KEY');
    if (!url || !serviceKey || !chapaKey) {
      throw new HttpError(503, 'Payment service is not configured');
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !auth?.user) throw new HttpError(401, 'Sign in to continue');
    const userId = auth.user.id;

    const body = await req.json().catch(() => ({}));

    if (body.action === 'initialize') {
      return json(await initialize(admin, chapaKey, userId, String(body.bookingId || '')));
    }
    if (body.action === 'initialize_change') {
      return json(await initializeChange(admin, chapaKey, userId, String(body.bookingId || ''), body.change));
    }
    if (body.action === 'verify') {
      return json(await verify(admin, chapaKey, userId, String(body.transactionRef || '')));
    }
    if (body.action === 'verify_pending') {
      const { data: pending, error: listError } = await admin.rpc('list_pending_change_payments', { p_user_id: userId });
      if (listError) throw listError;
      const results = await Promise.allSettled(
        (pending ?? []).map((row: { transaction_ref: string }) => verify(admin, chapaKey, userId, row.transaction_ref)),
      );
      const completed = results.filter((result) => result.status === 'fulfilled' && result.value.paid).length;
      return json({ checked: results.length, completed });
    }
    throw new HttpError(400, 'Unknown action');
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Payment request failed';
    if (status >= 500) console.error(JSON.stringify({ event: 'chapa_payment_error', message }));
    return json({ error: message }, status);
  }
});

// deno-lint-ignore no-explicit-any
type Client = any;

// Opens a Chapa checkout for a payment_transactions row that already exists.
async function startCheckout(
  admin: Client,
  chapaKey: string,
  { userId, transactionRef, amount, currency, description }:
    { userId: string; transactionRef: string; amount: number; currency: string; description: string },
) {
  const { data: profile } = await admin
    .from('users')
    .select('name, email, phone_number')
    .eq('id', userId)
    .maybeSingle();

  const returnBase = httpsUrl(Deno.env.get('CHAPA_RETURN_URL'), 'https://chapa.co');
  const webhook = Deno.env.get('CHAPA_WEBHOOK_URL');
  const nameParts = String(profile?.name || '').trim().split(/\s+/).filter(Boolean);
  const phone = chapaPhone(profile?.phone_number);

  try {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: { authorization: `Bearer ${chapaKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        amount: amount.toFixed(2),
        currency,
        email: chapaEmail(profile?.email),
        first_name: nameParts[0] || 'Tankua',
        last_name: nameParts.slice(1).join(' ') || 'Traveler',
        ...(phone ? { phone_number: phone } : {}),
        tx_ref: transactionRef,
        ...(webhook && /^https:\/\//i.test(webhook) ? { callback_url: webhook } : {}),
        return_url: `${returnBase}/?tx_ref=${encodeURIComponent(transactionRef)}`,
        customization: { title: 'Tankua Booking', description },
      }),
      signal: AbortSignal.timeout(30000),
    });
    const result = await response.json().catch(() => ({}));
    const checkoutUrl = result?.data?.checkout_url;
    if (!response.ok || result.status !== 'success' || !checkoutUrl) {
      const details = readableChapaError(result?.message) || 'Unable to start payment';
      throw new HttpError(response.status >= 500 ? 502 : 400, details);
    }

    await admin
      .from('payment_transactions')
      .update({ checkout_url: checkoutUrl, external_ref: result.data.id ?? null, status: 'processing' })
      .eq('transaction_ref', transactionRef);

    return checkoutUrl as string;
  } catch (error) {
    await admin
      .from('payment_transactions')
      .update({ status: 'failed', error_message: error instanceof Error ? error.message : 'Initialize failed' })
      .eq('transaction_ref', transactionRef)
      .eq('status', 'pending');
    throw error;
  }
}

async function initialize(admin: Client, chapaKey: string, userId: string, bookingId: string) {
  if (!bookingId) throw new HttpError(400, 'Missing booking');

  const { data: booking, error } = await admin
    .from('bookings')
    .select('id, user_id, status, payment_status, payment_deadline, total_price, currency, trip:trips(status, departure_date)')
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!booking || booking.user_id !== userId) throw new HttpError(404, 'Booking not found');

  const now = Date.now();
  if (booking.payment_status === 'paid') throw new HttpError(409, 'Booking is already paid');
  if (booking.status !== 'confirmed' || booking.payment_status !== 'pending') {
    throw new HttpError(409, 'This booking is unavailable for payment');
  }
  const trip = booking.trip;
  if (!trip || !(Date.parse(trip.departure_date) > now)) throw new HttpError(409, 'This trip is unavailable for payment');
  if (trip.status === 'upcoming') throw new HttpError(409, 'Payment opens when this trip becomes active');
  if (trip.status !== 'active') throw new HttpError(409, 'This trip is unavailable for payment');
  if (!(Date.parse(booking.payment_deadline) > now)) {
    throw new HttpError(409, 'There is no open payment window for this booking');
  }

  const amount = Number(booking.total_price);
  if (!(amount > 0)) throw new HttpError(409, 'Invalid booking amount');
  const currency = booking.currency ?? 'ETB';
  const transactionRef = `tankua-${crypto.randomUUID()}`;

  // guard_booking_payment_start re-checks trip and deadline under a row lock.
  const { error: insertError } = await admin.from('payment_transactions').insert({
    booking_id: booking.id,
    user_id: userId,
    amount,
    currency,
    payment_method: 'chapa',
    transaction_ref: transactionRef,
    status: 'pending',
  });
  if (insertError) throw dbError(insertError);

  const checkoutUrl = await startCheckout(admin, chapaKey, {
    userId, transactionRef, amount, currency, description: 'Trip booking payment',
  });
  return { checkoutUrl, transactionRef };
}

async function initializeChange(admin: Client, chapaKey: string, userId: string, bookingId: string, change: unknown) {
  if (!UUID.test(bookingId)) throw new HttpError(400, 'Missing booking');
  const c = (change && typeof change === 'object' ? change : {}) as Record<string, unknown>;
  if (!['pickup', 'seats', 'reschedule'].includes(String(c.action))) throw new HttpError(400, 'Choose what to change');
  const optionalId = (value: unknown) => (typeof value === 'string' && UUID.test(value) ? value : null);

  const { data: payment, error } = await admin.rpc('create_change_payment_for_user', {
    p_booking_id: bookingId,
    p_user_id: userId,
    p_action: c.action,
    p_seats: Number.isInteger(c.seats) ? c.seats : null,
    p_trip_id: optionalId(c.tripId),
    p_station_id: optionalId(c.stationId),
    p_pickup_address: typeof c.pickupAddress === 'string' ? c.pickupAddress.trim().slice(0, 240) || null : null,
  });
  if (error) throw dbError(error);

  const amount = Number(payment.amount);
  const checkoutUrl = await startCheckout(admin, chapaKey, {
    userId,
    transactionRef: payment.transaction_ref,
    amount,
    currency: payment.currency,
    description: 'Booking change payment',
  });
  return { checkoutUrl, transactionRef: payment.transaction_ref, amount, currency: payment.currency };
}

async function verify(admin: Client, chapaKey: string, userId: string, transactionRef: string) {
  if (!transactionRef) throw new HttpError(400, 'Missing transaction');

  const { data: transaction, error } = await admin
    .from('payment_transactions')
    .select('id, booking_id, user_id, amount, currency, status, purpose')
    .eq('transaction_ref', transactionRef)
    .maybeSingle();
  if (error) throw error;
  if (!transaction || transaction.user_id !== userId) throw new HttpError(404, 'Transaction not found');

  const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(transactionRef)}`, {
    headers: { authorization: `Bearer ${chapaKey}` },
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  const paid = response.ok && result.status === 'success' &&
    ['success', 'successful'].includes(result.data?.status);
  const matches = Number(result.data?.amount) === Number(transaction.amount) &&
    result.data?.currency === (transaction.currency ?? 'ETB') &&
    result.data?.tx_ref === transactionRef;

  if (paid && !matches) {
    console.error(JSON.stringify({ event: 'chapa_payment_mismatch', transactionRef }));
  }

  const purpose = transaction.purpose ?? 'booking';
  if (!(paid && matches)) {
    return { paid: false, status: transaction.status, bookingId: transaction.booking_id, purpose };
  }

  if (purpose === 'change') {
    // Applies the change, or queues a full refund if it can no longer be made.
    const { data: outcome, error: completeError } = await admin.rpc('complete_change_payment', {
      p_transaction_ref: transactionRef,
      p_provider_response: result.data,
    });
    if (completeError) throw completeError;
    return {
      paid: true,
      status: 'paid',
      bookingId: transaction.booking_id,
      purpose,
      applied: Boolean(outcome?.applied),
      reason: outcome?.reason ?? null,
    };
  }

  const completedAt = new Date().toISOString();
  const [txUpdate, bookingUpdate] = await Promise.all([
    admin
      .from('payment_transactions')
      .update({
        status: 'success',
        verified_at: completedAt,
        verified_by: 'api',
        provider_response: result.data,
        completed_at: completedAt,
      })
      .eq('transaction_ref', transactionRef),
    admin
      .from('bookings')
      .update({ payment_status: 'paid' })
      .eq('id', transaction.booking_id)
      .eq('payment_status', 'pending'),
  ]);
  if (txUpdate.error) throw txUpdate.error;
  if (bookingUpdate.error) throw bookingUpdate.error;

  return { paid: true, status: 'paid', bookingId: transaction.booking_id, purpose };
}
