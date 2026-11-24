BEGIN;

-- ============================================================================
-- 1. Interest counts seats, not people.
--    A family of four registers one interest for 4 seats. trips.interest_count
--    is now the total seats pledged, and minimum_interest is a seat goal.
--    Existing interests become 1 seat each, so current counts do not change.
-- ============================================================================

ALTER TABLE public.trip_interests
  ADD COLUMN seats INTEGER NOT NULL DEFAULT 1 CHECK (seats BETWEEN 1 AND 20),
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN public.trips.interest_count IS 'Seats pledged across trip_interests (sum of seats).';
COMMENT ON COLUMN public.trips.minimum_interest IS 'Seats that must be pledged before reservations open.';

CREATE OR REPLACE FUNCTION public.guard_trip_interest_fields()
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
      SELECT COALESCE(SUM(seats), 0)::INTEGER FROM public.trip_interests WHERE trip_id = NEW.id
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

CREATE OR REPLACE FUNCTION public.sync_trip_interest_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_trip_id UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.trip_id ELSE NEW.trip_id END;
  total_seats INTEGER;
BEGIN
  PERFORM 1 FROM public.trips WHERE id = target_trip_id FOR NO KEY UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(seats), 0)::INTEGER INTO total_seats
  FROM public.trip_interests
  WHERE trip_id = target_trip_id;

  UPDATE public.trips
  SET interest_count = total_seats,
      status = CASE
        WHEN TG_OP IN ('INSERT', 'UPDATE')
          AND status = 'collecting_interest'
          AND total_seats >= minimum_interest
        THEN 'upcoming'
        ELSE status
      END
  WHERE id = target_trip_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_trip_interest_count ON public.trip_interests;
CREATE TRIGGER sync_trip_interest_count
  AFTER INSERT OR DELETE OR UPDATE OF seats ON public.trip_interests
  FOR EACH ROW EXECUTE FUNCTION public.sync_trip_interest_count();

-- Same names and argument order as before plus an optional seat count, so
-- older app builds that send only p_trip_id keep working (1 seat).
DROP FUNCTION IF EXISTS public.express_trip_interest(UUID);
DROP FUNCTION IF EXISTS public.express_trip_interest_for_user(UUID, UUID);

CREATE FUNCTION public.express_trip_interest_for_user(p_trip_id UUID, p_user_id UUID, p_seats INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trip public.trips%ROWTYPE;
  pledged INTEGER;
  seat_limit INTEGER;
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

  SELECT seats INTO pledged FROM public.trip_interests WHERE trip_id = p_trip_id AND user_id = p_user_id;

  IF trip.status = 'collecting_interest' THEN
    IF trip.departure_date IS NULL OR trip.departure_date <= clock_timestamp() THEN
      RAISE EXCEPTION 'This trip has already departed';
    END IF;

    seat_limit := LEAST(20, GREATEST(COALESCE(trip.max_seats, 20), 1));
    IF p_seats IS NULL OR p_seats < 1 OR p_seats > seat_limit THEN
      RAISE EXCEPTION 'Choose between 1 and % seats', seat_limit USING ERRCODE = '22023';
    END IF;

    IF pledged IS NULL THEN
      INSERT INTO public.trip_interests (trip_id, user_id, seats) VALUES (p_trip_id, p_user_id, p_seats);
    ELSIF pledged <> p_seats THEN
      UPDATE public.trip_interests SET seats = p_seats, updated_at = NOW()
      WHERE trip_id = p_trip_id AND user_id = p_user_id;
    END IF;

    pledged := p_seats;
    SELECT * INTO trip FROM public.trips WHERE id = p_trip_id;
  END IF;

  RETURN jsonb_build_object(
    'trip_id', trip.id,
    'status', trip.status,
    'minimum_interest', trip.minimum_interest,
    'interest_count', trip.interest_count,
    'interested', pledged IS NOT NULL,
    'seats', pledged
  );
END;
$$;

CREATE FUNCTION public.express_trip_interest(p_trip_id UUID, p_seats INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.express_trip_interest_for_user(p_trip_id, auth.uid(), p_seats);
$$;

REVOKE ALL ON FUNCTION public.express_trip_interest(UUID, INTEGER) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.express_trip_interest_for_user(UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.express_trip_interest(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.express_trip_interest_for_user(UUID, UUID, INTEGER) TO service_role;

-- ============================================================================
-- 2. Tell travelers when something happens.
--    Goal reached  -> everyone who pledged seats.
--    Trip activated -> travelers holding a reservation (pay within 2 hours)
--                      and pledgers who have not booked yet.
-- ============================================================================

CREATE FUNCTION public.notify_trip_milestones()
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
  SELECT COALESCE(d.name, 'your trip') INTO place FROM public.destinations AS d WHERE d.id = NEW.destination_id;
  place := COALESCE(place, 'your trip');
  day := to_char(NEW.departure_date AT TIME ZONE 'Africa/Addis_Ababa', 'Dy DD Mon');

  IF OLD.status = 'collecting_interest' AND NEW.status = 'upcoming' THEN
    INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
    SELECT 'user', interest.user_id,
      format('%s is happening!', place),
      format('The group goal for %s on %s was reached. Reserve your %s %s now; seats go to whoever books first.',
        place, day, interest.seats, CASE WHEN interest.seats = 1 THEN 'seat' ELSE 'seats' END),
      'booking',
      jsonb_build_object('trip_id', NEW.id, 'event', 'interest_goal_reached', 'seats', interest.seats)
    FROM public.trip_interests AS interest
    WHERE interest.trip_id = NEW.id;
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

CREATE TRIGGER notify_trip_milestones
  AFTER UPDATE OF status ON public.trips
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_trip_milestones();

REVOKE ALL ON FUNCTION public.notify_trip_milestones() FROM PUBLIC, anon, authenticated, service_role;

-- ============================================================================
-- 3. Deliver booking and payment notifications outside the app.
--    Each new row is posted to the deliver-notification Edge Function, which
--    sends it through the Telegram bot and Expo push. Configure with:
--      select vault.create_secret('https://<ref>.supabase.co/functions/v1/deliver-notification', 'notification_delivery_url');
--      select vault.create_secret('<random secret>', 'notification_delivery_secret');
--    Until both secrets exist, nothing is sent and inserts behave as before.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery JSONB;

CREATE FUNCTION public.queue_notification_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  endpoint TEXT;
  secret TEXT;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO endpoint FROM vault.decrypted_secrets WHERE name = 'notification_delivery_url';
    SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'notification_delivery_secret';
    IF endpoint IS NULL OR secret IS NULL THEN
      RETURN NULL;
    END IF;

    PERFORM net.http_post(
      url := endpoint,
      body := jsonb_build_object('notification_id', NEW.id),
      headers := jsonb_build_object('content-type', 'application/json', 'x-delivery-secret', secret),
      timeout_milliseconds := 10000
    );
  EXCEPTION WHEN OTHERS THEN
    -- Delivery is best effort; never fail the notification itself.
    RAISE WARNING 'notification delivery not queued: %', SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE TRIGGER queue_notification_delivery
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  WHEN (NEW.recipient_type = 'user' AND NEW.type IN ('booking', 'payment'))
  EXECUTE FUNCTION public.queue_notification_delivery();

REVOKE ALL ON FUNCTION public.queue_notification_delivery() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
