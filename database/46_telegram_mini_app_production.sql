-- Production support for the Tankua Telegram Mini App.
-- Apply with the Supabase SQL editor after reviewing against the live schema.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS telegram_id BIGINT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS telegram_language_code TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_unique
  ON public.users (telegram_id)
  WHERE telegram_id IS NOT NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'mobile';

CREATE UNIQUE INDEX IF NOT EXISTS bookings_user_idempotency_unique
  ON public.bookings (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.telegram_auth_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS telegram_auth_events_created_idx
  ON public.telegram_auth_events (created_at DESC);
CREATE INDEX IF NOT EXISTS telegram_auth_events_telegram_idx
  ON public.telegram_auth_events (telegram_id, created_at DESC);

ALTER TABLE public.telegram_auth_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.telegram_auth_events FROM anon, authenticated;

-- Migration 35 decremented inventory both when a booking was created and again
-- when it was paid. A reservation must consume seats exactly once and release
-- them exactly once when cancelled.
DROP TRIGGER IF EXISTS trigger_update_trip_seats_on_payment ON public.bookings;
DROP FUNCTION IF EXISTS public.update_trip_seats_on_payment();

CREATE OR REPLACE FUNCTION public.release_trip_seats_on_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'confirmed'
     AND NEW.status = 'cancelled'
     AND NEW.trip_id IS NOT NULL THEN
    UPDATE public.trips
    SET available_seats = LEAST(max_seats, available_seats + OLD.seats)
    WHERE id = NEW.trip_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_release_trip_seats_on_cancellation ON public.bookings;
CREATE TRIGGER trigger_release_trip_seats_on_cancellation
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.release_trip_seats_on_cancellation();

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
    p_user_id, v_trip.id, v_destination.id, v_destination.name, v_trip.provider_id, NULL,
    v_trip.trip_type, v_trip.departure_date::DATE,
    jsonb_build_object(
      'id', v_station.id, 'name', v_station.name, 'address', v_station.address,
      'pickup_time', v_link.pickup_time, 'extra_price', v_link.extra_price
    ),
    p_seats, p_passengers, 'chapa',
    v_base_price, v_service_fee, ROUND(v_base_price * 0.05), v_total,
    'confirmed', 'pending', NOW() + INTERVAL '2 hours',
    'TANKUA-' || upper(substr(replace(uuid_generate_v4()::TEXT, '-', ''), 1, 16)),
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
