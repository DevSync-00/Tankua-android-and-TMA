-- ============================================
-- DELETE CURRENT USER ACCOUNT
-- Allows an authenticated mobile user to delete their own account.
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_current_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id UUID := auth.uid();
BEGIN
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove user-owned records first so foreign keys do not block deletion.
  IF to_regclass('public.notifications') IS NOT NULL THEN
    DELETE FROM public.notifications
    WHERE recipient_type = 'user'
      AND recipient_id = target_user_id;
  END IF;

  IF to_regclass('public.saved_payment_methods') IS NOT NULL THEN
    DELETE FROM public.saved_payment_methods
    WHERE user_id = target_user_id;
  END IF;

  IF to_regclass('public.review_votes') IS NOT NULL THEN
    DELETE FROM public.review_votes
    WHERE user_id = target_user_id;
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL THEN
    DELETE FROM public.reviews
    WHERE user_id = target_user_id;
  END IF;

  IF to_regclass('public.refunds') IS NOT NULL THEN
    DELETE FROM public.refunds
    WHERE user_id = target_user_id
       OR booking_id IN (
        SELECT id FROM public.bookings WHERE user_id = target_user_id
      )
       OR payment_transaction_id IN (
        SELECT id FROM public.payment_transactions WHERE user_id = target_user_id
      );
  END IF;

  IF to_regclass('public.payment_transactions') IS NOT NULL THEN
    DELETE FROM public.payment_transactions
    WHERE user_id = target_user_id
       OR booking_id IN (
        SELECT id FROM public.bookings WHERE user_id = target_user_id
      );
  END IF;

  IF to_regclass('public.promotion_usage') IS NOT NULL THEN
    DELETE FROM public.promotion_usage
    WHERE user_id = target_user_id;
  END IF;

  IF to_regclass('public.rewards_transactions') IS NOT NULL THEN
    DELETE FROM public.rewards_transactions
    WHERE user_id = target_user_id;
  END IF;

  IF to_regclass('public.rewards_points') IS NOT NULL THEN
    DELETE FROM public.rewards_points
    WHERE user_id = target_user_id;
  END IF;

  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    UPDATE public.audit_logs
    SET actor_id = NULL
    WHERE actor_type = 'user'
      AND actor_id = target_user_id;
  END IF;

  DELETE FROM public.bookings
  WHERE user_id = target_user_id;

  DELETE FROM public.users
  WHERE id = target_user_id;

  DELETE FROM auth.users
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_current_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_current_user_account() TO authenticated;
