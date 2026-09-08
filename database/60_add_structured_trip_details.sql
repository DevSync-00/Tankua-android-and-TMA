-- Structured information entered by providers and shown to travelers before booking.
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS transportation_type text,
  ADD COLUMN IF NOT EXISTS difficulty_level text,
  ADD COLUMN IF NOT EXISTS inclusions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclusions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meeting_instructions text,
  ADD COLUMN IF NOT EXISTS what_to_bring text,
  ADD COLUMN IF NOT EXISTS cancellation_policy text;

ALTER TABLE public.trips
  DROP CONSTRAINT IF EXISTS trips_duration_minutes_check,
  ADD CONSTRAINT trips_duration_minutes_check
    CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  DROP CONSTRAINT IF EXISTS trips_difficulty_level_check,
  ADD CONSTRAINT trips_difficulty_level_check
    CHECK (difficulty_level IS NULL OR difficulty_level IN ('easy', 'moderate', 'challenging'));

COMMENT ON COLUMN public.trips.inclusions IS 'One traveler-facing inclusion per array item.';
COMMENT ON COLUMN public.trips.exclusions IS 'One traveler-facing exclusion per array item.';
