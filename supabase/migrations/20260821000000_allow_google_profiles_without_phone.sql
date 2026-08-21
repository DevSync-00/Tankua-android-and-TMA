-- Google-native accounts do not collect or verify phone numbers in this phase.
ALTER TABLE public.users
  ALTER COLUMN phone_number DROP NOT NULL,
  ALTER COLUMN phone_number_verified DROP DEFAULT;
