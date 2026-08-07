-- Final fix for product-images storage policies
DO $$
BEGIN
    -- Drop conflicting policies by name
    DROP POLICY IF EXISTS "Public Read" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Public access to product images" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Access" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Access All" ON storage.objects;
    DROP POLICY IF EXISTS "product-images service delete" ON storage.objects;
    DROP POLICY IF EXISTS "product-images service update" ON storage.objects;
    DROP POLICY IF EXISTS "product-images service write" ON storage.objects;
END $$;

-- 1. Public Read Access
CREATE POLICY "Public Read Access v2"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 2. Authenticated Insert (Upload)
CREATE POLICY "Admin Upload Access v2"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 3. Authenticated Update
CREATE POLICY "Admin Update Access v2"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 4. Authenticated Delete
CREATE POLICY "Admin Delete Access v2"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 5. Service Role Full Access
CREATE POLICY "Service Role Access All v2"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
