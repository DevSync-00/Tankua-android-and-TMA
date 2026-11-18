BEGIN;

ALTER TABLE public.trips
  ADD COLUMN minimum_interest INTEGER,
  ADD COLUMN interest_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.trips
  DROP CONSTRAINT IF EXISTS trips_status_check,
  ADD CONSTRAINT trips_status_check CHECK (
    status IN ('active', 'upcoming', 'ongoing', 'completed', 'cancelled', 'collecting_interest')
  ),
  ADD CONSTRAINT trips_interest_threshold_check CHECK (
    interest_count >= 0
    AND (
      (minimum_interest IS NULL AND interest_count = 0 AND status IS DISTINCT FROM 'collecting_interest')
      OR (minimum_interest IS NOT NULL AND minimum_interest > 0)
    )
  );

CREATE TABLE public.trip_interests (
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

CREATE INDEX trip_interests_user_trip_idx ON public.trip_interests (user_id, trip_id);

ALTER TABLE public.trip_interests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.trip_interests FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.trip_interests TO authenticated, service_role;

CREATE POLICY "Travelers read their own trip interests"
  ON public.trip_interests FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.guard_trip_interest_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.interest_count <> 0
      OR (NEW.minimum_interest IS NOT NULL AND NEW.status IS DISTINCT FROM 'collecting_interest') THEN
      RAISE EXCEPTION 'An interest-based trip must start by collecting interest';
    END IF;

    IF NEW.status = 'collecting_interest'
      AND (NEW.departure_date IS NULL OR NEW.departure_date <= clock_timestamp()) THEN
      RAISE EXCEPTION 'An interest-based trip needs a future departure';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.minimum_interest IS DISTINCT FROM OLD.minimum_interest THEN
    RAISE EXCEPTION 'The interest threshold cannot change after a trip is created';
  END IF;

  IF NEW.interest_count IS DISTINCT FROM OLD.interest_count
    AND NEW.interest_count IS DISTINCT FROM (
      SELECT COUNT(*)::INTEGER FROM public.trip_interests WHERE trip_id = NEW.id
    ) THEN
    RAISE EXCEPTION 'Interest counts are managed from traveler responses';
  END IF;

  IF NEW.status = 'collecting_interest' THEN
    IF OLD.status IS DISTINCT FROM 'collecting_interest' THEN
      RAISE EXCEPTION 'Interest collection can only start when a trip is created';
    END IF;

    IF NEW.departure_date IS DISTINCT FROM OLD.departure_date
      AND (NEW.departure_date IS NULL OR NEW.departure_date <= clock_timestamp()) THEN
      RAISE EXCEPTION 'An interest-based trip needs a future departure';
    END IF;
  ELSIF OLD.minimum_interest IS NOT NULL
    AND OLD.status IN ('collecting_interest', 'cancelled')
    AND NEW.status IS DISTINCT FROM 'cancelled'
    AND NEW.interest_count < NEW.minimum_interest THEN
    RAISE EXCEPTION 'This trip has not reached its interest threshold';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_trip_interest_fields
  BEFORE INSERT OR UPDATE OF status, minimum_interest, interest_count, departure_date ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.guard_trip_interest_fields();

CREATE FUNCTION public.sync_trip_interest_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_trip_id UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.trip_id ELSE NEW.trip_id END;
  total_interest INTEGER;
BEGIN
  PERFORM 1 FROM public.trips WHERE id = target_trip_id FOR NO KEY UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*)::INTEGER INTO total_interest
  FROM public.trip_interests
  WHERE trip_id = target_trip_id;

  UPDATE public.trips
  SET interest_count = total_interest,
      status = CASE
        WHEN TG_OP = 'INSERT'
          AND status = 'collecting_interest'
          AND total_interest >= minimum_interest
        THEN 'upcoming'
        ELSE status
      END
  WHERE id = target_trip_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_trip_interest_count
  AFTER INSERT OR DELETE ON public.trip_interests
  FOR EACH ROW EXECUTE FUNCTION public.sync_trip_interest_count();

CREATE FUNCTION public.express_trip_interest_for_user(p_trip_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trip public.trips%ROWTYPE;
  already_interested BOOLEAN;
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

  SELECT EXISTS (
    SELECT 1 FROM public.trip_interests WHERE trip_id = p_trip_id AND user_id = p_user_id
  ) INTO already_interested;

  IF NOT already_interested AND trip.status = 'collecting_interest' THEN
    IF trip.departure_date IS NULL OR trip.departure_date <= clock_timestamp() THEN
      RAISE EXCEPTION 'This trip has already departed';
    END IF;

    INSERT INTO public.trip_interests (trip_id, user_id) VALUES (p_trip_id, p_user_id)
    ON CONFLICT (trip_id, user_id) DO NOTHING;

    already_interested := TRUE;
    SELECT * INTO trip FROM public.trips WHERE id = p_trip_id;
  END IF;

  RETURN jsonb_build_object(
    'trip_id', trip.id,
    'status', trip.status,
    'minimum_interest', trip.minimum_interest,
    'interest_count', trip.interest_count,
    'interested', already_interested
  );
END;
$$;

CREATE FUNCTION public.express_trip_interest(p_trip_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.express_trip_interest_for_user(p_trip_id, auth.uid());
$$;

CREATE FUNCTION public.guard_interest_trip_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trip_status TEXT;
  departure TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.trip_id IS NOT DISTINCT FROM OLD.trip_id THEN
    RETURN NEW;
  END IF;

  SELECT status, departure_date INTO trip_status, departure
  FROM public.trips
  WHERE id = NEW.trip_id AND minimum_interest IS NOT NULL
  FOR NO KEY UPDATE;

  IF FOUND AND (
    trip_status IS NULL OR trip_status NOT IN ('active', 'upcoming')
    OR departure IS NULL OR departure <= clock_timestamp()
  ) THEN
    RAISE EXCEPTION 'This trip is not open for booking';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_interest_trip_booking
  BEFORE INSERT OR UPDATE OF trip_id ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_interest_trip_booking();

REVOKE ALL ON FUNCTION public.guard_trip_interest_fields() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sync_trip_interest_count() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.guard_interest_trip_booking() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.express_trip_interest(UUID) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.express_trip_interest_for_user(UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.express_trip_interest(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.express_trip_interest_for_user(UUID, UUID) TO service_role;

COMMIT;
