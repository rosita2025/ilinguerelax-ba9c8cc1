-- Grant schema usage
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;

-- Grant table access
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO anon;

-- Clear all previous policies for product-images to avoid conflicts
DROP POLICY IF EXISTS "product_images_v7_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v7_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v7_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v7_delete" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v6_bucket_select" ON storage.buckets;
DROP POLICY IF EXISTS "product_images_v5_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v5_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v5_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_v5_delete" ON storage.objects;

-- Create unified permissive policies for the product-images bucket
CREATE POLICY "product_images_v8_objects_all" ON storage.objects
FOR ALL TO public
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_v8_buckets_all" ON storage.buckets
FOR ALL TO public
USING (id = 'product-images')
WITH CHECK (id = 'product-images');
