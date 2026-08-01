-- One Telegram numeric ID maps to one Supabase Auth UUID on every client.
-- Called only by the telegram-auth Edge Function with the service-role key.

CREATE OR REPLACE FUNCTION public.link_telegram_auth_user(
  p_auth_user_id UUID,
  p_telegram_id BIGINT,
  p_name TEXT,
  p_username TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_language_code TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_id UUID;
  result public.users%ROWTYPE;
BEGIN
  IF p_auth_user_id IS NULL OR p_telegram_id IS NULL THEN
    RAISE EXCEPTION 'Auth user and Telegram ID are required';
  END IF;
  PERFORM pg_advisory_xact_lock(p_telegram_id);
  SELECT id INTO old_id FROM public.users WHERE telegram_id = p_telegram_id LIMIT 1 FOR UPDATE;

  IF old_id IS NOT NULL AND old_id <> p_auth_user_id THEN
    -- Free the unique Telegram phone placeholder before inserting the Auth row.
    UPDATE public.users SET phone_number = 'legacy-telegram:' || old_id WHERE id = old_id;
    -- Merge rows that have natural per-user uniqueness before moving ordinary FKs.
    INSERT INTO public.user_favorites(user_id, destination_id, created_at)
      SELECT p_auth_user_id, destination_id, created_at FROM public.user_favorites WHERE user_id = old_id
      ON CONFLICT (user_id, destination_id) DO NOTHING;
    DELETE FROM public.user_favorites WHERE user_id = old_id;

    INSERT INTO public.user_notification_preferences(user_id, push_enabled, sms_enabled, updated_at)
      SELECT p_auth_user_id, push_enabled, sms_enabled, updated_at FROM public.user_notification_preferences WHERE user_id = old_id
      ON CONFLICT (user_id) DO UPDATE SET
        push_enabled = EXCLUDED.push_enabled, sms_enabled = EXCLUDED.sms_enabled,
        updated_at = GREATEST(public.user_notification_preferences.updated_at, EXCLUDED.updated_at);
    DELETE FROM public.user_notification_preferences WHERE user_id = old_id;

    INSERT INTO public.rewards_points(user_id, current_points)
      SELECT p_auth_user_id, current_points FROM public.rewards_points WHERE user_id = old_id
      ON CONFLICT (user_id) DO UPDATE SET current_points = public.rewards_points.current_points + EXCLUDED.current_points;
    DELETE FROM public.rewards_points WHERE user_id = old_id;

    -- Friend relationships can collide or become self-links during a merge.
    DELETE FROM public.close_friends
      WHERE (user_id = old_id AND friend_user_id = p_auth_user_id)
         OR (user_id = p_auth_user_id AND friend_user_id = old_id);
    INSERT INTO public.close_friends(user_id, friend_user_id, created_at)
      SELECT p_auth_user_id, friend_user_id, created_at FROM public.close_friends
      WHERE user_id = old_id AND friend_user_id <> p_auth_user_id
      ON CONFLICT (user_id, friend_user_id) DO NOTHING;
    INSERT INTO public.close_friends(user_id, friend_user_id, created_at)
      SELECT user_id, p_auth_user_id, created_at FROM public.close_friends
      WHERE friend_user_id = old_id AND user_id <> p_auth_user_id
      ON CONFLICT (user_id, friend_user_id) DO NOTHING;
    DELETE FROM public.close_friends WHERE user_id = old_id OR friend_user_id = old_id;

    UPDATE public.bookings SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.payment_transactions SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.refunds SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.rewards_transactions SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.trip_suggestions SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.saved_payment_methods SET is_default = FALSE
      WHERE user_id = old_id AND is_default = TRUE
        AND EXISTS (SELECT 1 FROM public.saved_payment_methods WHERE user_id = p_auth_user_id AND is_default = TRUE);
    UPDATE public.saved_payment_methods SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.reviews SET user_id = p_auth_user_id WHERE user_id = old_id;
    INSERT INTO public.review_votes(review_id, user_id, is_helpful, created_at)
      SELECT review_id, p_auth_user_id, is_helpful, created_at FROM public.review_votes WHERE user_id = old_id
      ON CONFLICT (review_id, user_id) DO NOTHING;
    DELETE FROM public.review_votes WHERE user_id = old_id;
    UPDATE public.support_tickets SET user_id = p_auth_user_id WHERE user_id = old_id;
    -- Promotion usage is historical; keep both rows unless the live schema's
    -- uniqueness rule makes them duplicates.
    BEGIN
      UPDATE public.promotion_usage SET user_id = p_auth_user_id WHERE user_id = old_id;
    EXCEPTION WHEN unique_violation THEN
      DELETE FROM public.promotion_usage WHERE user_id = old_id;
    END;
    UPDATE public.telegram_auth_events SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.destination_image_candidates SET reviewed_by = p_auth_user_id WHERE reviewed_by = old_id;
    UPDATE public.notifications SET recipient_id = p_auth_user_id
      WHERE recipient_type = 'user' AND recipient_id = old_id;

    -- Create the Auth-owned profile while retaining useful legacy fields.
    INSERT INTO public.users(id, name, email, phone_number, emergency_contact, location,
      saved_destinations, saved_stations, is_admin, created_at)
    SELECT p_auth_user_id, name, email, 'telegram:' || p_telegram_id, emergency_contact, location,
      saved_destinations, saved_stations, is_admin, created_at
    FROM public.users WHERE id = old_id
    ON CONFLICT (id) DO UPDATE SET
      emergency_contact = COALESCE(NULLIF(public.users.emergency_contact, ''), EXCLUDED.emergency_contact),
      location = COALESCE(NULLIF(public.users.location, ''), EXCLUDED.location);
    DELETE FROM public.users WHERE id = old_id;
  END IF;

  INSERT INTO public.users(id, name, phone_number, telegram_id, telegram_username,
    telegram_photo_url, telegram_language_code, last_login_at, created_at)
  VALUES (p_auth_user_id, COALESCE(NULLIF(p_name, ''), 'Telegram User'),
    'telegram:' || p_telegram_id, p_telegram_id, p_username, p_photo_url,
    p_language_code, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    telegram_id = EXCLUDED.telegram_id,
    telegram_username = EXCLUDED.telegram_username,
    telegram_photo_url = EXCLUDED.telegram_photo_url,
    telegram_language_code = EXCLUDED.telegram_language_code,
    last_login_at = NOW(),
    name = COALESCE(NULLIF(public.users.name, ''), EXCLUDED.name),
    phone_number = COALESCE(NULLIF(public.users.phone_number, ''), EXCLUDED.phone_number)
  RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.link_telegram_auth_user(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_telegram_auth_user(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT)
  TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_unique
  ON public.users(telegram_id) WHERE telegram_id IS NOT NULL;
