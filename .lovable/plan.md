# Plan: Fix Admin Product Permissions

The user is encountering "Error al subir" and "new row violates row-level security policy" when attempting to manage products in the admin panel. Although a previous attempt was made to fix this, the grants on the `public.digital_products` and `public.product_upsells` tables appear to be missing for the `authenticated` role (likely due to the order of operations in the migration or a failure during execution).

## Proposed Changes

### Database Permissions (Supabase Migration)

1.  Create a new migration to explicitly grant full access to the `authenticated` role and `service_role` for product management tables.
2.  Ensure RLS policies allow `authenticated` users to manage rows.
3.  Ensure the `product-images` storage bucket has the correct policies for `authenticated` users to upload and manage files.

```sql
-- Explicitly grant permissions to authenticated users for admin tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;
GRANT SELECT ON public.digital_products TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_upsells TO authenticated;
GRANT ALL ON public.product_upsells TO service_role;
GRANT SELECT ON public.product_upsells TO anon;

-- Fix storage policies for product-images
-- (Ensuring bucket exists and is public)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

-- Drop existing to avoid conflicts and recreate clean
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');

-- Ensure RLS is enabled and policies exist for authenticated users
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage digital_products" ON public.digital_products;
CREATE POLICY "Admins can manage digital_products" ON public.digital_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.product_upsells ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage product_upsells" ON public.product_upsells;
CREATE POLICY "Admins can manage product_upsells" ON public.product_upsells FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

## Verification Plan

1.  **Check Grants**: Run `psql` commands to verify that `authenticated` now has `INSERT`, `UPDATE`, `DELETE` privileges.
2.  **Verify Storage**: Use `supabase--storage_update_bucket` or similar to check if the bucket is accessible.
3.  **Manual Test**: Navigate to `/admin/productos` in the preview and attempt to create a "Test Product" with an image upload.
