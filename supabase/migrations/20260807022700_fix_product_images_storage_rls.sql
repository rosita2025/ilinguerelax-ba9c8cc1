-- Final fix for product-images storage policies to prevent RLS errors on upload
DO $$
BEGIN
    -- Cleanup all existing policies for this bucket to ensure a clean slate
    -- We target by bucket_id in storage.objects policies
    DELETE FROM storage.policies WHERE bucket_id = 'product-images';
EXCEPTION WHEN OTHERS THEN
    -- If storage.policies is not directly accessible, we drop by name as a fallback
    DROP POLICY IF EXISTS "Public Read" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Public access to product images" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Access" ON storage.objects;
    DROP POLICY IF EXISTS "product-images service delete" ON storage.objects;
    DROP POLICY IF EXISTS "product-images service update" ON storage.objects;
    DROP POLICY IF EXISTS "product-images service write" ON storage.objects;
END $$;

-- 1. Public Read Access (Anyone can view product images)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 2. Authenticated Insert (Upload) - Critical for Admin panel
CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 3. Authenticated Update
CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 4. Authenticated Delete
CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 5. Service Role Full Access
CREATE POLICY "Service Role Access All"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
