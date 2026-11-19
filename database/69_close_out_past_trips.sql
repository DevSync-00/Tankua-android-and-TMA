BEGIN;

ALTER TABLE public.trips ADD COLUMN revised_end_at TIMESTAMPTZ,
  ADD COLUMN closeout_reason TEXT, ADD COLUMN closed_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN expired_at TIMESTAMPTZ;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id),
  ADD COLUMN IF NOT EXISTS vehicle_rating INTEGER CHECK (vehicle_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5);
ALTER TABLE public.refunds ADD COLUMN currency TEXT NOT NULL DEFAULT 'ETB'
  CHECK (currency IN ('ETB', 'USD'));
UPDATE public.refunds AS r SET currency = b.currency
FROM public.bookings AS b WHERE b.id = r.booking_id;

UPDATE public.bookings b SET status = 'completed'
FROM public.trips t WHERE b.trip_id = t.id AND t.status = 'completed'
  AND b.status = 'confirmed' AND b.payment_status = 'paid';

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

CREATE FUNCTION public.trip_expected_end(trip public.trips)
RETURNS TIMESTAMPTZ LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT COALESCE(trip.revised_end_at,
    CASE WHEN trip.return_date > trip.departure_date THEN trip.return_date END,
    trip.departure_date + (trip.duration_minutes * INTERVAL '1 minute'),
    trip.departure_date);
$$;

CREATE FUNCTION public.cap_booking_deadline_at_departure()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE departure TIMESTAMPTZ;
BEGIN
  IF NEW.payment_deadline IS NOT NULL AND NEW.payment_status = 'pending' THEN
    SELECT departure_date INTO departure FROM public.trips WHERE id = NEW.trip_id;
    IF departure IS NOT NULL THEN
      NEW.payment_deadline := LEAST(NEW.payment_deadline, departure);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER zz_cap_booking_deadline_at_departure
  BEFORE INSERT OR UPDATE OF payment_deadline ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.cap_booking_deadline_at_departure();

UPDATE public.bookings b SET payment_deadline = t.departure_date
FROM public.trips t WHERE b.trip_id = t.id AND b.payment_status = 'pending'
AND b.status = 'confirmed' AND b.payment_deadline > t.departure_date;

CREATE FUNCTION public.queue_closeout_refund()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.status = 'cancelled' AND NEW.payment_status = 'paid'
    AND (NEW.expired_at IS NOT NULL OR EXISTS (
      SELECT 1 FROM public.trips WHERE id = NEW.trip_id AND closeout_reason = 'did_not_run'
    )) THEN
    INSERT INTO public.refunds (booking_id, user_id, amount, currency, reason)
    SELECT NEW.id, NEW.user_id, NEW.total_price, NEW.currency, 'Trip closeout: review payment for cancelled reservation'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.refunds WHERE booking_id = NEW.id AND status <> 'rejected'
    );
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER queue_closeout_refund
  AFTER UPDATE OF status, payment_status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.queue_closeout_refund();

