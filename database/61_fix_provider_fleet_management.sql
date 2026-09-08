-- Bring the legacy drivers table in line with the provider portal.
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS rating numeric NOT NULL DEFAULT 5.0;

ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS drivers_status_check;
UPDATE public.drivers SET status = 'available' WHERE status = 'active';
UPDATE public.drivers SET status = 'offline' WHERE status = 'inactive' OR status IS NULL;
ALTER TABLE public.drivers ALTER COLUMN status SET DEFAULT 'available';
ALTER TABLE public.drivers
  ADD CONSTRAINT drivers_status_check CHECK (status IN ('available', 'on_trip', 'offline'));

-- These legacy columns belong to an assigned vehicle, not a driver profile.
ALTER TABLE public.drivers ALTER COLUMN vehicle_type DROP NOT NULL;
ALTER TABLE public.drivers ALTER COLUMN plate_number DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_provider_id ON public.drivers(provider_id);

DROP POLICY IF EXISTS "Only admins can access drivers" ON public.drivers;
DROP POLICY IF EXISTS "Provider staff can view own drivers" ON public.drivers;
DROP POLICY IF EXISTS "Provider managers can manage drivers" ON public.drivers;

CREATE POLICY "Provider staff can view own drivers" ON public.drivers
  FOR SELECT USING (
    provider_id IN (SELECT provider_id FROM public.provider_users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Provider managers can manage drivers" ON public.drivers
  FOR ALL USING (
    provider_id IN (
      SELECT provider_id FROM public.provider_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  )
  WITH CHECK (
    provider_id IN (
      SELECT provider_id FROM public.provider_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );
