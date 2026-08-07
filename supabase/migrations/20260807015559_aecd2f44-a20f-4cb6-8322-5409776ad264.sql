-- 1. Grant permissions to authenticated users for the main product tables
GRANT ALL ON public.digital_products TO authenticated;
GRANT ALL ON public.product_upsells TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.digital_products TO service_role;
GRANT ALL ON public.product_upsells TO service_role;
GRANT ALL ON public.user_roles TO service_role;

-- 2. Storage Policies for product-images
-- We use a more direct approach to avoid errors with existing policies.
DO $$
BEGIN
    -- Drop all relevant policies first
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
    DROP POLICY IF EXISTS "Service Role Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update their images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
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

-- Service role full access
CREATE POLICY "Service Role Access"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
