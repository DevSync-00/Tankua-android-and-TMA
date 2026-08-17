-- Migration: Prevent Telegram users from updating or modifying their phone_number column
CREATE OR REPLACE FUNCTION prevent_telegram_phone_number_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If phone_number is being changed and user is registered via Telegram
  IF OLD.phone_number IS DISTINCT FROM NEW.phone_number THEN
    IF OLD.phone_number LIKE 'telegram:%' OR OLD.email LIKE 'telegram-%@auth.tankua.app' THEN
      RAISE EXCEPTION 'Phone numbers linked to Telegram accounts cannot be modified or removed.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_telegram_phone_update ON public.users;

CREATE TRIGGER trigger_prevent_telegram_phone_update
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION prevent_telegram_phone_number_update();
