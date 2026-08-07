# Plan - Fix Storage RLS for Image Uploads

The user is encountering a "new row violates row-level security policy" error when uploading images for new products. This happens because the `product-images` storage bucket policies might not correctly authorize the `authenticated` role for `INSERT` operations, or there's a conflict between multiple policies.

## Proposed Changes

### 1. Database Migration
Create a new migration to consolidate and fix storage policies for the `product-images` bucket.
- Drop existing conflicting policies on `storage.objects` for the `product-images` bucket.
- Create explicit `INSERT`, `UPDATE`, `DELETE`, and `SELECT` policies for the `authenticated` role.
- Ensure `public` (anon) can `SELECT` (read) images.
- Ensure `service_role` has full access.

### 2. Verification
- Use `psql` to verify the policies are correctly applied to `storage.objects`.
- Check if the `authenticated` role can now perform inserts into the `storage.objects` table specifically for the `product-images` bucket.

## Migration SQL
```sql
-- Final fix for product-images storage policies
DO $$
BEGIN
    -- Cleanup any potential duplicates or restrictive policies
    DELETE FROM storage.policies WHERE bucket_id = 'product-images';
END $$;

-- 1. Public Read Access
CREATE POLICY "Public Read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 2. Authenticated Insert (Upload)
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 3. Authenticated Update
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 4. Authenticated Delete
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 5. Service Role Full Access
CREATE POLICY "Service Role Full Access"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```
