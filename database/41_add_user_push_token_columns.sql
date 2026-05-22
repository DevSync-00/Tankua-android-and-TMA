-- ============================================
-- USER PUSH TOKEN COLUMNS
-- Stores Expo push tokens for authenticated users.
-- ============================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_push_token
ON public.users(push_token)
WHERE push_token IS NOT NULL;
