-- Drop old policies for product-images one by one
DROP POLICY IF EXISTS "product_images_delete_auth" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_v3" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert_v3" ON storage.objects;
DROP POLICY IF EXISTS "product_images_select_public" ON storage.objects;
DROP POLICY IF EXISTS "product_images_select_v3" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_v3" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v5_delete" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v5_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v5_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v5_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v6_delete" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v6_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v6_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v6_update" ON storage.objects;
DROP POLICY IF EXISTS "review-photos anon upload constrained" ON storage.objects;

-- Create fresh policies
CREATE POLICY "product_images_v7_select" ON storage.objects 
FOR SELECT TO public USING (bucket_id = 'product-images');

CREATE POLICY "product_images_v7_insert" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_v7_update" ON storage.objects 
FOR UPDATE TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_v7_delete" ON storage.objects 
FOR DELETE TO authenticated USING (bucket_id = 'product-images');
