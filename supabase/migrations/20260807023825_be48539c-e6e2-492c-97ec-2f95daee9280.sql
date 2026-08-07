CREATE POLICY "product_images_insert_v3" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_update_v3" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_delete_v3" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_select_v3" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'product-images');