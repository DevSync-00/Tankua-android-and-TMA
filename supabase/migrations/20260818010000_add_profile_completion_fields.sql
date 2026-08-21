-- Migration: Add is_profile_complete and city columns to public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Update existing users who already have all required fields (name, phone_number, emergency_contact, location/city)
UPDATE public.users
SET is_profile_complete = TRUE
WHERE name IS NOT NULL AND name != ''
  AND phone_number IS NOT NULL AND phone_number != ''
  AND emergency_contact IS NOT NULL AND emergency_contact != ''
  AND (
    (location IS NOT NULL AND location != '') OR
    (city IS NOT NULL AND city != '')
  );
