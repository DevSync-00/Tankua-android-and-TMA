-- Older deployments created users.telegram_id as TEXT. Migration 46 used
-- ADD COLUMN IF NOT EXISTS, which does not correct the type of an existing
-- column. Keep Telegram identity numeric everywhere so the reconciliation RPC
-- can compare it to its BIGINT parameter.

DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'telegram_id';

  IF current_type IS NULL THEN
    ALTER TABLE public.users ADD COLUMN telegram_id BIGINT;
  ELSIF current_type <> 'bigint' THEN
    IF EXISTS (
      SELECT 1 FROM public.users
      WHERE NULLIF(BTRIM(telegram_id::TEXT), '') IS NOT NULL
        AND BTRIM(telegram_id::TEXT) !~ '^[0-9]+$'
    ) THEN
      RAISE EXCEPTION 'users.telegram_id contains non-numeric values; clean them before converting to BIGINT';
    END IF;

    ALTER TABLE public.users ALTER COLUMN telegram_id DROP DEFAULT;
    ALTER TABLE public.users ALTER COLUMN telegram_id TYPE BIGINT
      USING CASE
        WHEN NULLIF(BTRIM(telegram_id::TEXT), '') IS NULL THEN NULL
        ELSE BTRIM(telegram_id::TEXT)::BIGINT
      END;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_unique
  ON public.users (telegram_id) WHERE telegram_id IS NOT NULL;
