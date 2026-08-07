
-- Consolidate and verify product-images storage policies
DO $$
BEGIN
    -- We delete by name for safety across environments
    DROP POLICY IF EXISTS "Public Read Access v2" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload Access v2" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Access v2" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Access v2" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Access All v2" ON storage.objects;
END $$;

-- 1. Anyone can view images
CREATE POLICY "Public Read Access v3"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 2. Authenticated users can upload (INSERT)
CREATE POLICY "Admin Upload Access v3"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 3. Authenticated users can update existing images
CREATE POLICY "Admin Update Access v3"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 4. Authenticated users can delete images
CREATE POLICY "Admin Delete Access v3"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 5. Service role has full access
CREATE POLICY "Service Role Access All v3"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
