-- Production profile data and unpaid-booking cleanup for the Telegram Mini App.
-- Apply after migrations 46-50.

CREATE EXTENSION IF NOT EXISTS pg_cron;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

ALTER TABLE public.rewards_points
  ADD COLUMN IF NOT EXISTS total_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_redeemed INTEGER NOT NULL DEFAULT 0;

UPDATE public.users
SET referral_code = 'TNK-' || upper(substr(replace(id::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique
  ON public.users (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_favorites (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, destination_id)
);

CREATE TABLE IF NOT EXISTS public.trip_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.close_friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  trips_together INTEGER NOT NULL DEFAULT 0 CHECK (trips_together >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, phone)
);

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  TRUE,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public user avatar access" ON storage.objects;
CREATE POLICY "Public user avatar access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_favorites, public.trip_suggestions, public.close_friends,
  public.user_notification_preferences FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_expired_unpaid_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Updating first invokes the existing seat-release trigger from migration 46.
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE payment_status = 'pending'
    AND payment_deadline IS NOT NULL
    AND payment_deadline <= NOW()
    AND status <> 'cancelled';

  DELETE FROM public.bookings
  WHERE payment_status = 'pending'
    AND payment_deadline IS NOT NULL
    AND payment_deadline <= NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_expired_unpaid_bookings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_unpaid_bookings() TO service_role;

DO $$
DECLARE
  existing_job BIGINT;
BEGIN
  SELECT jobid INTO existing_job
  FROM cron.job
  WHERE jobname = 'delete-expired-unpaid-bookings'
  LIMIT 1;

  IF existing_job IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job);
  END IF;

  PERFORM cron.schedule(
    'delete-expired-unpaid-bookings',
    '*/5 * * * *',
    'SELECT public.delete_expired_unpaid_bookings();'
  );
END;
$$;
