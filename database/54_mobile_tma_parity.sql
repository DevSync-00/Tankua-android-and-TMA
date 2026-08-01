-- Authenticated mobile access to the same profile data used by the TMA service.
BEGIN;

CREATE TABLE IF NOT EXISTS public.close_friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_user_id),
  CHECK (user_id <> friend_user_id)
);

-- Upgrade the legacy schema used by early mobile builds. Renaming preserves
-- existing friendships and their unique/foreign-key constraints while aligning
-- the column with the production TMA contract.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='close_friends' AND column_name='friend_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='close_friends' AND column_name='friend_user_id'
  ) THEN
    ALTER TABLE public.close_friends RENAME COLUMN friend_id TO friend_user_id;
  END IF;
END $$;

ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;
GRANT SELECT, INSERT ON public.trip_suggestions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_notification_preferences TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.close_friends TO authenticated;

DROP POLICY IF EXISTS "Users manage own favorites" ON public.user_favorites;
CREATE POLICY "Users manage own favorites" ON public.user_favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own suggestions" ON public.trip_suggestions;
CREATE POLICY "Users read own suggestions" ON public.trip_suggestions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users create own suggestions" ON public.trip_suggestions;
CREATE POLICY "Users create own suggestions" ON public.trip_suggestions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users manage notification preferences" ON public.user_notification_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage close friends" ON public.close_friends;
CREATE POLICY "Users manage close friends" ON public.close_friends
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_my_close_friends()
RETURNS TABLE(id UUID, friend_user_id UUID, name TEXT, phone TEXT, photo_url TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT cf.id, u.id, u.name, u.phone_number,
         COALESCE(u.profile_photo_url, u.telegram_photo_url, ''), cf.created_at
  FROM public.close_friends cf JOIN public.users u ON u.id = cf.friend_user_id
  WHERE cf.user_id = auth.uid() ORDER BY cf.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.add_close_friend_by_phone(requested_phone TEXT)
RETURNS TABLE(id UUID, friend_user_id UUID, name TEXT, phone TEXT, photo_url TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
#variable_conflict use_column
DECLARE target public.users; relationship public.close_friends;
BEGIN
  SELECT * INTO target FROM public.users
  WHERE regexp_replace(phone_number, '\\s+', '', 'g') = regexp_replace(requested_phone, '\\s+', '', 'g') LIMIT 1;
  IF target.id IS NULL THEN RAISE EXCEPTION 'No Tankua account was found with that phone number'; END IF;
  IF target.id = auth.uid() THEN RAISE EXCEPTION 'You cannot add yourself'; END IF;
  INSERT INTO public.close_friends(user_id,friend_user_id) VALUES(auth.uid(),target.id)
  ON CONFLICT(user_id,friend_user_id) DO UPDATE SET friend_user_id=EXCLUDED.friend_user_id
  RETURNING * INTO relationship;
  RETURN QUERY SELECT relationship.id,target.id,target.name,target.phone_number,
    COALESCE(target.profile_photo_url,target.telegram_photo_url,''),relationship.created_at;
END $$;

GRANT EXECUTE ON FUNCTION public.get_my_close_friends() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_close_friend_by_phone(TEXT) TO authenticated;

COMMIT;
