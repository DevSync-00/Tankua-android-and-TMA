BEGIN;

CREATE OR REPLACE FUNCTION public.create_provider_trip(p_trip JSONB, p_pickup_stations JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  trip_request public.trips%ROWTYPE;
  created_trip_id UUID;
  linked_station_count INTEGER;
BEGIN
  SELECT * INTO trip_request FROM jsonb_populate_record(NULL::public.trips, p_trip);

  IF trip_request.provider_id IS NULL OR trip_request.destination_id IS NULL OR trip_request.trip_type IS NULL THEN
    RAISE EXCEPTION 'Choose a provider, destination, and trip type.';
  END IF;

  IF trip_request.departure_date IS NULL OR trip_request.departure_date <= clock_timestamp()
    OR NOT isfinite(trip_request.departure_date) THEN
    RAISE EXCEPTION 'Choose a future departure date and time.';
  END IF;

  IF trip_request.trip_type = 'one_way' THEN
    trip_request.return_date := NULL;
  END IF;

  IF (trip_request.trip_type = 'round_trip' AND trip_request.return_date IS NULL)
    OR (trip_request.return_date IS NOT NULL AND (
      trip_request.return_date <= trip_request.departure_date OR NOT isfinite(trip_request.return_date)
    )) THEN
    RAISE EXCEPTION 'Choose a return date and time after departure.';
  END IF;

  IF trip_request.price IS NULL OR trip_request.price <= 0 OR trip_request.price >= 'Infinity'::NUMERIC THEN
    RAISE EXCEPTION 'Enter a price greater than zero.';
  END IF;

  IF trip_request.max_seats IS NULL OR trip_request.max_seats NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Enter a whole seat count between 1 and 100.';
  END IF;

  trip_request.summary := btrim(trip_request.summary);
  IF trip_request.summary IS NULL OR char_length(trip_request.summary) NOT BETWEEN 1 AND 280 THEN
    RAISE EXCEPTION 'Write a trip summary of 1 to 280 characters.';
  END IF;

  IF jsonb_typeof(p_pickup_stations) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Select at least one pickup station.';
  END IF;
  IF jsonb_array_length(p_pickup_stations) = 0 THEN
    RAISE EXCEPTION 'Select at least one pickup station.';
  END IF;

  INSERT INTO public.trips (
    provider_id, destination_id, trip_type, date, departure_date, return_date,
    price, max_seats, available_seats, status, minimum_interest, tour_category,
    summary, itinerary, duration_minutes, transportation_type, difficulty_level,
    inclusions, exclusions, meeting_instructions, what_to_bring, cancellation_policy
  ) VALUES (
    trip_request.provider_id, trip_request.destination_id, trip_request.trip_type,
    (trip_request.departure_date AT TIME ZONE 'Africa/Addis_Ababa')::DATE,
    trip_request.departure_date, trip_request.return_date,
    trip_request.price, trip_request.max_seats, trip_request.max_seats,
    CASE WHEN trip_request.minimum_interest IS NULL THEN 'upcoming' ELSE 'collecting_interest' END,
    trip_request.minimum_interest, trip_request.tour_category,
    trip_request.summary, trip_request.itinerary, trip_request.duration_minutes,
    trip_request.transportation_type, trip_request.difficulty_level,
    COALESCE(trip_request.inclusions, '{}'), COALESCE(trip_request.exclusions, '{}'),
    trip_request.meeting_instructions, trip_request.what_to_bring, trip_request.cancellation_policy
  ) RETURNING id INTO created_trip_id;

  INSERT INTO public.trip_pickup_stations (trip_id, station_id, pickup_time, extra_price)
  SELECT created_trip_id, station.id, pickup.pickup_time, pickup.extra_price
  FROM jsonb_to_recordset(p_pickup_stations) AS pickup(station_id UUID, pickup_time TEXT, extra_price NUMERIC)
  JOIN public.pickup_stations AS station ON station.id = pickup.station_id
  WHERE station.provider_id = trip_request.provider_id AND station.is_active
    AND pickup.pickup_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND pickup.extra_price >= 0 AND pickup.extra_price < 'Infinity'::NUMERIC;

  GET DIAGNOSTICS linked_station_count = ROW_COUNT;
  IF linked_station_count <> jsonb_array_length(p_pickup_stations) THEN
    RAISE EXCEPTION 'Use active pickup stations from your provider and check their times and extra prices.';
  END IF;

  RETURN created_trip_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_provider_trip(JSONB, JSONB) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_provider_trip(JSONB, JSONB) TO authenticated;

COMMIT;
