BEGIN;

CREATE TABLE public.trip_promotion_visits (
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'whatsapp', 'instagram')),
  visit_id UUID NOT NULL,
  PRIMARY KEY (trip_id, channel, visit_id)
);

CREATE TABLE public.trip_promotion_bookings (
  booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'whatsapp', 'instagram'))
);

ALTER TABLE public.trip_promotion_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_promotion_bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_promotion_visits, public.trip_promotion_bookings FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.record_trip_promotion_visit(p_trip_id UUID, p_channel TEXT, p_visit_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.trip_promotion_visits (trip_id, channel, visit_id)
  SELECT trip.id, p_channel, p_visit_id
  FROM public.trips AS trip
  JOIN public.providers AS provider ON provider.id = trip.provider_id
  WHERE trip.id = p_trip_id
    AND p_channel IN ('telegram', 'whatsapp', 'instagram')
    AND p_visit_id IS NOT NULL
    AND trip.status IN ('collecting_interest', 'upcoming', 'active')
    AND trip.departure_date > now()
    AND provider.status = 'active'
  ON CONFLICT DO NOTHING;
$$;
REVOKE ALL ON FUNCTION public.record_trip_promotion_visit(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_trip_promotion_visit(UUID, TEXT, UUID) TO anon, authenticated;

-- Capture the promotion in the same transaction as the original booking insert.
-- A retry that returns an existing booking never fires this trigger.
CREATE FUNCTION public.capture_trip_promotion_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_channel TEXT := current_setting('tankua.promotion_channel', true);
BEGIN
  IF v_channel IN ('telegram', 'whatsapp', 'instagram')
    AND NEW.source = 'telegram_mini_app'
    AND NEW.idempotency_key::TEXT = current_setting('tankua.promotion_request', true)
  THEN
    INSERT INTO public.trip_promotion_bookings (booking_id, channel)
    VALUES (NEW.id, v_channel);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_trip_promotion_booking() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER capture_trip_promotion_booking
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.capture_trip_promotion_booking();

CREATE FUNCTION public.create_promoted_miniapp_booking(
  p_user_id UUID,
  p_trip_id UUID,
  p_station_id UUID,
  p_seats INTEGER,
  p_passengers JSONB,
  p_idempotency_key UUID,
  p_pickup_address TEXT,
  p_channel TEXT
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  IF p_channel IS NULL OR p_channel NOT IN ('telegram', 'whatsapp', 'instagram') THEN
    RAISE EXCEPTION 'Invalid promotion channel';
  END IF;
  PERFORM set_config('tankua.promotion_channel', p_channel, true);
  PERFORM set_config('tankua.promotion_request', p_idempotency_key::TEXT, true);
  v_booking := public.create_miniapp_booking(
    p_user_id, p_trip_id, p_station_id, p_seats, p_passengers, p_idempotency_key, p_pickup_address
  );
  PERFORM set_config('tankua.promotion_channel', '', true);
  PERFORM set_config('tankua.promotion_request', '', true);
  RETURN v_booking;
END;
$$;
REVOKE ALL ON FUNCTION public.create_promoted_miniapp_booking(UUID, UUID, UUID, INTEGER, JSONB, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_promoted_miniapp_booking(UUID, UUID, UUID, INTEGER, JSONB, UUID, TEXT, TEXT) TO service_role;

CREATE FUNCTION public.get_trip_promotion(p_trip_id UUID)
RETURNS TABLE (
  channel TEXT,
  visits BIGINT,
  reservations BIGINT,
  paid_bookings BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.trips AS trip
    JOIN public.providers AS provider ON provider.id = trip.provider_id
    WHERE trip.id = p_trip_id
      AND provider.status = 'active'
      AND trip.provider_id = public.get_user_provider_id(auth.uid()::TEXT)
  ) THEN
    RAISE EXCEPTION 'Trip is unavailable' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH views AS (
    SELECT visit.channel, count(*) AS total
    FROM public.trip_promotion_visits AS visit
    WHERE visit.trip_id = p_trip_id
    GROUP BY visit.channel
  ), sales AS (
    SELECT attribution.channel, count(*) AS total,
      count(*) FILTER (WHERE booking.payment_status = 'paid') AS paid
    FROM public.bookings AS booking
    JOIN public.trip_promotion_bookings AS attribution ON attribution.booking_id = booking.id
    WHERE booking.trip_id = p_trip_id
    GROUP BY attribution.channel
  )
  SELECT channels.name, coalesce(views.total, 0), coalesce(sales.total, 0), coalesce(sales.paid, 0)
  FROM (VALUES ('telegram'), ('whatsapp'), ('instagram')) AS channels(name)
  LEFT JOIN views ON views.channel = channels.name
  LEFT JOIN sales ON sales.channel = channels.name;
END;
$$;
REVOKE ALL ON FUNCTION public.get_trip_promotion(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_trip_promotion(UUID) TO authenticated;

COMMIT;
