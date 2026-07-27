ALTER TABLE pickup_stations
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS extra_price NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_pickup_stations_provider_id ON pickup_stations(provider_id);

DROP POLICY IF EXISTS "Providers can create own pickup stations" ON pickup_stations;
CREATE POLICY "Providers can create own pickup stations"
  ON pickup_stations FOR INSERT TO authenticated
  WITH CHECK (
    provider_id = get_user_provider_id(auth.uid()::text)
    OR is_admin_user(auth.uid()::text)
  );

DROP POLICY IF EXISTS "Providers can update own pickup stations" ON pickup_stations;
CREATE POLICY "Providers can update own pickup stations"
  ON pickup_stations FOR UPDATE TO authenticated
  USING (
    provider_id = get_user_provider_id(auth.uid()::text)
    OR is_admin_user(auth.uid()::text)
  )
  WITH CHECK (
    provider_id = get_user_provider_id(auth.uid()::text)
    OR is_admin_user(auth.uid()::text)
  );

DROP POLICY IF EXISTS "Providers can delete own pickup stations" ON pickup_stations;
CREATE POLICY "Providers can delete own pickup stations"
  ON pickup_stations FOR DELETE TO authenticated
  USING (
    provider_id = get_user_provider_id(auth.uid()::text)
    OR is_admin_user(auth.uid()::text)
  );

DROP POLICY IF EXISTS "Providers can link stations to own trips" ON trip_pickup_stations;
DROP POLICY IF EXISTS "Providers can create trip pickup station links" ON trip_pickup_stations;
CREATE POLICY "Providers can link stations to own trips"
  ON trip_pickup_stations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_pickup_stations.trip_id
        AND (
          trips.provider_id = get_user_provider_id(auth.uid()::text)
          OR is_admin_user(auth.uid()::text)
        )
    )
    AND EXISTS (
      SELECT 1 FROM pickup_stations
      WHERE pickup_stations.id = trip_pickup_stations.station_id
        AND (
          pickup_stations.provider_id = (
            SELECT trips.provider_id FROM trips
            WHERE trips.id = trip_pickup_stations.trip_id
          )
          OR is_admin_user(auth.uid()::text)
        )
    )
  );

DROP POLICY IF EXISTS "Providers can update own trip stations" ON trip_pickup_stations;
DROP POLICY IF EXISTS "Providers can update own trip pickup station links" ON trip_pickup_stations;
CREATE POLICY "Providers can update own trip stations"
  ON trip_pickup_stations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_pickup_stations.trip_id
        AND (
          trips.provider_id = get_user_provider_id(auth.uid()::text)
          OR is_admin_user(auth.uid()::text)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      JOIN pickup_stations
        ON pickup_stations.id = trip_pickup_stations.station_id
      WHERE trips.id = trip_pickup_stations.trip_id
        AND pickup_stations.provider_id = trips.provider_id
        AND (
          trips.provider_id = get_user_provider_id(auth.uid()::text)
          OR is_admin_user(auth.uid()::text)
        )
    )
  );

DROP POLICY IF EXISTS "Providers can delete own trip stations" ON trip_pickup_stations;
DROP POLICY IF EXISTS "Providers can delete own trip pickup station links" ON trip_pickup_stations;
CREATE POLICY "Providers can delete own trip stations"
  ON trip_pickup_stations FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_pickup_stations.trip_id
        AND (
          trips.provider_id = get_user_provider_id(auth.uid()::text)
          OR is_admin_user(auth.uid()::text)
        )
    )
  );
