
CREATE POLICY "product-images anon write" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product-images anon update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product-images anon delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'product-images');
