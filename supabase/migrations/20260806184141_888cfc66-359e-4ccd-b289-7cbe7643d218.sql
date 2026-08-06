-- 1. Fix Storage Policies for product-images
-- Allow authenticated users (admins) to upload to product-images
CREATE POLICY "Admins can upload product images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admins can update product images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can delete product images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'product-images');

-- Ensure public can view images (it should already be public, but let's be sure)
CREATE POLICY "Public can view product images" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'product-images');

-- 2. Fix Grants for digital_products and product_upsells
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;
GRANT SELECT ON public.digital_products TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_upsells TO authenticated;
GRANT ALL ON public.product_upsells TO service_role;
GRANT SELECT ON public.product_upsells TO anon;

-- 3. Add RLS policies for authenticated users on these tables 
-- (This fixes "new row violates RLS" if the client-side somehow uses the user session)
CREATE POLICY "Admins can manage digital_products" 
ON public.digital_products FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Admins can manage product_upsells" 
ON public.product_upsells FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
