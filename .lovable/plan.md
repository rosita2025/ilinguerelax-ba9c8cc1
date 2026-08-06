# Plan - Fix Admin Product Upload and RLS Issues

The user reported issues when creating/updating products in `/admin/productos`:
1. "Error subir imagen": Image upload fails.
2. "New row violates row level security policy": Database insert/update fails.
3. "Guardar error L-200": Likely a generic error code or a specific validation error in the UI.

## Diagnosis
- **RLS/Grants**: `digital_products` and `product_upsells` tables lack explicit `GRANT` statements for `authenticated` and `anon` roles in the `public` schema. Even though `service_role` has policies, Supabase's Data API requires explicit grants.
- **Image Upload**: The `product-images` storage bucket has policies allowing `service_role` to manage objects, but the client-side `ProductImageUploader.tsx` uses the standard `supabase.storage` client. If the user is authenticated as a regular user (or even admin but via the client), they might lack permissions to upload directly if the bucket isn't correctly configured for `authenticated` uploads, or if it expects the Edge Function to handle it. However, the code shows it trying to upload via `supabase.storage.from("product-images").upload(...)`.
- **L-200**: This might refer to a line number in a specific file or a truncated error message. In `AdminProductEdit.tsx`, the `save` function calls the `manage-products` Edge Function.

## Proposed Changes

### 1. Database Security (Grants & Policies)
- Apply missing `GRANT` statements for `digital_products` and `product_upsells` to `authenticated`, `anon`, and `service_role`.
- Verify and fix RLS policies for `digital_products` to ensure `service_role` can always bypass and `authenticated` (admins) can manage if needed.

### 2. Storage Security
- Add a policy to the `product-images` bucket to allow `authenticated` users (admins) to upload images, OR ensure the `service_role` is correctly used. Since the client-side is used, we need a policy for `authenticated`.

### 3. Edge Function & UI Fixes
- Review `manage-products` for any logic that might trigger "L-200" (possibly a validation or a sub-request failure).
- Update `ProductImageUploader.tsx` to handle potential permission errors more gracefully.

## Execution Steps
1. Execute SQL migration to fix GRANTS and storage policies.
2. Update `AdminProductEdit.tsx` if any client-side calls are bypassing the Edge Function or if validation is too strict.
3. Verify the fix by attempting to create a test product with an image.
