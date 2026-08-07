-- Create V6 policies for storage.objects for the 'product-images' bucket
DROP POLICY IF EXISTS "product_images_v6_select" ON storage.objects;
CREATE POLICY "product_images_v6_select" ON storage.objects 
FOR SELECT TO public USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_v6_insert" ON storage.objects;
CREATE POLICY "product_images_v6_insert" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_v6_update" ON storage.objects;
CREATE POLICY "product_images_v6_update" ON storage.objects 
FOR UPDATE TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_v6_delete" ON storage.objects;
CREATE POLICY "product_images_v6_delete" ON storage.objects 
FOR DELETE TO authenticated USING (bucket_id = 'product-images');
