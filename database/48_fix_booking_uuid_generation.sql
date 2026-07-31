-- Keep legacy table defaults and functions working when uuid-ossp is installed
-- outside the public schema.
CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
RETURNS UUID
LANGUAGE SQL
VOLATILE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT gen_random_uuid();
$$;

REVOKE ALL ON FUNCTION public.uuid_generate_v4() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uuid_generate_v4() TO anon, authenticated, service_role;

-- The Mini App already supplies an idempotency UUID. Reuse it for the visible
-- QR reference instead of depending on uuid-ossp inside a restricted function.
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
  v_service_fee := ROUND(v_base_price * 0.05);
  v_total := v_base_price + v_service_fee;

  INSERT INTO public.bookings (
    user_id, trip_id, destination_id, destination_name, provider_id, provider_name,
    trip_type, date, pickup_station, seats, passenger_details, payment_method,
    base_price, service_fee, provider_fee, total_price, status, payment_status,
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
    v_base_price, v_service_fee, ROUND(v_base_price * 0.05), v_total,
    'confirmed', 'pending', NOW() + INTERVAL '2 hours',
    'TANKUA-' || upper(substr(replace(p_idempotency_key::TEXT, '-', ''), 1, 16)),
    p_idempotency_key, 'telegram_mini_app'
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.create_miniapp_booking(UUID, UUID, UUID, INTEGER, JSONB, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_miniapp_booking(UUID, UUID, UUID, INTEGER, JSONB, UUID)
  TO service_role;
