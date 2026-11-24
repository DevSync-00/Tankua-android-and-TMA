BEGIN;

-- Trip handover: an admin moves a trip that Tankua organized (with its
-- bookings, reviews and pickup points) to a provider's account.
--
-- Money: payments all land in Tankua's Chapa account and providers are paid
-- through payouts. When Tankua keeps the revenue it already collected (for
-- example because the provider was paid a vehicle rental), those bookings are
-- flagged platform_retained_revenue and excluded from the provider's
-- earnings. They still count as the provider's bookings and track record.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS platform_retained_revenue BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.bookings.platform_retained_revenue IS
  'Revenue kept by Tankua at a trip handover. Excluded from provider earnings and payouts.';

CREATE TABLE public.trip_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  to_provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  handed_over_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  revenue_policy TEXT NOT NULL CHECK (revenue_policy IN ('platform_retains', 'provider_receives')),
  bookings_moved INTEGER NOT NULL,
  paid_bookings INTEGER NOT NULL,
  paid_totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  stations_copied INTEGER NOT NULL,
  note TEXT CHECK (note IS NULL OR length(note) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX trip_handovers_trip_idx ON public.trip_handovers (trip_id);
CREATE INDEX trip_handovers_to_provider_idx ON public.trip_handovers (to_provider_id);

ALTER TABLE public.trip_handovers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_handovers FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.trip_handovers TO authenticated;

CREATE POLICY "Admins can view trip handovers"
  ON public.trip_handovers FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()::text));

CREATE POLICY "Providers can view handovers to them"
  ON public.trip_handovers FOR SELECT TO authenticated
  USING (to_provider_id = public.get_user_provider_id(auth.uid()::text));

-- Only active admins with an operations role may move trips between providers.
CREATE FUNCTION public.can_hand_over_trips()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users AS admin
    WHERE admin.id = auth.uid()
      AND COALESCE(admin.is_active, TRUE)
      AND admin.role IN ('super_admin', 'admin')
  );
$$;

-- What a handover would move. Read-only; shown in the admin confirmation dialog.
CREATE FUNCTION public.admin_trip_handover_preview(p_trip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.can_hand_over_trips() THEN
    RAISE EXCEPTION 'Only admins can hand over trips.' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'trip_id', trip.id,
    'status', trip.status,
    'departure_date', trip.departure_date,
    'provider_id', trip.provider_id,
    'provider_name', provider.name,
    'bookings', (SELECT count(*) FROM public.bookings AS b WHERE b.trip_id = trip.id),
    'paid_bookings', (
      SELECT count(*) FROM public.bookings AS b
      WHERE b.trip_id = trip.id AND b.payment_status = 'paid'
    ),
    'paid_totals', COALESCE((
      SELECT jsonb_object_agg(totals.currency, totals.amount)
      FROM (
        SELECT COALESCE(b.currency, 'ETB') AS currency, sum(b.total_price) AS amount
        FROM public.bookings AS b
        WHERE b.trip_id = trip.id AND b.payment_status = 'paid'
        GROUP BY 1
      ) AS totals
    ), '{}'::jsonb),
    'payments_in_progress', (
      SELECT count(*) FROM public.payment_transactions AS p
      JOIN public.bookings AS b ON b.id = p.booking_id
      WHERE b.trip_id = trip.id AND p.status IN ('pending', 'processing')
    ),
    'pickup_points', (SELECT count(*) FROM public.trip_pickup_stations AS l WHERE l.trip_id = trip.id),
    'reviews', (
      SELECT count(*) FROM public.reviews AS r
      WHERE r.trip_id = trip.id
         OR r.booking_id IN (SELECT b.id FROM public.bookings AS b WHERE b.trip_id = trip.id)
    ),
    'previous_handovers', (SELECT count(*) FROM public.trip_handovers AS h WHERE h.trip_id = trip.id)
  )
  INTO result
  FROM public.trips AS trip
  LEFT JOIN public.providers AS provider ON provider.id = trip.provider_id
  WHERE trip.id = p_trip_id;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Trip not found.' USING ERRCODE = 'P0002';
  END IF;
  RETURN result;
END;
$$;

