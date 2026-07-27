INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-logos',
  'provider-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Providers can update own profile" ON public.providers;
CREATE POLICY "Providers can update own profile"
  ON public.providers FOR UPDATE TO authenticated
  USING (id = get_user_provider_id(auth.uid()::text))
  WITH CHECK (id = get_user_provider_id(auth.uid()::text));

DROP POLICY IF EXISTS "Public provider logo access" ON storage.objects;
CREATE POLICY "Public provider logo access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-logos');

DROP POLICY IF EXISTS "Providers upload own logo" ON storage.objects;
CREATE POLICY "Providers upload own logo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'provider-logos'
    AND (storage.foldername(name))[1] = get_user_provider_id(auth.uid()::text)::text
  );

DROP POLICY IF EXISTS "Providers update own logo" ON storage.objects;
CREATE POLICY "Providers update own logo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'provider-logos'
    AND (storage.foldername(name))[1] = get_user_provider_id(auth.uid()::text)::text
  )
  WITH CHECK (
    bucket_id = 'provider-logos'
    AND (storage.foldername(name))[1] = get_user_provider_id(auth.uid()::text)::text
  );

DROP POLICY IF EXISTS "Providers delete own logo" ON storage.objects;
CREATE POLICY "Providers delete own logo"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'provider-logos'
    AND (storage.foldername(name))[1] = get_user_provider_id(auth.uid()::text)::text
  );
