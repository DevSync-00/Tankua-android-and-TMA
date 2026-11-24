BEGIN;

-- ============================================================================
-- Travelers cancel paid bookings.
--
-- Policy (unchanged from the app): 48h or more before departure -> 100%
-- refund, 24-48h -> 50%, under 24h -> no refund. The refund is computed here,
-- not in the app. Cancelling frees the seats at once and queues the refund
-- for admin review, using the same "record refund sent" flow as closeouts.
-- ============================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT
    CHECK (cancellation_reason IS NULL OR length(cancellation_reason) <= 300);

-- What cancelling this booking right now would mean. Shared by the quote and
-- the cancellation so the traveler sees exactly what they will get.
CREATE FUNCTION public.booking_cancellation_terms(p_booking_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  booking public.bookings%ROWTYPE;
  trip public.trips%ROWTYPE;
  hours_left NUMERIC;
  percent INTEGER;
  amount NUMERIC;
  reason TEXT;
BEGIN
  SELECT * INTO booking FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR p_user_id IS NULL OR booking.user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO trip FROM public.trips WHERE id = booking.trip_id;

  IF booking.status <> 'confirmed' THEN
    reason := 'This booking is no longer active.';
  ELSIF booking.payment_status = 'pending' THEN
    reason := NULL; -- unpaid: release instead, nothing to refund
  ELSIF booking.payment_status <> 'paid' THEN
    reason := 'This booking cannot be cancelled here. Contact support.';
  ELSIF trip.id IS NULL OR trip.departure_date IS NULL OR trip.departure_date <= clock_timestamp() THEN
    reason := 'This trip has already departed.';
  ELSIF trip.status NOT IN ('upcoming', 'active') THEN
    reason := 'This trip can no longer be cancelled in the app. Contact support.';
  END IF;

  hours_left := EXTRACT(EPOCH FROM (trip.departure_date - clock_timestamp())) / 3600;
  percent := CASE
    WHEN booking.payment_status <> 'paid' THEN 0
    WHEN hours_left >= 48 THEN 100
    WHEN hours_left >= 24 THEN 50
    ELSE 0
  END;
  amount := booking.total_price * percent / 100;
  amount := CASE WHEN booking.currency = 'USD' THEN round(amount, 2) ELSE round(amount) END;

  RETURN jsonb_build_object(
    'booking_id', booking.id,
    'can_cancel', reason IS NULL,
    'reason', reason,
    'paid', booking.payment_status = 'paid',
    'amount_paid', CASE WHEN booking.payment_status = 'paid' THEN booking.total_price ELSE 0 END,
    'refund_percentage', percent,
    'refund_amount', amount,
    'currency', COALESCE(booking.currency, 'ETB'),
    'hours_until_departure', round(hours_left, 1),
    'seats', booking.seats
  );
END;
$$;

CREATE FUNCTION public.booking_cancellation_quote(p_booking_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.booking_cancellation_terms(p_booking_id, auth.uid());
$$;

CREATE FUNCTION public.cancel_paid_booking_for_user(p_booking_id UUID, p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  booking public.bookings%ROWTYPE;
  terms JSONB;
  clean_reason TEXT := NULLIF(btrim(p_reason), '');
  refund_amount NUMERIC;
  refund_id UUID;
  transaction_id UUID;
  place TEXT;
BEGIN
  IF length(clean_reason) > 300 THEN
    RAISE EXCEPTION 'Keep the reason under 300 characters' USING ERRCODE = '22023';
  END IF;

  -- Lock first, then compute terms on the locked row.
  SELECT * INTO booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  terms := public.booking_cancellation_terms(p_booking_id, p_user_id);
  IF NOT (terms->>'can_cancel')::BOOLEAN THEN
    RAISE EXCEPTION '%', terms->>'reason' USING ERRCODE = 'PT409';
  END IF;
  IF NOT (terms->>'paid')::BOOLEAN THEN
    RAISE EXCEPTION 'This booking is not paid. Release the reservation instead.' USING ERRCODE = 'PT409';
  END IF;

  refund_amount := (terms->>'refund_amount')::NUMERIC;

  UPDATE public.bookings
  SET status = 'cancelled', cancelled_at = clock_timestamp(), cancellation_reason = clean_reason
  WHERE id = booking.id;

  IF refund_amount > 0 THEN
    SELECT p.id INTO transaction_id FROM public.payment_transactions AS p
    WHERE p.booking_id = booking.id AND p.status = 'success'
    ORDER BY p.completed_at DESC NULLS LAST, p.created_at DESC
    LIMIT 1;

    INSERT INTO public.refunds (payment_transaction_id, booking_id, user_id, amount, currency, reason, status)
    VALUES (
      transaction_id, booking.id, booking.user_id, refund_amount, terms->>'currency',
      format('Traveler cancellation: %s%% refund, %s hours before departure%s',
        terms->>'refund_percentage', terms->>'hours_until_departure',
        CASE WHEN clean_reason IS NULL THEN '' ELSE ' — ' || clean_reason END),
      'pending'
    )
    RETURNING id INTO refund_id;
  END IF;

  place := COALESCE(booking.destination_name, 'your trip');
  INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
  VALUES (
    'user', booking.user_id,
    format('Booking cancelled: %s', place),
    CASE WHEN refund_amount > 0
      THEN format('Your booking for %s is cancelled. A refund of %s %s is being processed and we will message you when it is sent.',
        place, to_char(refund_amount, 'FM999,999,990.##'), terms->>'currency')
      ELSE format('Your booking for %s is cancelled. It was within 24 hours of departure, so no refund applies.', place)
    END,
    'payment',
    jsonb_build_object('booking_id', booking.id, 'trip_id', booking.trip_id, 'event', 'traveler_cancelled',
      'refund_amount', refund_amount, 'refund_id', refund_id)
  );

  RETURN terms || jsonb_build_object('status', 'cancelled', 'refund_id', refund_id);
END;
$$;

CREATE FUNCTION public.cancel_paid_booking(p_booking_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.cancel_paid_booking_for_user(p_booking_id, auth.uid(), p_reason);
$$;

REVOKE ALL ON FUNCTION public.booking_cancellation_terms(UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.booking_cancellation_quote(UUID) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.cancel_paid_booking_for_user(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.cancel_paid_booking(UUID, TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.booking_cancellation_quote(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_paid_booking(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.booking_cancellation_terms(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_paid_booking_for_user(UUID, UUID, TEXT) TO service_role;

-- ----------------------------------------------------------------------------
-- Admins record traveler-cancellation refunds the same way as closeout
-- refunds, and the traveler is told when the money is sent.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_closeout_refund(p_refund_id UUID, p_reference TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  refund public.refunds%ROWTYPE;
  booking public.bookings%ROWTYPE;
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
    AND (reason LIKE 'Trip closeout:%' OR reason LIKE 'Traveler cancellation:%')
  RETURNING * INTO refund;
  IF NOT FOUND THEN RAISE EXCEPTION 'Refund is unavailable'; END IF;

  UPDATE public.bookings SET payment_status = 'refunded'
  WHERE id = refund.booking_id AND payment_status = 'paid'
  RETURNING * INTO booking;

  IF refund.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data)
    VALUES (
      'user', refund.user_id,
      'Refund sent',
      format('We sent your refund of %s %s for %s. Reference: %s.',
        to_char(refund.amount, 'FM999,999,990.##'), COALESCE(refund.currency, 'ETB'),
        COALESCE(booking.destination_name, 'your cancelled trip'), btrim(p_reference)),
      'payment',
      jsonb_build_object('booking_id', refund.booking_id, 'refund_id', refund.id, 'event', 'refund_sent')
    );
  END IF;
END;
$$;

COMMIT;
