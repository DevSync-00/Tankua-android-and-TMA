BEGIN;

ALTER TABLE public.trips
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'ETB'
    CONSTRAINT trips_currency_check CHECK (currency IN ('ETB', 'USD'));

ALTER TABLE public.bookings
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'ETB'
    CONSTRAINT bookings_currency_check CHECK (currency IN ('ETB', 'USD'));

COMMENT ON COLUMN public.trips.currency IS 'Currency of the per-seat fare and trip-specific pickup surcharges.';
COMMENT ON COLUMN public.bookings.currency IS 'Currency agreed when the booking was created.';
COMMENT ON COLUMN public.trip_pickup_stations.extra_price IS 'Surcharge in the linked trip currency.';

CREATE FUNCTION public.guard_trip_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'Trip currency is set at creation and cannot be changed.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_trip_currency
  BEFORE UPDATE OF currency ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.guard_trip_currency();

CREATE FUNCTION public.guard_booking_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trip_currency TEXT := 'ETB';
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'Booking currency is set at creation and cannot be changed.';
  END IF;

  IF NEW.trip_id IS NOT NULL THEN
    SELECT currency INTO trip_currency FROM public.trips WHERE id = NEW.trip_id;
  END IF;

  IF trip_currency IS NOT NULL AND NEW.currency IS DISTINCT FROM trip_currency THEN
    RAISE EXCEPTION 'This reservation must use %.', trip_currency USING ERRCODE = 'PT409';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_booking_currency
  BEFORE INSERT OR UPDATE OF trip_id, currency ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_booking_currency();

CREATE FUNCTION public.guard_payment_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  booking_currency TEXT;
BEGIN
  IF NEW.booking_id IS NOT NULL THEN
    SELECT currency INTO booking_currency FROM public.bookings WHERE id = NEW.booking_id;
    IF FOUND AND NEW.currency IS DISTINCT FROM booking_currency THEN
      RAISE EXCEPTION 'This booking must be paid in %.', booking_currency USING ERRCODE = 'PT409';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_payment_currency
  BEFORE INSERT OR UPDATE OF booking_id, currency ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.guard_payment_currency();

