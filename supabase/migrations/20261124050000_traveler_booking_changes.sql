BEGIN;

-- ============================================================================
-- Travelers change their own bookings: pickup point, seat count, departure.
--
-- One function quotes (p_apply = false) and applies (p_apply = true) the
-- change, so the app always shows exactly what will happen.
--
-- Unpaid reservations: any change, the booking is simply repriced.
-- Paid bookings (nothing new is ever charged):
--   * pickup   -> allowed if it costs the same or less; difference refunded.
--   * seats    -> fewer seats: partial cancellation, refund on the removed
--                 share follows the cancellation policy (48h+ 100%, 24-48h
--                 50%, <24h none). More seats: book them as a new booking.
--   * departure-> same destination and currency, at least 48h before the
--                 current departure, same price or cheaper; difference
--                 refunded.
-- Refunds go to the admin "Refunds to send" list.
-- ============================================================================

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
  p_apply BOOLEAN DEFAULT FALSE
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
  reason TEXT;
  needs_new_booking BOOLEAN := FALSE;
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

  -- 1. Is this booking changeable at all?
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
    WHERE p.booking_id = booking.id AND p.status IN ('pending', 'processing')
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
    ELSIF p_seats > booking.seats AND is_paid THEN
      needs_new_booking := TRUE;
      reason := format('This booking is paid, so book the %s extra %s as a new booking.',
        p_seats - booking.seats, CASE WHEN p_seats - booking.seats = 1 THEN 'seat' ELSE 'seats' END);
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

  -- 4. New price (same formula as every booking) and any refund.
  IF reason IS NULL THEN
    new_base := (target_trip.price * new_seats) + COALESCE(link.extra_price, 0);
    new_fee := CASE WHEN booking.currency = 'USD' THEN round(new_base * 0.05, 2) ELSE round(new_base * 0.05) END;
    new_total := new_base + new_fee;
    saving := booking.total_price - new_total;

    IF is_paid AND saving < 0 THEN
      reason := CASE p_action
        WHEN 'pickup' THEN 'This pickup point costs more. To switch, cancel and rebook.'
        ELSE 'That departure costs more. To switch, cancel and rebook.' END;
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
    'needs_new_booking', needs_new_booking,
    'old_total', booking.total_price,
    'new_total', CASE WHEN reason IS NULL THEN new_total END,
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
    p_booking_id, auth.uid(), p_action, p_seats, p_trip_id, p_station_id, p_pickup_address, p_apply
  );
$$;

REVOKE ALL ON FUNCTION public.change_booking_for_user(UUID, UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.change_booking(UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.change_booking(UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_booking_for_user(UUID, UUID, TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN) TO service_role;

-- ----------------------------------------------------------------------------
-- Refund recording: also accept booking-change refunds, and only mark the
-- booking refunded when it was cancelled. A partial refund on a booking that
-- still runs must leave it paid.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_closeout_refund(p_refund_id UUID, p_reference TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  refund public.refunds%ROWTYPE;
  place TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT COALESCE(public.is_admin_user(auth.uid()::text), FALSE) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(length(btrim(p_reference)), 0) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Enter the reference for the refund already sent';
  END IF;
  UPDATE public.refunds
  SET status = 'completed', processed_at = NOW(), provider_refund_ref = btrim(p_reference)
  WHERE id = p_refund_id AND status IN ('pending', 'approved', 'processing')
    AND (reason LIKE 'Trip closeout:%' OR reason LIKE 'Traveler cancellation:%' OR reason LIKE 'Booking change:%')
  RETURNING * INTO refund;
  IF NOT FOUND THEN RAISE EXCEPTION 'Refund is unavailable'; END IF;

  UPDATE public.bookings SET payment_status = 'refunded'
  WHERE id = refund.booking_id AND payment_status = 'paid' AND status = 'cancelled';

  SELECT destination_name INTO place FROM public.bookings WHERE id = refund.booking_id;

  IF refund.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
    VALUES (
      'user', refund.user_id,
      'Refund sent',
      format('We sent your refund of %s %s for %s. Reference: %s.',
        to_char(refund.amount, 'FM999,999,990.##'), COALESCE(refund.currency, 'ETB'),
        COALESCE(place, 'your trip'), btrim(p_reference)),
      'payment',
      jsonb_build_object('booking_id', refund.booking_id, 'refund_id', refund.id, 'event', 'refund_sent')
    );
  END IF;
END;
$$;

COMMIT;
