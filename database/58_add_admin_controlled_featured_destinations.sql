-- Allow administrators to choose which destinations appear in the Telegram mini app.
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_destinations_is_featured
  ON public.destinations (is_featured)
  WHERE is_featured = TRUE;

COMMENT ON COLUMN public.destinations.is_featured IS
  'Controls whether the destination appears in the Telegram mini app Featured section.';