CREATE FUNCTION public.closeout_provider_trip(
  p_trip_id UUID, p_action TEXT, p_reason TEXT DEFAULT NULL, p_revised_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  trip public.trips%ROWTYPE;
  outcome_time TIMESTAMPTZ := clock_timestamp();
  cancellation_reason TEXT := btrim(COALESCE(p_reason, ''));
BEGIN
  SELECT * INTO trip FROM public.trips WHERE id = p_trip_id FOR NO KEY UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT (
    COALESCE(trip.provider_id = public.get_user_provider_id(auth.uid()::text), FALSE)
    OR COALESCE(public.is_admin_user(auth.uid()::text), FALSE)
  ) THEN
    RAISE EXCEPTION 'Trip is unavailable' USING ERRCODE = '42501';
  END IF;
  IF trip.status NOT IN ('upcoming', 'active', 'ongoing') OR trip.departure_date > outcome_time
    OR trip.departure_date IS NULL THEN
    RAISE EXCEPTION 'This trip is unavailable for closeout';
  END IF;

  IF p_action = 'departed' AND trip.status <> 'ongoing' THEN
    UPDATE public.trips SET status = 'ongoing' WHERE id = trip.id;
  ELSIF p_action = 'delay' THEN
    IF p_revised_end IS NULL OR NOT isfinite(p_revised_end)
      OR p_revised_end <= GREATEST(outcome_time, public.trip_expected_end(trip)) THEN
      RAISE EXCEPTION 'Choose a new end time later than the previous estimate and current time';
    END IF;
    UPDATE public.trips SET revised_end_at = p_revised_end WHERE id = trip.id;
    INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
    SELECT DISTINCT 'user', b.user_id, 'Trip schedule updated',
      'The provider recorded a delay. Open My Trips for the revised ending time.', 'booking',
      jsonb_build_object('trip_id', trip.id)
    FROM public.bookings b WHERE b.trip_id = trip.id AND b.status = 'confirmed'
      AND b.payment_status = 'paid' AND b.user_id IS NOT NULL;
  ELSIF p_action IN ('complete', 'did_not_run') THEN
    IF p_action = 'complete' AND public.trip_expected_end(trip) > outcome_time THEN
      RAISE EXCEPTION 'The scheduled end time has not passed';
    END IF;
    IF p_action = 'did_not_run' AND (length(cancellation_reason) = 0 OR length(cancellation_reason) > 500) THEN
      RAISE EXCEPTION 'Enter a cancellation reason of up to 500 characters';
    END IF;
    PERFORM 1 FROM public.bookings WHERE trip_id = trip.id AND status = 'confirmed' FOR UPDATE NOWAIT;
    IF p_action = 'complete' THEN
      UPDATE public.trips SET status = 'completed', closed_at = outcome_time, closeout_reason = 'completed' WHERE id = trip.id;
      UPDATE public.bookings SET status = 'completed'
      WHERE trip_id = trip.id AND status = 'confirmed' AND payment_status = 'paid';
    ELSE
      UPDATE public.trips SET status = 'cancelled', closed_at = outcome_time,
        closeout_reason = 'did_not_run' WHERE id = trip.id;
      INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
      SELECT DISTINCT 'user', b.user_id, 'Trip cancelled',
        cancellation_reason, 'booking', jsonb_build_object('trip_id', trip.id)
      FROM public.bookings b WHERE b.trip_id = trip.id AND b.status = 'confirmed' AND b.user_id IS NOT NULL;
      UPDATE public.bookings SET status = 'cancelled' WHERE trip_id = trip.id AND status = 'confirmed';
    END IF;
  ELSE
    RAISE EXCEPTION 'Choose a valid trip action';
  END IF;
EXCEPTION WHEN lock_not_available THEN
  RAISE EXCEPTION 'A booking is being updated. Try again.' USING ERRCODE = 'PT409';
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_expired_unpaid_bookings()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE expired_count INTEGER;
BEGIN
  WITH missed AS (
    UPDATE public.trips SET status = 'cancelled', closeout_reason = 'interest_goal_missed', closed_at = NOW()
    WHERE status = 'collecting_interest' AND departure_date <= NOW()
    RETURNING id
  )
  INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
  SELECT 'user', interest.user_id, 'Trip interest goal missed',
    'The trip did not reach its interest goal before departure and will not run.', 'booking',
    jsonb_build_object('trip_id', missed.id)
  FROM missed JOIN public.trip_interests interest ON interest.trip_id = missed.id;

  UPDATE public.bookings b SET status = 'cancelled', expired_at = NOW()
  WHERE b.status = 'confirmed' AND b.payment_status = 'pending'
    AND (b.payment_deadline <= NOW() OR EXISTS (
      SELECT 1 FROM public.trips t WHERE t.id = b.trip_id
        AND (t.departure_date <= NOW() OR t.status IN ('cancelled', 'completed', 'ongoing'))
    ))
    AND NOT EXISTS (
      SELECT 1 FROM public.payment_transactions p WHERE p.booking_id = b.id
      AND p.status IN ('pending', 'processing', 'success')
    );

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

CREATE FUNCTION public.sync_paid_booking_closeout()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE trip_status TEXT;
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status = 'pending' THEN
    SELECT status INTO trip_status FROM public.trips WHERE id = NEW.trip_id;
    IF OLD.status = 'cancelled' THEN
      NEW.status := 'cancelled';
    ELSIF trip_status = 'completed' THEN
      NEW.status := 'completed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_paid_booking_closeout BEFORE UPDATE OF payment_status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_paid_booking_closeout();

CREATE FUNCTION public.list_closeout_payment_checks(p_user_id UUID)
RETURNS TABLE(transaction_ref TEXT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.transaction_ref FROM public.payment_transactions p
  JOIN public.bookings b ON b.id = p.booking_id
  LEFT JOIN public.trips t ON t.id = b.trip_id
  WHERE b.user_id = p_user_id AND p.user_id = p_user_id AND b.payment_status = 'pending'
    AND p.payment_method = 'chapa' AND p.status IN ('pending', 'processing', 'success')
    AND (b.status = 'cancelled' OR b.payment_deadline <= NOW() OR t.departure_date <= NOW())
  ORDER BY p.created_at DESC LIMIT 10;
$$;

DROP POLICY IF EXISTS "Users can create reviews for own bookings" ON public.reviews;
CREATE POLICY "Users can create reviews for own bookings" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.bookings b WHERE b.id = booking_id
        AND b.user_id = auth.uid() AND b.status = 'completed' AND b.payment_status = 'paid'
        AND b.provider_id IS NOT DISTINCT FROM reviews.provider_id
        AND b.trip_id IS NOT DISTINCT FROM reviews.trip_id
    )
  );

CREATE POLICY "Admins can read closeout refunds" ON public.refunds FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()::text));

CREATE FUNCTION public.record_closeout_refund(p_refund_id UUID, p_reference TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE booking UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT COALESCE(public.is_admin_user(auth.uid()::text), FALSE) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(length(btrim(p_reference)), 0) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Enter the reference for the refund already sent';
  END IF;
  UPDATE public.refunds SET status = 'completed', processed_at = NOW(), provider_refund_ref = btrim(p_reference)
  WHERE id = p_refund_id AND status IN ('pending', 'approved', 'processing') AND reason LIKE 'Trip closeout:%'
  RETURNING booking_id INTO booking;
  IF NOT FOUND THEN RAISE EXCEPTION 'Refund is unavailable'; END IF;
  UPDATE public.bookings SET payment_status = 'refunded' WHERE id = booking AND payment_status = 'paid';
END;
$$;

REVOKE ALL ON FUNCTION public.trip_expected_end(public.trips), public.cap_booking_deadline_at_departure(),
  public.queue_closeout_refund(), public.sync_paid_booking_closeout()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.closeout_provider_trip(UUID, TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.closeout_provider_trip(UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
REVOKE ALL ON FUNCTION public.list_closeout_payment_checks(UUID), public.record_closeout_refund(UUID, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_closeout_payment_checks(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_closeout_refund(UUID, TEXT) TO authenticated;

COMMIT;
