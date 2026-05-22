
-- 1. Add explicit deny policy on abandoned_carts (clarity & future-safety)
CREATE POLICY "No public access to abandoned_carts"
ON public.abandoned_carts
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 2. Restrict review-photos bucket: enforce size limit and MIME types
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'review-photos';

-- Tighten upload policy: enforce bucket + reasonable size handled at bucket level,
-- and restrict to image MIME types via storage.objects.metadata check
DROP POLICY IF EXISTS "Anyone can upload review photos" ON storage.objects;
CREATE POLICY "Anyone can upload review photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'review-photos'
  AND (lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp','gif']))
);
