BEGIN;

-- The trip creation RPC runs with an empty search path. Its RLS helpers
-- must resolve the same provider and admin records in that context.
CREATE OR REPLACE FUNCTION public.get_user_provider_id(user_id TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT staff.provider_id
  FROM public.provider_users AS staff
  WHERE staff.email = public.get_auth_user_email(user_id)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users AS admin
    WHERE admin.id::text = user_id
  );
$$;

COMMIT;
