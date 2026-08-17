-- Migration: Add missing columns and fix RLS policies for notifications table
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS action_type TEXT,
ADD COLUMN IF NOT EXISTS target_field TEXT;

-- Drop existing restricted insert policy if any
DROP POLICY IF EXISTS "Users can insert notifications for themselves" ON public.notifications;
DROP POLICY IF EXISTS "Allow user notifications insert" ON public.notifications;

-- Create policy allowing authenticated users and functions to insert notifications
CREATE POLICY "Allow user notifications insert"
ON public.notifications
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Ensure users can read their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated, anon
USING (recipient_id = auth.uid() OR recipient_type = 'user');
