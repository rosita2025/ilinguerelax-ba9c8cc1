-- storage.buckets is in a different schema, but typically we manage it via policy or console.
-- For Lovable Cloud, we use policies.

-- Create storage bucket policies for 'product-images' if not already configured correctly.
-- Assuming the bucket already exists as the user reports upload errors (RLS).

-- Grant necessary privileges for storage management (usually handled by Supabase internal, but policies are the key)
-- The following policies ensure authenticated users (admins) can upload.

BEGIN;

-- We don't use CREATE POLICY if it might exist, so we drop first to be sure it matches our admin-only requirement.
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- Enable public view for the bucket
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Enable admin management
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

COMMIT;
