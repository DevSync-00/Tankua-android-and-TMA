BEGIN;

-- ============================================================================
-- Recognize admins the same way the admin portal does.
--
-- The portal looks admins up by email (admin-guard.tsx), but admin checks in
-- the database compared admin_users.id with the login user id. For admin rows
-- whose id is not the login id, every admin-only function returned 403
-- (featuring trips, trip handover, recording refunds, admin read policies).
--
-- An admin now matches by id OR by the login's confirmed email. Requiring a
-- confirmed email keeps someone from claiming an admin email they don't own.
-- ============================================================================

-- The admin_users row for whoever is signed in, or NULL.
CREATE FUNCTION public.current_admin_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT admin.id
  FROM public.admin_users AS admin
  WHERE COALESCE(admin.is_active, TRUE)
    AND (
      admin.id = auth.uid()
      OR lower(admin.email) = (
        SELECT lower(u.email) FROM auth.users AS u
        WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
      )
    )
  ORDER BY (admin.id = auth.uid()) DESC
  LIMIT 1;
$$;

-- Shared by RLS policies and admin functions across the schema.
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users AS admin
    WHERE admin.id::text = user_id
       OR lower(admin.email) = (
         SELECT lower(u.email) FROM auth.users AS u
         WHERE u.id::text = user_id AND u.email_confirmed_at IS NOT NULL
       )
  );
$$;

-- Operations tools (handover, featuring) need an active admin or super admin.
CREATE OR REPLACE FUNCTION public.can_hand_over_trips()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users AS admin
    WHERE admin.id = public.current_admin_id()
      AND admin.role IN ('super_admin', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_set_featured_trips(p_trip_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ids UUID[] := COALESCE(p_trip_ids, '{}');
  bad UUID;
BEGIN
  IF NOT public.can_hand_over_trips() THEN
    RAISE EXCEPTION 'Only Tankua admins (admin or super admin role) can feature trips' USING ERRCODE = '42501';
  END IF;
  IF cardinality(ids) > 12 THEN
    RAISE EXCEPTION 'Feature at most 12 trips' USING ERRCODE = '22023';
  END IF;
  IF cardinality(ids) <> (SELECT count(DISTINCT candidate.trip_id) FROM unnest(ids) AS candidate(trip_id)) THEN
    RAISE EXCEPTION 'A trip is listed twice' USING ERRCODE = '22023';
  END IF;

  SELECT candidate.trip_id INTO bad FROM unnest(ids) AS candidate(trip_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.trips AS t
    WHERE t.id = candidate.trip_id
      AND t.status IN ('upcoming', 'active', 'collecting_interest') AND t.departure_date > NOW()
  )
  LIMIT 1;
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'Only upcoming, open trips can be featured' USING ERRCODE = '22023';
  END IF;

  UPDATE public.trips SET featured_rank = NULL WHERE featured_rank IS NOT NULL;
  UPDATE public.trips AS t SET featured_rank = list.position
  FROM unnest(ids) WITH ORDINALITY AS list(trip_id, position)
  WHERE t.id = list.trip_id;

  RETURN jsonb_build_object('featured', to_jsonb(ids));
END;
$$;

REVOKE ALL ON FUNCTION public.current_admin_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_admin_id() TO authenticated;

-- Trip handover: record the admin's own id (admin_users.id), not the login id.
CREATE OR REPLACE FUNCTION public.admin_hand_over_trip(
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
    trip.id, trip.provider_id, target.id, public.current_admin_id(), p_revenue_policy,
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

COMMIT;
