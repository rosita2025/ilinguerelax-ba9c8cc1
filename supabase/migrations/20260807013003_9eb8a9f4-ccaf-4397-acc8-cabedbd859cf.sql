-- Policies for authenticated users to manage images
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
    CREATE POLICY "Authenticated users can upload images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-images');

    DROP POLICY IF EXISTS "Authenticated users can update their images" ON storage.objects;
    CREATE POLICY "Authenticated users can update their images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'product-images');

    DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
    CREATE POLICY "Authenticated users can delete images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-images');

    DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
    CREATE POLICY "Anyone can view product images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'product-images');
END
$$;
