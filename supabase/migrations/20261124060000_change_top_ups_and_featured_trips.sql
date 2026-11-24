BEGIN;

-- ============================================================================
-- Part 1. Top-up payments for booking changes that cost more.
--
-- Flow: the traveler asks for a change that costs more on a paid booking.
-- create_change_payment_for_user records the request and a payment for just
-- the difference. Chapa checkout runs. Once the server has verified the
-- payment with Chapa, complete_change_payment applies the change. If the
-- change can no longer be made (seats gone, booking cancelled...), the whole
-- top-up is queued for refund and the traveler is told. Nobody pays for a
-- change they did not get.
-- ============================================================================

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'booking' CHECK (purpose IN ('booking', 'change')),
  ADD COLUMN IF NOT EXISTS change_request_id UUID;

CREATE TABLE public.booking_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('pickup', 'seats', 'reschedule')),
  seats INTEGER,
  trip_id UUID,
  station_id UUID,
  pickup_address TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL CHECK (currency IN ('ETB', 'USD')),
  status TEXT NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment', 'superseded', 'applied', 'failed')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX booking_change_requests_booking_idx ON public.booking_change_requests (booking_id);

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_change_request_fkey
  FOREIGN KEY (change_request_id) REFERENCES public.booking_change_requests(id) ON DELETE SET NULL;

ALTER TABLE public.booking_change_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_change_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.booking_change_requests TO authenticated;
CREATE POLICY "Travelers read their own change requests" ON public.booking_change_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read change requests" ON public.booking_change_requests
  FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()::text));

-- Top-up payments are for paid bookings, so they skip the "unpaid booking
-- with an open payment window" rule that guards first payments.
CREATE OR REPLACE FUNCTION public.guard_booking_payment_start()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_trip_id UUID;
BEGIN
  SELECT trip_id INTO target_trip_id FROM public.bookings WHERE id = NEW.booking_id;
  IF target_trip_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.purpose = 'change' THEN
    PERFORM 1 FROM public.bookings AS b
    JOIN public.trips AS t ON t.id = b.trip_id
    WHERE b.id = NEW.booking_id AND b.user_id = NEW.user_id
      AND b.status = 'confirmed' AND b.payment_status = 'paid'
      AND t.status IN ('upcoming', 'active') AND t.departure_date > clock_timestamp();
    IF NOT FOUND THEN
      RAISE EXCEPTION 'This booking can no longer be changed' USING ERRCODE = 'PT409';
    END IF;
    RETURN NEW;
  END IF;

  PERFORM 1 FROM public.trips
  WHERE id = target_trip_id AND status = 'active' AND departure_date > clock_timestamp()
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment opens when the trip becomes active' USING ERRCODE = 'PT409';
  END IF;

  PERFORM 1 FROM public.bookings
  WHERE id = NEW.booking_id AND trip_id = target_trip_id AND user_id = NEW.user_id
    AND status = 'confirmed' AND payment_status = 'pending'
    AND payment_deadline > clock_timestamp()
  FOR SHARE NOWAIT;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This booking is no longer available for payment' USING ERRCODE = 'PT409';
  END IF;

  RETURN NEW;
EXCEPTION WHEN lock_not_available THEN
  RAISE EXCEPTION 'This booking is being updated. Please try paying again.'
    USING ERRCODE = 'PT409';
END;
$$;

