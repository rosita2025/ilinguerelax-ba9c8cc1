-- Create a policy for storage.buckets so authenticated users can see the bucket existence
DROP POLICY IF EXISTS "product_images_v6_bucket_select" ON storage.buckets;
CREATE POLICY "product_images_v6_bucket_select" ON storage.buckets 
FOR SELECT TO authenticated USING (id = 'product-images');
