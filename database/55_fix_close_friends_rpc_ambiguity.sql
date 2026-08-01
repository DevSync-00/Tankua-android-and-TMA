-- Fix PL/pgSQL ambiguity between the close_friends column and RETURNS TABLE field.
CREATE OR REPLACE FUNCTION public.add_close_friend_by_phone(requested_phone TEXT)
RETURNS TABLE(id UUID, friend_user_id UUID, name TEXT, phone TEXT, photo_url TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  target public.users;
  relationship public.close_friends;
BEGIN
  SELECT * INTO target
  FROM public.users
  WHERE regexp_replace(phone_number, '\s+', '', 'g') =
        regexp_replace(requested_phone, '\s+', '', 'g')
  LIMIT 1;

  IF target.id IS NULL THEN
    RAISE EXCEPTION 'No Tankua account was found with that phone number';
  END IF;
  IF target.id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot add yourself';
  END IF;

  INSERT INTO public.close_friends AS cf (user_id, friend_user_id)
  VALUES (auth.uid(), target.id)
  ON CONFLICT (user_id, friend_user_id)
  DO UPDATE SET friend_user_id = EXCLUDED.friend_user_id
  RETURNING cf.* INTO relationship;

  RETURN QUERY
  SELECT relationship.id, target.id, target.name, target.phone_number,
         COALESCE(target.profile_photo_url, target.telegram_photo_url, ''),
         relationship.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.add_close_friend_by_phone(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_close_friend_by_phone(TEXT) TO authenticated;