REVOKE ALL ON FUNCTION public.guard_trip_currency() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.guard_booking_currency() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.guard_payment_currency() FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_provider_trip(p_trip JSONB, p_pickup_stations JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  trip_request public.trips%ROWTYPE;
  created_trip_id UUID;
  linked_station_count INTEGER;
BEGIN
  SELECT * INTO trip_request FROM jsonb_populate_record(NULL::public.trips, p_trip);

  IF trip_request.provider_id IS NULL OR trip_request.destination_id IS NULL OR trip_request.trip_type IS NULL THEN
    RAISE EXCEPTION 'Choose a provider, destination, and trip type.';
  END IF;

  IF trip_request.departure_date IS NULL OR trip_request.departure_date <= clock_timestamp()
    OR NOT isfinite(trip_request.departure_date) THEN
    RAISE EXCEPTION 'Choose a future departure date and time.';
  END IF;

  IF trip_request.trip_type = 'one_way' THEN
    trip_request.return_date := NULL;
  END IF;

  IF (trip_request.trip_type = 'round_trip' AND trip_request.return_date IS NULL)
    OR (trip_request.return_date IS NOT NULL AND (
      trip_request.return_date <= trip_request.departure_date OR NOT isfinite(trip_request.return_date)
    )) THEN
    RAISE EXCEPTION 'Choose a return date and time after departure.';
  END IF;

  IF trip_request.price IS NULL OR trip_request.price <= 0 OR trip_request.price >= 'Infinity'::NUMERIC THEN
    RAISE EXCEPTION 'Enter a price greater than zero.';
  END IF;

  IF trip_request.max_seats IS NULL OR trip_request.max_seats NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Enter a whole seat count between 1 and 100.';
  END IF;

  trip_request.summary := btrim(trip_request.summary);
  IF trip_request.summary IS NULL OR char_length(trip_request.summary) NOT BETWEEN 1 AND 280 THEN
    RAISE EXCEPTION 'Write a trip summary of 1 to 280 characters.';
  END IF;

  IF jsonb_typeof(p_pickup_stations) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Select at least one pickup station.';
  END IF;
  IF jsonb_array_length(p_pickup_stations) = 0 THEN
    RAISE EXCEPTION 'Select at least one pickup station.';
  END IF;

  INSERT INTO public.trips (
    provider_id, destination_id, trip_type, date, departure_date, return_date,
    price, currency, max_seats, available_seats, status, minimum_interest, tour_category,
    summary, itinerary, duration_minutes, transportation_type, difficulty_level,
    inclusions, exclusions, meeting_instructions, what_to_bring, cancellation_policy
  ) VALUES (
    trip_request.provider_id, trip_request.destination_id, trip_request.trip_type,
    (trip_request.departure_date AT TIME ZONE 'Africa/Addis_Ababa')::DATE,
    trip_request.departure_date, trip_request.return_date,
    trip_request.price, COALESCE(trip_request.currency, 'ETB'), trip_request.max_seats, trip_request.max_seats,
    CASE WHEN trip_request.minimum_interest IS NULL THEN 'upcoming' ELSE 'collecting_interest' END,
    trip_request.minimum_interest, trip_request.tour_category,
    trip_request.summary, trip_request.itinerary, trip_request.duration_minutes,
    trip_request.transportation_type, trip_request.difficulty_level,
    COALESCE(trip_request.inclusions, '{}'), COALESCE(trip_request.exclusions, '{}'),
    trip_request.meeting_instructions, trip_request.what_to_bring, trip_request.cancellation_policy
  ) RETURNING id INTO created_trip_id;

  INSERT INTO public.trip_pickup_stations (trip_id, station_id, pickup_time, extra_price)
  SELECT created_trip_id, station.id, pickup.pickup_time, pickup.extra_price
  FROM jsonb_to_recordset(p_pickup_stations) AS pickup(station_id UUID, pickup_time TEXT, extra_price NUMERIC)
  JOIN public.pickup_stations AS station ON station.id = pickup.station_id
  WHERE station.provider_id = trip_request.provider_id AND station.is_active
    AND pickup.pickup_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND pickup.extra_price >= 0 AND pickup.extra_price < 'Infinity'::NUMERIC;

  GET DIAGNOSTICS linked_station_count = ROW_COUNT;
  IF linked_station_count <> jsonb_array_length(p_pickup_stations) THEN
    RAISE EXCEPTION 'Use active pickup stations from your provider and check their times and extra prices.';
  END IF;

  RETURN created_trip_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_miniapp_booking(
  p_user_id UUID,
  p_trip_id UUID,
  p_station_id UUID,
  p_seats INTEGER,
  p_passengers JSONB,
  p_idempotency_key UUID
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip public.trips%ROWTYPE;
  v_station public.pickup_stations%ROWTYPE;
  v_link public.trip_pickup_stations%ROWTYPE;
  v_destination public.destinations%ROWTYPE;
  v_provider public.providers%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_existing public.bookings%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_base_price NUMERIC;
  v_service_fee NUMERIC;
  v_total NUMERIC;
BEGIN
  IF p_user_id IS NULL OR p_trip_id IS NULL OR p_station_id IS NULL OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Missing required booking identifiers';
  END IF;
  IF p_seats < 1 OR p_seats > 8 THEN
    RAISE EXCEPTION 'Seats must be between 1 and 8';
  END IF;
  IF jsonb_typeof(p_passengers) <> 'array' OR jsonb_array_length(p_passengers) <> p_seats THEN
    RAISE EXCEPTION 'Passenger count must match seat count';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_passengers) passenger
    WHERE length(trim(COALESCE(passenger->>'name', ''))) < 2
       OR COALESCE((passenger->>'age')::INTEGER, 0) NOT BETWEEN 1 AND 120
  ) THEN
    RAISE EXCEPTION 'Invalid passenger details';
  END IF;

  SELECT * INTO v_existing
  FROM public.bookings
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_existing; END IF;

  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trip not found'; END IF;
  IF v_trip.status NOT IN ('active', 'upcoming') THEN RAISE EXCEPTION 'Trip is not bookable'; END IF;
  IF v_trip.departure_date IS NULL OR v_trip.departure_date <= NOW() THEN RAISE EXCEPTION 'Trip has departed'; END IF;
  IF COALESCE(v_trip.available_seats, 0) < p_seats THEN RAISE EXCEPTION 'Not enough seats available'; END IF;

  SELECT * INTO v_link
  FROM public.trip_pickup_stations
  WHERE trip_id = p_trip_id AND station_id = p_station_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pickup station is not available for this trip'; END IF;

  SELECT * INTO v_station FROM public.pickup_stations WHERE id = p_station_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pickup station not found'; END IF;

  SELECT * INTO v_destination FROM public.destinations WHERE id = v_trip.destination_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Destination not found'; END IF;

  SELECT * INTO v_provider FROM public.providers WHERE id = v_trip.provider_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Provider not found'; END IF;

  v_base_price := (v_trip.price * p_seats) + COALESCE(v_link.extra_price, 0);
  v_service_fee := CASE WHEN v_trip.currency = 'USD' THEN ROUND(v_base_price * 0.05, 2)
    ELSE ROUND(v_base_price * 0.05) END;
  v_total := v_base_price + v_service_fee;

  INSERT INTO public.bookings (
    user_id, trip_id, destination_id, destination_name, provider_id, provider_name,
    trip_type, date, pickup_station, seats, passenger_details, payment_method,
    base_price, service_fee, provider_fee, total_price, currency, status, payment_status,
    payment_deadline, qr_code, idempotency_key, source
  )
  VALUES (
    p_user_id, v_trip.id, v_destination.id, v_destination.name, v_trip.provider_id, v_provider.name,
    v_trip.trip_type, v_trip.departure_date::DATE,
    jsonb_build_object(
      'id', v_station.id, 'name', v_station.name, 'address', v_station.address,
      'pickup_time', v_link.pickup_time, 'extra_price', v_link.extra_price
    ),
    p_seats, p_passengers, 'chapa',
    v_base_price, v_service_fee, v_service_fee, v_total, v_trip.currency,
    'confirmed', 'pending', NOW() + INTERVAL '2 hours',
    'TANKUA-' || upper(substr(replace(p_idempotency_key::TEXT, '-', ''), 1, 16)),
    p_idempotency_key, 'telegram_mini_app'
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_provider_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  provider_owner_id UUID;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only notify if booking has a provider_id
  IF NEW.provider_id IS NOT NULL THEN
    -- Get the provider owner's user ID
    SELECT id INTO provider_owner_id
    FROM public.provider_users
    WHERE provider_id = NEW.provider_id
      AND role = 'owner'
      AND is_active = TRUE
    LIMIT 1;

    -- Only create notification if we found a provider owner
    IF provider_owner_id IS NOT NULL THEN
      -- Determine notification content based on payment status
      IF NEW.payment_status = 'paid' THEN
        notification_title := 'New Paid Booking';
        notification_message := format('A customer booked %s seat(s) for %s. Payment received: %s %s',
          NEW.seats,
          COALESCE(NEW.destination_name, 'your trip'),
          NEW.total_price,
          NEW.currency
        );
      ELSE
        notification_title := 'New Booking (Pending Payment)';
        notification_message := format('A customer booked %s seat(s) for %s. Total: %s %s (payment pending)',
          NEW.seats,
          COALESCE(NEW.destination_name, 'your trip'),
          NEW.total_price,
          NEW.currency
        );
      END IF;

      -- Create notification for provider owner
      INSERT INTO public.notifications (
        recipient_type,
        recipient_id,
        title,
        message,
        type,
        data,
        action_url
      ) VALUES (
        'provider',
        provider_owner_id,
        notification_title,
        notification_message,
        'booking',
        jsonb_build_object(
          'booking_id', NEW.id,
          'provider_id', NEW.provider_id,
          'seats', NEW.seats,
          'total_price', NEW.total_price,
          'currency', NEW.currency,
          'payment_status', NEW.payment_status,
          'destination_name', NEW.destination_name
        ),
        format('/dashboard/bookings?booking=%s', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.notify_provider_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  provider_owner_id UUID;
BEGIN
  -- Notify when payment status changes to 'paid'
  IF NEW.payment_status = 'paid'
     AND OLD.payment_status != 'paid'
     AND NEW.provider_id IS NOT NULL THEN
    -- Get the provider owner's user ID
    SELECT id INTO provider_owner_id
    FROM public.provider_users
    WHERE provider_id = NEW.provider_id
      AND role = 'owner'
      AND is_active = TRUE
    LIMIT 1;

    IF provider_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        recipient_type,
        recipient_id,
        title,
        message,
        type,
        data,
        action_url
      ) VALUES (
        'provider',
        provider_owner_id,
        'Payment Received',
        format('Payment of %s %s received for booking %s (%s seat(s))',
          NEW.total_price,
          NEW.currency,
          LEFT(NEW.id::text, 8),
          NEW.seats
        ),
        'payment',
        jsonb_build_object(
          'booking_id', NEW.id,
          'provider_id', NEW.provider_id,
          'amount', NEW.total_price,
          'currency', NEW.currency,
          'seats', NEW.seats
        ),
        format('/dashboard/bookings?booking=%s', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT;
