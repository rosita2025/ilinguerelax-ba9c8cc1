CREATE POLICY "product_images_v5_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');
CREATE POLICY "product_images_v5_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_v5_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_v5_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