-- Moves the trip, its bookings, reviews and pickup points to another provider
-- in one transaction. search_path includes public because existing triggers on
-- reviews and bookings (provider rating, rewards) use unqualified table names.
CREATE FUNCTION public.admin_hand_over_trip(
  p_trip_id UUID,
  p_to_provider_id UUID,
  p_revenue_policy TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  trip public.trips%ROWTYPE;
  target public.providers%ROWTYPE;
  link RECORD;
  new_station_id UUID;
  stations_copied INTEGER := 0;
  bookings_moved INTEGER;
  paid_count INTEGER;
  paid_totals JSONB;
  owner_id UUID;
  clean_note TEXT := NULLIF(btrim(p_note), '');
BEGIN
  IF NOT public.can_hand_over_trips() THEN
    RAISE EXCEPTION 'Only admins can hand over trips.' USING ERRCODE = '42501';
  END IF;

  IF p_revenue_policy IS NULL OR p_revenue_policy NOT IN ('platform_retains', 'provider_receives') THEN
    RAISE EXCEPTION 'Choose who keeps the revenue already collected.' USING ERRCODE = '22023';
  END IF;

  IF length(clean_note) > 1000 THEN
    RAISE EXCEPTION 'Keep the note under 1,000 characters.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip not found.' USING ERRCODE = 'P0002';
  END IF;
  IF trip.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled trips cannot be handed over.' USING ERRCODE = 'PT409';
  END IF;
  IF trip.provider_id IS NOT DISTINCT FROM p_to_provider_id THEN
    RAISE EXCEPTION 'This trip already belongs to that provider.' USING ERRCODE = 'PT409';
  END IF;

  SELECT * INTO target FROM public.providers WHERE id = p_to_provider_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider not found.' USING ERRCODE = 'P0002';
  END IF;
  IF target.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Activate % before handing a trip to them.', target.name USING ERRCODE = 'PT409';
  END IF;

  -- Lock the trip's bookings so no payment or edit interleaves with the move.
  PERFORM 1 FROM public.bookings WHERE trip_id = trip.id FOR UPDATE;

  -- Pickup points belong to a provider. Give the new provider its own copy of
  -- each one (or reuse an identical one it already has), then repoint the trip
  -- and the bookings' pickup snapshots at it.
  FOR link IN
    SELECT l.id AS link_id, s.*
    FROM public.trip_pickup_stations AS l
    JOIN public.pickup_stations AS s ON s.id = l.station_id
    WHERE l.trip_id = trip.id AND s.provider_id IS DISTINCT FROM target.id
  LOOP
    SELECT s.id INTO new_station_id
    FROM public.pickup_stations AS s
    WHERE s.provider_id = target.id
      AND lower(btrim(s.name)) = lower(btrim(link.name))
      AND s.city IS NOT DISTINCT FROM link.city
      AND s.lat = link.lat AND s.lng = link.lng
      AND s.is_address_pickup = link.is_address_pickup
      AND s.is_active
    LIMIT 1;

    IF new_station_id IS NULL THEN
      new_station_id := gen_random_uuid();
      INSERT INTO public.pickup_stations
      SELECT * FROM jsonb_populate_record(
        NULL::public.pickup_stations,
        (SELECT to_jsonb(s) FROM public.pickup_stations AS s WHERE s.id = link.id)
          || jsonb_build_object('id', new_station_id, 'provider_id', target.id, 'created_at', now())
      );
      stations_copied := stations_copied + 1;
    END IF;

    UPDATE public.trip_pickup_stations SET station_id = new_station_id WHERE id = link.link_id;

    UPDATE public.bookings
    SET pickup_station = jsonb_set(pickup_station, '{id}', to_jsonb(new_station_id::text))
    WHERE trip_id = trip.id AND pickup_station->>'id' = link.id::text;
  END LOOP;

  SELECT count(*) INTO paid_count
  FROM public.bookings AS b
  WHERE b.trip_id = trip.id AND b.payment_status = 'paid';

  SELECT COALESCE(jsonb_object_agg(totals.currency, totals.amount), '{}'::jsonb) INTO paid_totals
  FROM (
    SELECT COALESCE(b.currency, 'ETB') AS currency, sum(b.total_price) AS amount
    FROM public.bookings AS b
    WHERE b.trip_id = trip.id AND b.payment_status = 'paid'
    GROUP BY 1
  ) AS totals;

  UPDATE public.bookings
  SET provider_id = target.id,
      platform_retained_revenue = platform_retained_revenue
        OR (p_revenue_policy = 'platform_retains' AND payment_status = 'paid')
  WHERE trip_id = trip.id;
  GET DIAGNOSTICS bookings_moved = ROW_COUNT;

  UPDATE public.reviews
  SET provider_id = target.id
  WHERE trip_id = trip.id
     OR booking_id IN (SELECT b.id FROM public.bookings AS b WHERE b.trip_id = trip.id);

  UPDATE public.trips SET provider_id = target.id WHERE id = trip.id;

  -- The review trigger only refreshes the new provider's rating.
  IF trip.provider_id IS NOT NULL THEN
    UPDATE public.providers
    SET rating = (
      SELECT COALESCE(avg(r.rating), 0) FROM public.reviews AS r
      WHERE r.provider_id = trip.provider_id AND r.is_visible = TRUE
    )
    WHERE id = trip.provider_id;
  END IF;

  INSERT INTO public.trip_handovers (
    trip_id, from_provider_id, to_provider_id, handed_over_by, revenue_policy,
    bookings_moved, paid_bookings, paid_totals, stations_copied, note
  ) VALUES (
    trip.id, trip.provider_id, target.id, auth.uid(), p_revenue_policy,
    bookings_moved, paid_count, paid_totals, stations_copied, clean_note
  );

  SELECT staff.id INTO owner_id
  FROM public.provider_users AS staff
  WHERE staff.provider_id = target.id AND staff.role = 'owner' AND staff.is_active = TRUE
  LIMIT 1;

  IF owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_type, recipient_id, title, message, type, data, action_url)
    VALUES (
      'provider', owner_id,
      'A trip was handed over to you',
      format('Tankua moved a trip with %s booking(s) to your account.', bookings_moved),
      'system',
      jsonb_build_object('trip_id', trip.id, 'bookings', bookings_moved, 'revenue_policy', p_revenue_policy),
      format('/dashboard/bookings?trip=%s', trip.id)
    );
  END IF;

  RETURN jsonb_build_object(
    'trip_id', trip.id,
    'to_provider_id', target.id,
    'to_provider_name', target.name,
    'bookings_moved', bookings_moved,
    'paid_bookings', paid_count,
    'paid_totals', paid_totals,
    'stations_copied', stations_copied,
    'revenue_policy', p_revenue_policy
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_hand_over_trips() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_trip_handover_preview(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hand_over_trip(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_hand_over_trips() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_trip_handover_preview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hand_over_trip(UUID, UUID, TEXT, TEXT) TO authenticated;

COMMIT;
