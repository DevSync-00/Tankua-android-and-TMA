BEGIN;

-- ============================================================================
-- Auto-reserve pledged seats when a trip reaches its interest goal.
--
-- Travelers choose a pickup point when they pledge. The moment the goal is
-- reached, every pledge with a pickup point becomes a held reservation, in
-- pledge order, while seats last. Payment still opens when the provider
-- activates the trip (2-hour window, existing rules). Travelers can release an
-- unpaid reservation they no longer want.
-- ============================================================================

ALTER TABLE public.trip_interests
  ADD COLUMN pickup_station_id UUID REFERENCES public.pickup_stations(id) ON DELETE SET NULL,
  ADD COLUMN pickup_address TEXT CHECK (pickup_address IS NULL OR length(pickup_address) BETWEEN 5 AND 240),
  ADD COLUMN booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD COLUMN reservation_result TEXT CHECK (
    reservation_result IS NULL
    OR reservation_result IN ('reserved', 'no_pickup', 'no_room', 'already_booked', 'failed')
  );

COMMENT ON COLUMN public.trip_interests.booking_id IS 'Reservation created from this pledge when the goal was reached.';

-- ----------------------------------------------------------------------------
-- Pledge with seats and a pickup point. Older clients that send no pickup keep
-- working; their pledge counts toward the goal but is not auto-reserved.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.express_trip_interest(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.express_trip_interest_for_user(UUID, UUID, INTEGER);

CREATE FUNCTION public.express_trip_interest_for_user(
  p_trip_id UUID,
  p_user_id UUID,
  p_seats INTEGER DEFAULT 1,
  p_pickup_station_id UUID DEFAULT NULL,
  p_pickup_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trip public.trips%ROWTYPE;
  pledge public.trip_interests%ROWTYPE;
  station public.pickup_stations%ROWTYPE;
  seat_limit INTEGER;
  chosen_station UUID;
  chosen_address TEXT := NULLIF(btrim(p_pickup_address), '');
BEGIN
  -- Acquire the user lock before the trip lock, matching the account-delete cascade.
  PERFORM 1 FROM public.users WHERE id = p_user_id FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sign in with a traveler account to express interest' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO trip FROM public.trips WHERE id = p_trip_id FOR NO KEY UPDATE;
  IF NOT FOUND OR trip.minimum_interest IS NULL THEN
    RAISE EXCEPTION 'This trip is not collecting interest';
  END IF;

  SELECT * INTO pledge FROM public.trip_interests WHERE trip_id = p_trip_id AND user_id = p_user_id;

  IF trip.status = 'collecting_interest' THEN
    IF trip.departure_date IS NULL OR trip.departure_date <= clock_timestamp() THEN
      RAISE EXCEPTION 'This trip has already departed';
    END IF;

    -- Same per-booking cap as regular bookings, so every pledge can become one.
    seat_limit := LEAST(8, GREATEST(COALESCE(trip.max_seats, 8), 1));
    IF p_seats IS NULL OR p_seats < 1 OR p_seats > seat_limit THEN
      RAISE EXCEPTION 'Choose between 1 and % seats', seat_limit USING ERRCODE = '22023';
    END IF;

    chosen_station := COALESCE(p_pickup_station_id, pledge.pickup_station_id);
    IF p_pickup_station_id IS NULL AND pledge.pickup_station_id IS NOT NULL THEN
      chosen_address := COALESCE(chosen_address, pledge.pickup_address);
    END IF;

    IF chosen_station IS NOT NULL THEN
      SELECT s.* INTO station
      FROM public.pickup_stations AS s
      JOIN public.trip_pickup_stations AS l ON l.station_id = s.id AND l.trip_id = p_trip_id
      WHERE s.id = chosen_station AND s.is_active;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Choose a pickup point offered for this trip' USING ERRCODE = '22023';
      END IF;
      IF station.is_address_pickup THEN
        IF chosen_address IS NULL OR length(chosen_address) NOT BETWEEN 5 AND 240 THEN
          RAISE EXCEPTION 'Enter a pickup address between 5 and 240 characters' USING ERRCODE = '22023';
        END IF;
      ELSE
        chosen_address := NULL;
      END IF;
    ELSE
      chosen_address := NULL;
    END IF;

    IF pledge.user_id IS NULL THEN
      INSERT INTO public.trip_interests (trip_id, user_id, seats, pickup_station_id, pickup_address)
      VALUES (p_trip_id, p_user_id, p_seats, chosen_station, chosen_address);
    ELSIF pledge.seats IS DISTINCT FROM p_seats
      OR pledge.pickup_station_id IS DISTINCT FROM chosen_station
      OR pledge.pickup_address IS DISTINCT FROM chosen_address THEN
      UPDATE public.trip_interests
      SET seats = p_seats, pickup_station_id = chosen_station, pickup_address = chosen_address, updated_at = NOW()
      WHERE trip_id = p_trip_id AND user_id = p_user_id;
    END IF;

    SELECT * INTO pledge FROM public.trip_interests WHERE trip_id = p_trip_id AND user_id = p_user_id;
    SELECT * INTO trip FROM public.trips WHERE id = p_trip_id;
  END IF;

  RETURN jsonb_build_object(
    'trip_id', trip.id,
    'status', trip.status,
    'minimum_interest', trip.minimum_interest,
    'interest_count', trip.interest_count,
    'interested', pledge.user_id IS NOT NULL,
    'seats', pledge.seats,
    'pickup_station_id', pledge.pickup_station_id,
    'pickup_address', pledge.pickup_address,
    'booking_id', pledge.booking_id,
    'reservation_result', pledge.reservation_result
  );
END;
$$;

CREATE FUNCTION public.express_trip_interest(
  p_trip_id UUID,
  p_seats INTEGER DEFAULT 1,
  p_pickup_station_id UUID DEFAULT NULL,
  p_pickup_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.express_trip_interest_for_user(p_trip_id, auth.uid(), p_seats, p_pickup_station_id, p_pickup_address);
$$;

REVOKE ALL ON FUNCTION public.express_trip_interest(UUID, INTEGER, UUID, TEXT) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.express_trip_interest_for_user(UUID, UUID, INTEGER, UUID, TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.express_trip_interest(UUID, INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.express_trip_interest_for_user(UUID, UUID, INTEGER, UUID, TEXT) TO service_role;

-- ----------------------------------------------------------------------------
-- Turn pledges into reservations. Pledge order decides who gets seats when the
-- group is bigger than the vehicle. Each reservation is priced exactly like
-- create_miniapp_booking: trip price x seats + pickup extra, plus a 5% fee.
-- ----------------------------------------------------------------------------
-- search_path includes public because the seat-count trigger from migration 35
-- (update_trip_seats_on_booking) uses unqualified table names, the same reason
-- create_miniapp_booking sets it.
CREATE FUNCTION public.reserve_pledged_seats(p_trip_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  trip public.trips%ROWTYPE;
  pledge RECORD;
  station public.pickup_stations%ROWTYPE;
  link public.trip_pickup_stations%ROWTYPE;
  place public.destinations%ROWTYPE;
  operator public.providers%ROWTYPE;
  base_price NUMERIC;
  service_fee NUMERIC;
  reservation_key UUID;
  new_booking_id UUID;
  reserved INTEGER := 0;
BEGIN
  SELECT * INTO place FROM public.destinations
  WHERE id = (SELECT destination_id FROM public.trips WHERE id = p_trip_id);
  SELECT * INTO operator FROM public.providers
  WHERE id = (SELECT provider_id FROM public.trips WHERE id = p_trip_id);

  FOR pledge IN
    SELECT * FROM public.trip_interests
    WHERE trip_id = p_trip_id AND booking_id IS NULL AND reservation_result IS NULL
    ORDER BY created_at, user_id
  LOOP
    SELECT * INTO trip FROM public.trips WHERE id = p_trip_id;

    IF EXISTS (
      SELECT 1 FROM public.bookings AS b
      WHERE b.trip_id = p_trip_id AND b.user_id = pledge.user_id AND b.status IN ('confirmed', 'completed')
    ) THEN
      UPDATE public.trip_interests SET reservation_result = 'already_booked'
      WHERE trip_id = p_trip_id AND user_id = pledge.user_id;
      CONTINUE;
    END IF;

    SELECT * INTO link FROM public.trip_pickup_stations
    WHERE trip_id = p_trip_id AND station_id = pledge.pickup_station_id;
    SELECT * INTO station FROM public.pickup_stations WHERE id = pledge.pickup_station_id AND is_active;
    IF pledge.pickup_station_id IS NULL OR link.id IS NULL OR station.id IS NULL THEN
      UPDATE public.trip_interests SET reservation_result = 'no_pickup'
      WHERE trip_id = p_trip_id AND user_id = pledge.user_id;
      CONTINUE;
    END IF;

    IF COALESCE(trip.available_seats, 0) < pledge.seats THEN
      UPDATE public.trip_interests SET reservation_result = 'no_room'
      WHERE trip_id = p_trip_id AND user_id = pledge.user_id;
      CONTINUE;
    END IF;

    base_price := (trip.price * pledge.seats) + COALESCE(link.extra_price, 0);
    service_fee := CASE WHEN trip.currency = 'USD' THEN round(base_price * 0.05, 2) ELSE round(base_price * 0.05) END;
    reservation_key := gen_random_uuid();

    BEGIN
      INSERT INTO public.bookings (
        user_id, trip_id, destination_id, destination_name, provider_id, provider_name,
        trip_type, date, pickup_station, seats, passenger_details, payment_method,
        base_price, service_fee, provider_fee, total_price, currency, status, payment_status,
        qr_code, idempotency_key, source
      ) VALUES (
        pledge.user_id, trip.id, trip.destination_id, place.name, trip.provider_id, operator.name,
        trip.trip_type, trip.departure_date::DATE,
        jsonb_strip_nulls(jsonb_build_object(
          'id', station.id, 'name', station.name, 'address', station.address,
          'pickup_time', link.pickup_time, 'extra_price', link.extra_price,
          'pickup_address', pledge.pickup_address
        )),
        pledge.seats, '[]'::jsonb, 'chapa',
        base_price, service_fee, service_fee, base_price + service_fee, trip.currency,
        'confirmed', 'pending',
        'TANKUA-' || upper(substr(replace(reservation_key::TEXT, '-', ''), 1, 16)),
        reservation_key, 'interest_pledge'
      )
      RETURNING id INTO new_booking_id;

      UPDATE public.trip_interests SET booking_id = new_booking_id, reservation_result = 'reserved'
      WHERE trip_id = p_trip_id AND user_id = pledge.user_id;
      reserved := reserved + 1;
    EXCEPTION WHEN OTHERS THEN
      -- One traveler's problem must not stop the others' reservations.
      RAISE WARNING 'pledge reservation failed for %: %', pledge.user_id, SQLERRM;
      UPDATE public.trip_interests SET reservation_result = 'failed'
      WHERE trip_id = p_trip_id AND user_id = pledge.user_id;
    END;
  END LOOP;

  RETURN reserved;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_pledged_seats(UUID) FROM PUBLIC, anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Milestone messages: reserve first, then tell each pledger what happened.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_trip_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  place TEXT;
  day TEXT;
  pay_by TEXT;
BEGIN
  SELECT d.name INTO place FROM public.destinations AS d WHERE d.id = NEW.destination_id;
  place := COALESCE(place, 'your trip');
  day := to_char(NEW.departure_date AT TIME ZONE 'Africa/Addis_Ababa', 'Dy DD Mon');

  IF OLD.status = 'collecting_interest' AND NEW.status = 'upcoming' THEN
    PERFORM public.reserve_pledged_seats(NEW.id);

    INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
    SELECT 'user', interest.user_id,
      CASE WHEN interest.reservation_result = 'reserved'
        THEN format('Your seats for %s are reserved', place)
        ELSE format('%s is happening!', place) END,
      CASE interest.reservation_result
        WHEN 'reserved' THEN format(
          'The group goal was reached. We reserved your %s %s for %s on %s (pickup: %s). Payment opens when the trip is confirmed, and we will message you. Can''t make it? Release your seats in My Trips.',
          interest.seats, CASE WHEN interest.seats = 1 THEN 'seat' ELSE 'seats' END, place, day,
          COALESCE(interest.pickup_address, station.name, 'your chosen point'))
        WHEN 'no_room' THEN format(
          'The group goal for %s on %s was reached, but the trip filled up before your %s %s. Check the trip for any seats that open up.',
          place, day, interest.seats, CASE WHEN interest.seats = 1 THEN 'seat' ELSE 'seats' END)
        ELSE format(
          'The group goal for %s on %s was reached. Reserve your %s %s now; seats go to whoever books first.',
          place, day, interest.seats, CASE WHEN interest.seats = 1 THEN 'seat' ELSE 'seats' END)
      END,
      'booking',
      jsonb_build_object(
        'trip_id', NEW.id, 'event', 'interest_goal_reached', 'seats', interest.seats,
        'reservation', interest.reservation_result, 'booking_id', interest.booking_id
      )
    FROM public.trip_interests AS interest
    LEFT JOIN public.pickup_stations AS station ON station.id = interest.pickup_station_id
    WHERE interest.trip_id = NEW.id
      AND interest.reservation_result IS DISTINCT FROM 'already_booked';
  END IF;

  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    pay_by := to_char((clock_timestamp() + INTERVAL '2 hours') AT TIME ZONE 'Africa/Addis_Ababa', 'HH24:MI');

    INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
    SELECT DISTINCT ON (b.user_id) 'user', b.user_id,
      format('Payment is open for %s', place),
      format('Your trip to %s on %s is confirmed. Pay by %s (Addis time) to keep your seats.', place, day, pay_by),
      'payment',
      jsonb_build_object('trip_id', NEW.id, 'event', 'payment_open', 'booking_id', b.id)
    FROM public.bookings AS b
    WHERE b.trip_id = NEW.id AND b.status = 'confirmed' AND b.payment_status = 'pending'
      AND b.user_id IS NOT NULL;

    IF NEW.minimum_interest IS NOT NULL THEN
      INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
      SELECT 'user', interest.user_id,
        format('%s is open for booking', place),
        format('The trip to %s on %s is confirmed and taking bookings. Book soon; seats are limited.', place, day),
        'booking',
        jsonb_build_object('trip_id', NEW.id, 'event', 'trip_open', 'seats', interest.seats)
      FROM public.trip_interests AS interest
      WHERE interest.trip_id = NEW.id
        AND NOT EXISTS (
          SELECT 1 FROM public.bookings AS b
          WHERE b.trip_id = NEW.id AND b.user_id = interest.user_id AND b.status IN ('confirmed', 'completed')
        );
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- ----------------------------------------------------------------------------
-- Travelers release an unpaid reservation (frees the seats for others).
-- ----------------------------------------------------------------------------
CREATE FUNCTION public.release_unpaid_booking_for_user(p_booking_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  booking public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND OR booking.user_id IS DISTINCT FROM p_user_id OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;
  IF booking.status <> 'confirmed' OR booking.payment_status <> 'pending' THEN
    RAISE EXCEPTION 'Only unpaid reservations can be released here' USING ERRCODE = 'PT409';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.payment_transactions AS p
    WHERE p.booking_id = booking.id AND p.status IN ('pending', 'processing', 'success')
  ) THEN
    RAISE EXCEPTION 'A payment for this booking is in progress. Contact support to cancel it.' USING ERRCODE = 'PT409';
  END IF;

  UPDATE public.bookings SET status = 'cancelled' WHERE id = booking.id;

  RETURN jsonb_build_object('booking_id', booking.id, 'status', 'cancelled', 'seats_released', booking.seats);
END;
$$;

CREATE FUNCTION public.release_unpaid_booking(p_booking_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.release_unpaid_booking_for_user(p_booking_id, auth.uid());
$$;

REVOKE ALL ON FUNCTION public.release_unpaid_booking(UUID) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.release_unpaid_booking_for_user(UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_unpaid_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_unpaid_booking_for_user(UUID, UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- Keep pledged pickup points valid when a trip's pickup link is repointed
-- (the admin trip handover copies pickup points into the new provider).
-- ----------------------------------------------------------------------------
CREATE FUNCTION public.follow_trip_pickup_relink()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.trip_interests
  SET pickup_station_id = NEW.station_id
  WHERE trip_id = NEW.trip_id AND pickup_station_id = OLD.station_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER follow_trip_pickup_relink
  AFTER UPDATE OF station_id ON public.trip_pickup_stations
  FOR EACH ROW
  WHEN (OLD.station_id IS DISTINCT FROM NEW.station_id)
  EXECUTE FUNCTION public.follow_trip_pickup_relink();

REVOKE ALL ON FUNCTION public.follow_trip_pickup_relink() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
