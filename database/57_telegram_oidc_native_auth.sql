-- Migration: Add Telegram OIDC Native Authentication Support
-- File: database/57_telegram_oidc_native_auth.sql

-- 1. Add OIDC schema columns to public.users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS phone_number_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS telegram_oidc_sub TEXT;

-- 2. Create unique index for telegram_oidc_sub
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_oidc_sub_unique
  ON public.users(telegram_oidc_sub) WHERE telegram_oidc_sub IS NOT NULL;

-- 3. Atomic RPC function to link Telegram OIDC authenticated users
CREATE OR REPLACE FUNCTION public.link_telegram_oidc_user(
  p_auth_user_id UUID,
  p_telegram_id BIGINT,
  p_name TEXT,
  p_username TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL,
  p_phone_number_verified BOOLEAN DEFAULT FALSE,
  p_sub TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_id UUID;
  result public.users%ROWTYPE;
  final_phone TEXT;
BEGIN
  IF p_auth_user_id IS NULL OR p_telegram_id IS NULL THEN
    RAISE EXCEPTION 'Auth user and Telegram ID are required';
  END IF;

  PERFORM pg_advisory_xact_lock(p_telegram_id);
  SELECT id INTO old_id FROM public.users WHERE telegram_id = p_telegram_id LIMIT 1 FOR UPDATE;

  -- Determine target phone number format
  IF p_phone_number IS NOT NULL AND p_phone_number <> '' THEN
    final_phone := p_phone_number;
  ELSE
    final_phone := 'telegram:' || p_telegram_id;
  END IF;

  IF old_id IS NOT NULL AND old_id <> p_auth_user_id THEN
    -- Free legacy phone placeholder on old row
    UPDATE public.users SET phone_number = 'legacy-telegram:' || old_id WHERE id = old_id;

    -- Migrate related user records safely
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

    UPDATE public.bookings SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.payment_transactions SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.refunds SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.rewards_transactions SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.trip_suggestions SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.saved_payment_methods SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.reviews SET user_id = p_auth_user_id WHERE user_id = old_id;
    UPDATE public.support_tickets SET user_id = p_auth_user_id WHERE user_id = old_id;

    -- Create Auth-owned profile retaining legacy attributes
    INSERT INTO public.users(id, name, email, phone_number, emergency_contact, location,
      saved_destinations, saved_stations, is_admin, created_at)
    SELECT p_auth_user_id, name, email, final_phone, emergency_contact, location,
      saved_destinations, saved_stations, is_admin, created_at
    FROM public.users WHERE id = old_id
    ON CONFLICT (id) DO UPDATE SET
      emergency_contact = COALESCE(NULLIF(public.users.emergency_contact, ''), EXCLUDED.emergency_contact),
      location = COALESCE(NULLIF(public.users.location, ''), EXCLUDED.location);

    DELETE FROM public.users WHERE id = old_id;
  END IF;

  -- Upsert new user profile
  INSERT INTO public.users(
    id, name, phone_number, phone_number_verified, telegram_id, telegram_username,
    telegram_photo_url, telegram_oidc_sub, last_login_at, created_at
  )
  VALUES (
    p_auth_user_id, COALESCE(NULLIF(p_name, ''), 'Telegram User'),
    final_phone, COALESCE(p_phone_number_verified, FALSE), p_telegram_id, p_username,
    p_photo_url, p_sub, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    telegram_id = EXCLUDED.telegram_id,
    telegram_username = EXCLUDED.telegram_username,
    telegram_photo_url = EXCLUDED.telegram_photo_url,
    telegram_oidc_sub = COALESCE(EXCLUDED.telegram_oidc_sub, public.users.telegram_oidc_sub),
    phone_number_verified = COALESCE(EXCLUDED.phone_number_verified, public.users.phone_number_verified),
    last_login_at = NOW(),
    name = COALESCE(NULLIF(public.users.name, ''), EXCLUDED.name),
    phone_number = CASE 
      WHEN EXCLUDED.phone_number_verified = TRUE THEN EXCLUDED.phone_number 
      ELSE COALESCE(NULLIF(public.users.phone_number, ''), EXCLUDED.phone_number) 
    END
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- 4. Strict Security Lockdown: Restrict execution strictly to service_role
REVOKE ALL ON FUNCTION public.link_telegram_oidc_user(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.link_telegram_oidc_user(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT)
  TO service_role;
