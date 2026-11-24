BEGIN;

-- Notifications: 20260818020000 let anyone (including anon) insert any row.
-- Signed-in users may now only create notifications addressed to themselves
-- (the app's own profile-completion reminder). Admin inserts keep using
-- "Admins can create notifications"; triggers and edge functions run as
-- SECURITY DEFINER / service role and are not affected by RLS.
DROP POLICY IF EXISTS "Allow user notifications insert" ON public.notifications;
CREATE POLICY "Users can create own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (recipient_type = 'user' AND recipient_id = auth.uid());

-- Payment transactions: "Service role can update transactions" had USING (true)
-- with no role, so any caller could rewrite any transaction. The service role
-- bypasses RLS and never needed it. All writes now go through the
-- chapa-payment edge function or the Mini App Worker (both service role), so
-- clients no longer insert either.
DROP POLICY IF EXISTS "Service role can update transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.payment_transactions;

COMMIT;