-- ----------------------------------------------------------------------------
-- The change function, now aware of top-ups. Same rules as before, except a
-- paid change that costs more is allowed when p_top_up_paid covers it (only
-- complete_change_payment passes that). Paid seat increases now use a top-up
-- instead of a second booking.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.change_booking(UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.change_booking_for_user(UUID, UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN);

-- search_path includes public because existing booking triggers (rewards,
-- migration 39) use unqualified table names.
CREATE FUNCTION public.change_booking_for_user(
  p_booking_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_seats INTEGER DEFAULT NULL,
  p_trip_id UUID DEFAULT NULL,
  p_station_id UUID DEFAULT NULL,
  p_pickup_address TEXT DEFAULT NULL,
  p_apply BOOLEAN DEFAULT FALSE,
  p_top_up_paid NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  booking public.bookings%ROWTYPE;
  current_trip public.trips%ROWTYPE;
  target_trip public.trips%ROWTYPE;
  station public.pickup_stations%ROWTYPE;
  link public.trip_pickup_stations%ROWTYPE;
  is_paid BOOLEAN;
  hours_left NUMERIC;
  new_seats INTEGER;
  chosen_station UUID;
  chosen_address TEXT;
  new_base NUMERIC;
  new_fee NUMERIC;
  new_total NUMERIC;
  saving NUMERIC := 0;
  refund NUMERIC := 0;
  refund_percent INTEGER := 0;
  top_up NUMERIC := 0;
  needs_top_up BOOLEAN := FALSE;
  reason TEXT;
  refund_id UUID;
  transaction_id UUID;
  operator_name TEXT;
  quote JSONB;
BEGIN
  IF p_action IS NULL OR p_action NOT IN ('pickup', 'seats', 'reschedule') THEN
    RAISE EXCEPTION 'Choose what to change' USING ERRCODE = '22023';
  END IF;

  IF p_apply THEN
    SELECT * INTO booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  ELSE
    SELECT * INTO booking FROM public.bookings WHERE id = p_booking_id;
  END IF;
  IF NOT FOUND OR p_user_id IS NULL OR booking.user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_apply THEN
    SELECT * INTO current_trip FROM public.trips WHERE id = booking.trip_id FOR NO KEY UPDATE;
  ELSE
    SELECT * INTO current_trip FROM public.trips WHERE id = booking.trip_id;
  END IF;

  is_paid := booking.payment_status = 'paid';
  hours_left := EXTRACT(EPOCH FROM (current_trip.departure_date - clock_timestamp())) / 3600;
  target_trip := current_trip;
  new_seats := booking.seats;
  chosen_station := CASE WHEN booking.pickup_station->>'id' ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
    THEN (booking.pickup_station->>'id')::UUID END;
  chosen_address := NULLIF(btrim(booking.pickup_station->>'pickup_address'), '');

  -- 1. Is this booking changeable at all? (A top-up checkout in progress does
  --    not block: if two are paid, the second finds nothing left to change
  --    and is refunded.)
  IF booking.status <> 'confirmed' THEN
    reason := 'This booking is no longer active.';
  ELSIF booking.payment_status NOT IN ('paid', 'pending') THEN
    reason := 'This booking cannot be changed here. Contact support.';
  ELSIF current_trip.id IS NULL OR current_trip.departure_date IS NULL OR current_trip.departure_date <= clock_timestamp() THEN
    reason := 'This trip has already departed.';
  ELSIF current_trip.status NOT IN ('upcoming', 'active') THEN
    reason := 'This trip can no longer be changed in the app. Contact support.';
  ELSIF EXISTS (
    SELECT 1 FROM public.payment_transactions AS p
    WHERE p.booking_id = booking.id AND p.status IN ('pending', 'processing') AND p.purpose = 'booking'
  ) THEN
    reason := 'A payment for this booking is in progress. Try again once it finishes.';
  END IF;

  -- 2. What is being changed?
  IF reason IS NULL AND p_action = 'pickup' THEN
    IF p_station_id IS NULL THEN
      reason := 'Choose a pickup point.';
    ELSE
      chosen_station := p_station_id;
      chosen_address := NULLIF(btrim(p_pickup_address), '');
    END IF;

  ELSIF reason IS NULL AND p_action = 'seats' THEN
    IF p_seats IS NULL OR p_seats < 1 OR p_seats > 8 THEN
      reason := 'Choose between 1 and 8 seats.';
    ELSIF p_seats = booking.seats THEN
      reason := 'That is already your seat count.';
    ELSIF p_seats > booking.seats AND COALESCE(current_trip.available_seats, 0) < p_seats - booking.seats THEN
      reason := format('Only %s more %s available on this trip.', COALESCE(current_trip.available_seats, 0),
        CASE WHEN COALESCE(current_trip.available_seats, 0) = 1 THEN 'seat is' ELSE 'seats are' END);
    ELSE
      new_seats := p_seats;
    END IF;

  ELSIF reason IS NULL AND p_action = 'reschedule' THEN
    IF is_paid AND hours_left < 48 THEN
      reason := 'Paid bookings can move to another departure up to 48 hours before departure.';
    ELSIF p_trip_id IS NULL OR p_trip_id = current_trip.id THEN
      reason := 'Choose a different departure.';
    ELSE
      IF p_apply THEN
        SELECT * INTO target_trip FROM public.trips WHERE id = p_trip_id FOR NO KEY UPDATE;
      ELSE
        SELECT * INTO target_trip FROM public.trips WHERE id = p_trip_id;
      END IF;
      IF target_trip.id IS NULL OR target_trip.destination_id IS DISTINCT FROM current_trip.destination_id THEN
        reason := 'Choose a departure to the same destination.';
        target_trip := current_trip;
      ELSIF target_trip.status NOT IN ('upcoming', 'active') OR target_trip.departure_date IS NULL
        OR target_trip.departure_date <= clock_timestamp() THEN
        reason := 'That departure is not open for booking.';
      ELSIF COALESCE(target_trip.currency, 'ETB') <> COALESCE(booking.currency, 'ETB') THEN
        reason := 'That departure is priced in a different currency.';
      ELSIF COALESCE(target_trip.available_seats, 0) < booking.seats THEN
        reason := 'That departure does not have enough seats.';
      ELSIF p_station_id IS NOT NULL THEN
        chosen_station := p_station_id;
        chosen_address := NULLIF(btrim(p_pickup_address), '');
      END IF;
    END IF;
  END IF;

  -- 3. The pickup point must be offered on the (new) trip.
  IF reason IS NULL THEN
    SELECT * INTO link FROM public.trip_pickup_stations
    WHERE trip_id = target_trip.id AND station_id = chosen_station;
    SELECT * INTO station FROM public.pickup_stations WHERE id = chosen_station AND is_active;
    IF link.id IS NULL OR station.id IS NULL THEN
      reason := CASE WHEN p_action = 'reschedule'
        THEN 'Choose a pickup point for the new departure.'
        ELSE 'Choose a pickup point offered for this trip.' END;
    ELSIF station.is_address_pickup
      AND (chosen_address IS NULL OR length(chosen_address) NOT BETWEEN 5 AND 240) THEN
      reason := 'Enter a pickup address between 5 and 240 characters.';
    ELSIF NOT station.is_address_pickup THEN
      chosen_address := NULL;
    END IF;
  END IF;

  -- 4. New price (same formula as every booking), then refund or top-up.
  IF reason IS NULL THEN
    new_base := (target_trip.price * new_seats) + COALESCE(link.extra_price, 0);
    new_fee := CASE WHEN booking.currency = 'USD' THEN round(new_base * 0.05, 2) ELSE round(new_base * 0.05) END;
    new_total := new_base + new_fee;
    saving := booking.total_price - new_total;

    IF is_paid AND saving < 0 THEN
      top_up := -saving;
      IF COALESCE(p_top_up_paid, 0) < top_up THEN
        needs_top_up := TRUE;
        reason := format('This change costs %s %s more. Pay the difference to make it.',
          to_char(top_up, 'FM999,999,990.##'), COALESCE(booking.currency, 'ETB'));
      END IF;
    ELSIF is_paid AND saving > 0 THEN
      refund_percent := CASE
        WHEN p_action <> 'seats' THEN 100
        WHEN hours_left >= 48 THEN 100
        WHEN hours_left >= 24 THEN 50
        ELSE 0
      END;
      refund := saving * refund_percent / 100;
      refund := CASE WHEN booking.currency = 'USD' THEN round(refund, 2) ELSE round(refund) END;
    END IF;
  END IF;

  quote := jsonb_build_object(
    'booking_id', booking.id,
    'action', p_action,
    'allowed', reason IS NULL,
    'reason', reason,
    'paid', is_paid,
    'needs_top_up', needs_top_up,
    'top_up_amount', top_up,
    'needs_new_booking', FALSE,
    'old_total', booking.total_price,
    'new_total', CASE WHEN reason IS NULL OR needs_top_up THEN new_total END,
    'refund_amount', refund,
    'refund_percentage', refund_percent,
    'currency', COALESCE(booking.currency, 'ETB'),
    'seats', new_seats,
    'trip_id', target_trip.id,
    'departure_date', target_trip.departure_date,
    'pickup_name', station.name
  );

  IF NOT p_apply THEN
    RETURN quote;
  END IF;
  IF reason IS NOT NULL THEN
    RAISE EXCEPTION '%', reason USING ERRCODE = 'PT409';
  END IF;

  -- 5. Apply: move seats, reprice, record any refund, tell the traveler.
  IF target_trip.id <> current_trip.id THEN
    UPDATE public.trips SET available_seats = LEAST(max_seats, available_seats + booking.seats) WHERE id = current_trip.id;
    UPDATE public.trips SET available_seats = available_seats - booking.seats WHERE id = target_trip.id;
  ELSIF new_seats <> booking.seats THEN
    UPDATE public.trips
    SET available_seats = LEAST(max_seats, GREATEST(0, available_seats - (new_seats - booking.seats)))
    WHERE id = current_trip.id;
  END IF;

  SELECT name INTO operator_name FROM public.providers WHERE id = target_trip.provider_id;

  UPDATE public.bookings
  SET trip_id = target_trip.id,
      provider_id = target_trip.provider_id,
      provider_name = COALESCE(operator_name, provider_name),
      trip_type = target_trip.trip_type,
      date = target_trip.departure_date::DATE,
      seats = new_seats,
      passenger_details = CASE
        WHEN jsonb_typeof(passenger_details) = 'array' AND jsonb_array_length(passenger_details) > new_seats
        THEN (SELECT jsonb_agg(item.value ORDER BY item.position)
              FROM jsonb_array_elements(passenger_details) WITH ORDINALITY AS item(value, position)
              WHERE item.position <= new_seats)
        ELSE passenger_details END,
      pickup_station = jsonb_strip_nulls(jsonb_build_object(
        'id', station.id, 'name', station.name, 'address', station.address,
        'pickup_time', link.pickup_time, 'extra_price', link.extra_price,
        'pickup_address', chosen_address
      )),
      base_price = new_base,
      service_fee = new_fee,
      provider_fee = new_fee,
      total_price = new_total,
      payment_deadline = CASE
        WHEN is_paid OR target_trip.id = current_trip.id THEN payment_deadline
        WHEN target_trip.status = 'active' THEN clock_timestamp() + INTERVAL '2 hours'
        ELSE NULL END
  WHERE id = booking.id;

  IF refund > 0 THEN
    SELECT p.id INTO transaction_id FROM public.payment_transactions AS p
    WHERE p.booking_id = booking.id AND p.status = 'success'
    ORDER BY p.completed_at DESC NULLS LAST, p.created_at DESC
    LIMIT 1;

    INSERT INTO public.refunds (payment_transaction_id, booking_id, user_id, amount, currency, reason, status)
    VALUES (
      transaction_id, booking.id, booking.user_id, refund, COALESCE(booking.currency, 'ETB'),
      format('Booking change: %s, %s%% of the %s %s difference',
        CASE p_action WHEN 'pickup' THEN 'new pickup point' WHEN 'seats' THEN format('%s to %s seats', booking.seats, new_seats)
          ELSE 'moved to another departure' END,
        refund_percent, to_char(saving, 'FM999,999,990.##'), COALESCE(booking.currency, 'ETB')),
      'pending'
    )
    RETURNING id INTO refund_id;
  END IF;

  INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
  VALUES (
    'user', booking.user_id,
    format('Booking updated: %s', COALESCE(booking.destination_name, 'your trip')),
    concat_ws(' ',
      CASE p_action
        WHEN 'pickup' THEN format('Your pickup is now %s.', COALESCE(chosen_address, station.name))
        WHEN 'seats' THEN format('Your booking is now for %s %s.', new_seats, CASE WHEN new_seats = 1 THEN 'seat' ELSE 'seats' END)
        ELSE format('You moved to the departure on %s.',
          to_char(target_trip.departure_date AT TIME ZONE 'Africa/Addis_Ababa', 'Dy DD Mon, HH24:MI'))
      END,
      CASE WHEN refund > 0
        THEN format('A refund of %s %s is being processed; we will message you when it is sent.',
          to_char(refund, 'FM999,999,990.##'), COALESCE(booking.currency, 'ETB')) END
    ),
    'booking',
    jsonb_build_object('booking_id', booking.id, 'trip_id', target_trip.id, 'event', 'booking_changed',
      'action', p_action, 'refund_id', refund_id)
  );

  RETURN quote || jsonb_build_object('applied', TRUE, 'refund_id', refund_id);
END;
$$;

-- Travelers (mobile, signed in) quote and apply changes; they can never pass
-- a top-up amount themselves.
CREATE FUNCTION public.change_booking(
  p_booking_id UUID,
  p_action TEXT,
  p_seats INTEGER DEFAULT NULL,
  p_trip_id UUID DEFAULT NULL,
  p_station_id UUID DEFAULT NULL,
  p_pickup_address TEXT DEFAULT NULL,
  p_apply BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.change_booking_for_user(
    p_booking_id, auth.uid(), p_action, p_seats, p_trip_id, p_station_id, p_pickup_address, p_apply, 0
  );
$$;

-- Start a top-up: record the change and a payment for exactly the difference.
CREATE FUNCTION public.create_change_payment_for_user(
  p_booking_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_seats INTEGER DEFAULT NULL,
  p_trip_id UUID DEFAULT NULL,
  p_station_id UUID DEFAULT NULL,
  p_pickup_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  quote JSONB;
  request_id UUID;
  reference TEXT := 'tankua-chg-' || gen_random_uuid()::TEXT;
  amount NUMERIC;
  pay_currency TEXT;
BEGIN
  PERFORM 1 FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  quote := public.change_booking_for_user(
    p_booking_id, p_user_id, p_action, p_seats, p_trip_id, p_station_id, p_pickup_address, FALSE, 0
  );
  IF NOT COALESCE((quote->>'needs_top_up')::BOOLEAN, FALSE) THEN
    RAISE EXCEPTION '%', COALESCE(quote->>'reason', 'This change does not need a payment.') USING ERRCODE = 'PT409';
  END IF;
  amount := (quote->>'top_up_amount')::NUMERIC;
  pay_currency := quote->>'currency';

  -- A new checkout replaces any unfinished one for this booking.
  UPDATE public.booking_change_requests SET status = 'superseded'
  WHERE booking_id = p_booking_id AND status = 'awaiting_payment';

  INSERT INTO public.booking_change_requests (
    booking_id, user_id, action, seats, trip_id, station_id, pickup_address, amount, currency
  ) VALUES (
    p_booking_id, p_user_id, p_action, p_seats, p_trip_id, p_station_id, NULLIF(btrim(p_pickup_address), ''),
    amount, pay_currency
  )
  RETURNING id INTO request_id;

  INSERT INTO public.payment_transactions (
    booking_id, user_id, amount, currency, payment_method, transaction_ref, status, purpose, change_request_id
  ) VALUES (
    p_booking_id, p_user_id, amount, pay_currency, 'chapa', reference, 'pending', 'change', request_id
  );

  RETURN jsonb_build_object(
    'transaction_ref', reference, 'amount', amount, 'currency', pay_currency,
    'change_request_id', request_id, 'quote', quote
  );
END;
$$;

-- Called only after Chapa confirmed the payment (amount, currency and
-- reference already matched by the caller). Applies the change or refunds.
CREATE FUNCTION public.complete_change_payment(p_transaction_ref TEXT, p_provider_response JSONB DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tx public.payment_transactions%ROWTYPE;
  request public.booking_change_requests%ROWTYPE;
  result JSONB;
  extra NUMERIC;
  failure TEXT;
  place TEXT;
BEGIN
  SELECT * INTO tx FROM public.payment_transactions WHERE transaction_ref = p_transaction_ref FOR UPDATE;
  IF NOT FOUND OR tx.purpose <> 'change' OR tx.change_request_id IS NULL THEN
    RAISE EXCEPTION 'Not a booking change payment' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO request FROM public.booking_change_requests WHERE id = tx.change_request_id FOR UPDATE;
  IF request.status IN ('applied', 'failed') THEN
    RETURN jsonb_build_object('applied', request.status = 'applied', 'booking_id', request.booking_id,
      'reason', request.failure_reason, 'already_completed', TRUE);
  END IF;

  UPDATE public.payment_transactions
  SET status = 'success', verified_at = NOW(), verified_by = 'api', completed_at = NOW(),
      provider_response = COALESCE(p_provider_response, provider_response)
  WHERE id = tx.id;

  BEGIN
    result := public.change_booking_for_user(
      request.booking_id, request.user_id, request.action, request.seats, request.trip_id,
      request.station_id, request.pickup_address, TRUE, tx.amount
    );

    -- If the change got cheaper since checkout, return the unused part.
    extra := tx.amount - COALESCE((result->>'top_up_amount')::NUMERIC, 0);
    IF extra > 0 THEN
      INSERT INTO public.refunds (payment_transaction_id, booking_id, user_id, amount, currency, reason, status)
      VALUES (tx.id, request.booking_id, request.user_id, extra, tx.currency,
        'Booking change: unused part of the top-up payment', 'pending');
    END IF;

    UPDATE public.booking_change_requests SET status = 'applied', completed_at = NOW() WHERE id = request.id;
    RETURN jsonb_build_object('applied', TRUE, 'booking_id', request.booking_id, 'returned', GREATEST(extra, 0));
  EXCEPTION WHEN OTHERS THEN
    failure := SQLERRM;
  END;

  -- The change could not be made: give the whole top-up back.
  UPDATE public.booking_change_requests
  SET status = 'failed', failure_reason = failure, completed_at = NOW()
  WHERE id = request.id;

  INSERT INTO public.refunds (payment_transaction_id, booking_id, user_id, amount, currency, reason, status)
  VALUES (tx.id, request.booking_id, request.user_id, tx.amount, tx.currency,
    'Booking change: top-up returned, the change could not be made (' || left(failure, 150) || ')', 'pending');

  SELECT destination_name INTO place FROM public.bookings WHERE id = request.booking_id;
  INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
  VALUES (
    'user', request.user_id,
    'We couldn''t make your booking change',
    format('Your change to %s could not be made (%s). Your booking is unchanged, and the %s %s you paid is being refunded.',
      COALESCE(place, 'your trip'), failure, to_char(tx.amount, 'FM999,999,990.##'), tx.currency),
    'payment',
    jsonb_build_object('booking_id', request.booking_id, 'event', 'change_failed', 'change_request_id', request.id)
  );

  RETURN jsonb_build_object('applied', FALSE, 'booking_id', request.booking_id, 'reason', failure);
END;
$$;

-- Safety net: top-ups the traveler paid but never returned from (closed the
-- app mid-checkout). The servers re-verify these with Chapa when the
-- traveler opens My Trips, so a paid change is never left unapplied.
CREATE FUNCTION public.list_pending_change_payments(p_user_id UUID)
RETURNS TABLE (transaction_ref TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.transaction_ref FROM public.payment_transactions AS p
  WHERE p.user_id = p_user_id AND p.purpose = 'change'
    AND p.status IN ('pending', 'processing')
    AND p.created_at > NOW() - INTERVAL '7 days'
  ORDER BY p.created_at
  LIMIT 10;
$$;

REVOKE ALL ON FUNCTION public.list_pending_change_payments(UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_pending_change_payments(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.change_booking_for_user(UUID, UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN, NUMERIC)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.change_booking(UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_change_payment_for_user(UUID, UUID, TEXT, INTEGER, UUID, UUID, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.complete_change_payment(TEXT, JSONB) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.change_booking(UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_booking_for_user(UUID, UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_change_payment_for_user(UUID, UUID, TEXT, INTEGER, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_change_payment(TEXT, JSONB) TO service_role;

-- ============================================================================
-- Part 2. Admin-controlled featured trips (marketing homepage).
-- featured_rank 1, 2, 3... in display order; NULL = not featured. Departed or
-- closed trips simply stop showing. Only admins can set it.
-- ============================================================================

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS featured_rank INTEGER CHECK (featured_rank > 0);
CREATE UNIQUE INDEX IF NOT EXISTS trips_featured_rank_unique ON public.trips (featured_rank) WHERE featured_rank IS NOT NULL;

COMMENT ON COLUMN public.trips.featured_rank IS 'Position on the marketing homepage featured list (1 = first). Set by admins only.';

-- Providers can update their own trips, so stop them from featuring trips.
CREATE FUNCTION public.guard_trip_featured_rank()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.featured_rank IS DISTINCT FROM (CASE WHEN TG_OP = 'UPDATE' THEN OLD.featured_rank END)
    AND current_user IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'Only Tankua admins can feature trips' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_trip_featured_rank
  BEFORE INSERT OR UPDATE OF featured_rank ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.guard_trip_featured_rank();

-- Replace the whole featured list at once, in display order.
CREATE FUNCTION public.admin_set_featured_trips(p_trip_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ids UUID[] := COALESCE(p_trip_ids, '{}');
  bad UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users AS admin
    WHERE admin.id = auth.uid() AND COALESCE(admin.is_active, TRUE) AND admin.role IN ('super_admin', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only admins can feature trips' USING ERRCODE = '42501';
  END IF;
  IF cardinality(ids) > 12 THEN
    RAISE EXCEPTION 'Feature at most 12 trips' USING ERRCODE = '22023';
  END IF;
  IF cardinality(ids) <> (SELECT count(DISTINCT candidate.trip_id) FROM unnest(ids) AS candidate(trip_id)) THEN
    RAISE EXCEPTION 'A trip is listed twice' USING ERRCODE = '22023';
  END IF;

  SELECT candidate.trip_id INTO bad FROM unnest(ids) AS candidate(trip_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.trips AS t
    WHERE t.id = candidate.trip_id
      AND t.status IN ('upcoming', 'active', 'collecting_interest') AND t.departure_date > NOW()
  )
  LIMIT 1;
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'Only upcoming, open trips can be featured' USING ERRCODE = '22023';
  END IF;

  UPDATE public.trips SET featured_rank = NULL WHERE featured_rank IS NOT NULL;
  UPDATE public.trips AS t SET featured_rank = list.position
  FROM unnest(ids) WITH ORDINALITY AS list(trip_id, position)
  WHERE t.id = list.trip_id;

  RETURN jsonb_build_object('featured', to_jsonb(ids));
END;
$$;

REVOKE ALL ON FUNCTION public.guard_trip_featured_rank() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_set_featured_trips(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_featured_trips(UUID[]) TO authenticated;

COMMIT;
