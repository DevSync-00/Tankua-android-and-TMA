-- Allow administrators to select the six Telegram Popular destinations.
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_destinations_is_popular
  ON public.destinations (is_popular)
  WHERE is_popular = TRUE;

CREATE OR REPLACE FUNCTION public.enforce_six_popular_destinations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_popular = TRUE
     AND COALESCE(OLD.is_popular, FALSE) = FALSE
     AND (SELECT COUNT(*) FROM public.destinations WHERE is_popular = TRUE) >= 6 THEN
    RAISE EXCEPTION 'Only six destinations can be marked as popular';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_six_popular_destinations ON public.destinations;
CREATE TRIGGER enforce_six_popular_destinations
  BEFORE INSERT OR UPDATE OF is_popular ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_six_popular_destinations();

COMMENT ON COLUMN public.destinations.is_popular IS
  'Controls membership in the Telegram mini app Popular destinations section (maximum six).';
