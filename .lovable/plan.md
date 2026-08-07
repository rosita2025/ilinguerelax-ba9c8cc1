# Plan - Fix Product Save and Image Upload Errors

The user is encountering errors when saving products ("otra vez me dio erro") and specifically reported "new violetes row level security policy" during image uploads. This indicates that the `authenticated` role lacks sufficient permissions on either the database tables or the storage bucket.

## Proposed Changes

### 1. Database Permissions (Migration)
- Apply explicit `GRANT ALL` on `public.digital_products`, `public.product_upsells`, and `public.user_roles` to the `authenticated` and `service_role` roles.
- This ensures that even if RLS allows the action, the database user has the underlying table-level permissions.

### 2. Storage Policy Update (Migration)
- Ensure the `product-images` bucket has robust policies for `authenticated` users:
  - `INSERT` with `(bucket_id = 'product-images'::text)`
  - `SELECT` for anyone (`true`)
  - `UPDATE`/`DELETE` for `authenticated` users.

### 3. Edge Function Data Hardening
- Update `supabase/functions/manage-products/index.ts` to include the `bonus_titles` field in the `row` object during `upsert`.
- Ensure all numeric fields are correctly sanitized.

### 4. Admin UI Robustness
- In `AdminProductEdit.tsx`, ensure that boolean fields like `is_physical`, `active`, and `store_enabled` are always sent as explicit booleans to prevent type mismatch errors in the Edge Function.
- Improve error reporting in the UI to display the specific database or RLS error message if available.

## Verification Plan
1. **Simulated Save**: Use `adminInvoke` to test the `upsert` action with a mock product.
2. **Storage Verification**: Verify that the `authenticated` role can indeed upload to `product-images` by checking the effective policies in `pg_policies`.
3. **Manual Verification**: The user will test the "Guardar" button and image uploader.

