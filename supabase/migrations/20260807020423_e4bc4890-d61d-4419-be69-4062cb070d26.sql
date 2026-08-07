-- Ensure the authenticated role has comprehensive permissions for product management.
-- We re-apply grants and ensure policies are wide enough for the admin flow.

GRANT ALL ON public.digital_products TO authenticated;
GRANT ALL ON public.product_upsells TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;

-- Force RLS policies for digital_products to be permissive for authenticated users
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can manage products" ON public.digital_products;
    DROP POLICY IF EXISTS "Admins can manage digital_products" ON public.digital_products;
    DROP POLICY IF EXISTS "Admins can do everything on products" ON public.digital_products;
END $$;

CREATE POLICY "Admins can manage products v5"
ON public.digital_products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure storage access is fully granted for image uploads
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
END $$;

CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
