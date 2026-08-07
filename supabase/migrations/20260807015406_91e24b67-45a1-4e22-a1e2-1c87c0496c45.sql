-- 1. Grant permissions to authenticated users for the main product tables
GRANT ALL ON public.digital_products TO authenticated;
GRANT ALL ON public.product_upsells TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.digital_products TO service_role;
GRANT ALL ON public.product_upsells TO service_role;
GRANT ALL ON public.user_roles TO service_role;

-- 2. Ensure storage schema permissions for authenticated users
-- Note: Direct grants on storage.objects might fail depending on DB config, 
-- but we rely on RLS policies below.

-- 3. Storage Policies for product-images
-- We use DO blocks to safely handle policy creation if they exist or to replace them.
DO $$
BEGIN
    -- Delete old policies to avoid duplicates or conflicts
    DELETE FROM storage.policies WHERE bucket_id = 'product-images';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not clean old storage policies';
END $$;

-- Anyone can view
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated can upload
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Authenticated can update
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Authenticated can delete
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
