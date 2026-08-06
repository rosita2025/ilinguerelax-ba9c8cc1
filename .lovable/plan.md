# Plan - Fix: Edge Function 3xx/RLS Error on Product Save

The user is encountering an error when saving a product in the admin panel: "Edge Function returned a non-2xx status code". Based on the context and the image provided, this happens during the `upsert` action of the `manage-products` Edge Function.

## Diagnosis
1.  **Status Code 3xx/Non-2xx**: The error message in the UI suggests a failure at the Edge Function level. 
2.  **RLS/Permissions**: The previous conversation mentioned "new row violates row level security policy" and missing `GRANT`s. Although fixes were supposedly applied, the user is still seeing errors.
3.  **`manage-products` implementation**:
    -   The function uses `assertAdminCsrf(req)` which requires `x-admin-csrf` and `x-admin-2fa` (unless disabled).
    -   It uses `SUPABASE_SERVICE_ROLE_KEY` to create the admin client, so RLS shouldn't technically block the *database* operations *inside* the function, unless the function is calling another service or if the environment variables are misconfigured.
    -   However, if the client-side code is calling `supabase.functions.invoke`, it depends on the authorization headers.
    -   The error "Edge Function returned a non-2xx status code" (specifically 3xx mentioned in the prompt text "returned a non 3** staus code" which likely meant "non-2xx") often happens when there's a redirect or a CORS issue, or if the function itself returns a specific error code.
4.  **Audit Logs**: The function writes to `digital_product_changes` (via triggers or direct inserts). If `digital_product_changes` is missing permissions for the `service_role` or has a weird trigger, it could fail.
5.  **Storage**: The user mentioned "error subir imagen". This usually happens before or during the product save if the image upload to the `product-images` bucket fails.

## Proposed Actions

### 1. Database & Permissions Verification
Ensure that the `authenticated` role and `service_role` have all necessary permissions on the tables used by the admin panel.
-   Tables: `digital_products`, `product_upsells`, `digital_product_changes`.
-   Verify `GRANT`s and `RLS` policies. Even if using `service_role` in the Edge Function, the frontend might be performing some direct reads or the Edge Function might be failing on the `insert` into `digital_product_changes` if there are triggers.

### 2. Edge Function Robustness
-   Check `manage-products` logs (if possible, though I can't see them directly, I can add more logging or try-catch blocks).
-   Ensure `assertAdminCsrf` isn't failing due to origin mismatch in the sandbox environment.

### 3. Storage Policy Fix
-   Ensure the `product-images` bucket allows `authenticated` users to upload.

## Step-by-Step Implementation Plan

### Step 1: Database Migration (Grants & RLS)
Apply a comprehensive migration to ensure all tables and the storage bucket have the correct permissions. This is the most likely culprit for "RLS violation" errors.

### Step 2: Edge Function Verification
Update `manage-products` to provide more descriptive error messages if a database operation fails, helping us pinpoint if it's a `digital_products` upsert or a `product_upsells` delete/insert that is failing.

### Step 3: Frontend Error Handling
Improve the error reporting in `AdminProductEdit.tsx` to show the actual error message from the Edge Function body if available.

---

I will now create the migration and the code updates.
