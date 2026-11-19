BEGIN;

CREATE INDEX IF NOT EXISTS bookings_pending_trip_payment_idx
  ON public.bookings (trip_id)
  WHERE status = 'confirmed' AND payment_status = 'pending';

CREATE OR REPLACE FUNCTION public.set_payment_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trip public.trips%ROWTYPE;
BEGIN
  IF NEW.trip_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    SELECT * INTO trip FROM public.trips WHERE id = NEW.trip_id FOR NO KEY UPDATE;

    IF trip.status IS NULL OR trip.status NOT IN ('upcoming', 'active')
      OR trip.departure_date IS NULL OR trip.departure_date <= clock_timestamp() THEN
      RAISE EXCEPTION 'This trip is not open for booking';
    END IF;

    IF NEW.seats <= 0 OR COALESCE(trip.available_seats, 0) < NEW.seats THEN
      RAISE EXCEPTION 'Not enough seats available';
    END IF;

    IF NEW.payment_status = 'pending' THEN
      NEW.payment_deadline := CASE WHEN trip.status = 'active'
        THEN clock_timestamp() + INTERVAL '2 hours' END;
    END IF;
  ELSIF NEW.payment_deadline IS NULL AND NEW.payment_status = 'pending' THEN
    NEW.payment_deadline := NEW.created_at + INTERVAL '2 hours';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_trip_payment_deadlines()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  activated_at TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF NEW.status = 'upcoming' THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings
      WHERE trip_id = NEW.id AND status = 'confirmed' AND payment_status = 'pending'
        AND payment_deadline > activated_at
    ) THEN
      RAISE EXCEPTION 'Pending payments must be completed or expire before this trip can return to Upcoming.';
    END IF;

    RETURN NULL;
  END IF;

  IF NEW.departure_date IS NULL OR NEW.departure_date <= activated_at THEN
    RAISE EXCEPTION 'Only a trip with a future departure can be activated';
  END IF;

  -- Booking cancellations can update the trip to release seats. Retry activation
  -- when a reservation is locked instead of waiting while holding the trip lock.
  PERFORM 1 FROM public.bookings
  WHERE trip_id = NEW.id AND status = 'confirmed'
    AND payment_status = 'pending' AND payment_deadline IS NULL
  FOR UPDATE NOWAIT;

  UPDATE public.bookings
  SET payment_deadline = activated_at + INTERVAL '2 hours'
  WHERE trip_id = NEW.id AND status = 'confirmed'
    AND payment_status = 'pending' AND payment_deadline IS NULL;

  RETURN NULL;
EXCEPTION WHEN lock_not_available THEN
  RAISE EXCEPTION 'A reservation is being updated. Please try activating the trip again.'
    USING ERRCODE = '55P03';
END;
$$;

DROP TRIGGER IF EXISTS sync_trip_payment_deadlines ON public.trips;
CREATE TRIGGER sync_trip_payment_deadlines
  AFTER UPDATE OF status ON public.trips
  FOR EACH ROW
  WHEN (NEW.status IN ('active', 'upcoming') AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_trip_payment_deadlines();

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

DROP TRIGGER IF EXISTS guard_booking_payment_start ON public.payment_transactions;
CREATE TRIGGER guard_booking_payment_start
  BEFORE INSERT ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.guard_booking_payment_start();

CREATE OR REPLACE FUNCTION public.delete_expired_unpaid_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Keep a record of reservations that never opened for payment.
  UPDATE public.bookings AS booking
  SET status = 'cancelled'
  FROM public.trips AS trip
  WHERE booking.trip_id = trip.id AND booking.status = 'confirmed'
    AND booking.payment_status = 'pending' AND booking.payment_deadline IS NULL
    AND (trip.status IN ('cancelled', 'completed', 'ongoing') OR trip.departure_date <= NOW());

  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE payment_status = 'pending' AND payment_deadline <= NOW() AND status <> 'cancelled';

  DELETE FROM public.bookings
  WHERE payment_status = 'pending' AND payment_deadline <= NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Keep live reservations for future upcoming trips across the change in policy.
UPDATE public.bookings AS booking
SET payment_deadline = NULL
FROM public.trips AS trip
WHERE booking.trip_id = trip.id AND trip.status = 'upcoming' AND trip.departure_date > NOW()
  AND booking.status = 'confirmed' AND booking.payment_status = 'pending'
  AND booking.payment_deadline > NOW();

-- Give older active reservations a deadline if they predate the deadline trigger.
UPDATE public.bookings AS booking
SET payment_deadline = NOW() + INTERVAL '2 hours'
FROM public.trips AS trip
WHERE booking.trip_id = trip.id AND trip.status = 'active' AND trip.departure_date > NOW()
  AND booking.status = 'confirmed' AND booking.payment_status = 'pending'
  AND booking.payment_deadline IS NULL;

COMMENT ON COLUMN public.bookings.payment_deadline IS
  'Two hours from activation for deferred reservations and two hours from booking for active trips.';

REVOKE ALL ON FUNCTION public.set_payment_deadline() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sync_trip_payment_deadlines() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.guard_booking_payment_start() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
