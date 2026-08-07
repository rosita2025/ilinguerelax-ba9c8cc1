
-- Reset and re-apply product-images storage policies with standard grants
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

DO $$
BEGIN
    -- Cleanup all known variants to ensure a clean slate
    DROP POLICY IF EXISTS "Public Read Access v4" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload Access v4" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Access v4" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Access v4" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Access All v4" ON storage.objects;
    
    DROP POLICY IF EXISTS "Public Read Access v3" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload Access v3" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Access v3" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Access v3" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Access All v3" ON storage.objects;
    
    DROP POLICY IF EXISTS "Public Read Access v2" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload Access v2" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Access v2" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Access v2" ON storage.objects;
    
    DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Access All" ON storage.objects;
END $$;

-- Standard policies for product-images bucket
CREATE POLICY "product_images_select_public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');
CREATE POLICY "product_images_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "product_images_all_service" ON storage.objects FOR ALL TO service_role USING (true) WITH CHECK (true);
