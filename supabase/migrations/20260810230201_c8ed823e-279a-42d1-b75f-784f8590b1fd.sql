
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'blog_images_public_read' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "blog_images_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'blog-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'blog_images_service_all' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "blog_images_service_all" ON storage.objects FOR ALL TO service_role USING (bucket_id = 'blog-images') WITH CHECK (bucket_id = 'blog-images');
    END IF;
END $$;
