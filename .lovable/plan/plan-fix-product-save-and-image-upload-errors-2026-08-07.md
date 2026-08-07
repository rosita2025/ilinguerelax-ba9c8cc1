# Plan - Fix Product Save and Image Upload Errors

The user is encountering persistent errors when saving products ("otra vez me dio erro") and specifically mentioned a "new violates row level security policy" error during image uploads. 

## Diagnosis
1.  **Auth State**: `auth.users` is empty (`count: 0`). This is critical because the admin panel relies on `authenticated` role permissions. Without a user session, the client-side calls (like image uploads to storage) fail RLS checks.
2.  **Edge Function Permission**: Even if the user is signed in as an admin in the custom `AdminGate`, the underlying Supabase session might be missing or invalid, causing storage uploads to fail.
3.  **Missing Grants**: The database tables and storage bucket might lack explicit `GRANT` statements for the `authenticated` role, which are required for the Data API to function.

## Proposed Changes

### 1. Permissions Hardening (Migration)
- Apply explicit `GRANT ALL` on `public.digital_products`, `public.product_upsells`, and `public.user_roles` to both `authenticated` and `service_role`.
- Fix storage policies for the `product-images` bucket to ensure `authenticated` users can `INSERT`, `UPDATE`, and `DELETE`.
- **Note**: The user must be signed in via Supabase for these policies to take effect.

### 2. Edge Function Update
- Update `supabase/functions/manage-products/index.ts` to include missing fields like `bonus_titles` and ensure strict type handling for booleans.

### 3. Frontend Error Visibility
- Improve `AdminProductEdit.tsx` to show the exact error message from the backend, including RLS violations, to help the user understand *why* it failed (e.g., "Permission denied" vs "Validation error").

## Verification Plan
1. **Admin Login**: Ensure the user is actually signed into the app via the Supabase auth flow, not just the custom `AdminGate` password.
2. **Storage Test**: Attempt an image upload and check the console for 403 errors.
3. **Save Test**: Create a new product and verify it appears in the list.
