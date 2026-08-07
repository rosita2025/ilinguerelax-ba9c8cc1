# Plan - Fix Product Save Error

The user is encountering a persistent error when saving products in the admin panel. Based on the logs and codebase investigation, the issue is likely related to **RLS (Row Level Security) permissions** for the `authenticated` role when interacting with `digital_products`, `product_upsells`, and the `product-images` storage bucket. Even though policies exist, explicit `GRANT` statements for the `authenticated` role are often missing in Supabase environments where `service_role` is the primary actor for Edge Functions but the client-side uses the user's session.

## Proposed Changes

### 1. Database & Permissions (Migration)
- Apply explicit `GRANT ALL` on `public.digital_products`, `public.product_upsells`, and `public.user_roles` to the `authenticated` role.
- Ensure the `has_role` function is available and used correctly in policies.
- Fix any potential recursion in `user_roles` policies by ensuring it uses `security definer`.

### 2. Storage Hardening
- Verify and fix policies for the `product-images` bucket to ensure `authenticated` users can `INSERT` and `UPDATE` objects.

### 3. Frontend Error Visibility
- Update `AdminProductEdit.tsx` to log the exact error payload from `adminInvoke` when it fails, helping diagnose if it's a 403 (RLS), 400 (Validation), or 500 (Server).

## Verification Plan
1. **Manual Test**: Navigate to `/admin/productos/nuevo`, fill in details, upload an image, and save.
2. **Logs Audit**: Check Edge Function logs for `admin-2fa` and `manage-products` to ensure tokens are being validated and no database errors are thrown.
3. **Storage Check**: Verify that image uploads work without "Permission denied" errors in the console.
