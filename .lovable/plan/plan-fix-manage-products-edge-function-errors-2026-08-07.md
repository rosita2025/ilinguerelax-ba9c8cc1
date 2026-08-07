# Plan: Fix `manage-products` Edge Function Errors

The user is reporting intermittent "Edge Function error" (non-2xx status) when publishing or updating products in the admin panel. 

## Diagnosis
1. **Timeouts**: The function performs multiple background SEO pings (Google, IndexNow, Pinterest, etc.). Although refactored to use `Promise.allSettled`, if the function takes too long to respond or hits resource limits, it might still fail.
2. **Permission Errors**: "new violetes row level security policy" suggests an RLS issue, though the previous turn claimed to fix RLS for `authenticated` roles.
3. **Internal Error Detail**: The error "l-200" mentioned by the user is likely a specific error code or a typo for a 500 error log entry.
4. **CORS/CSRF**: The `assertAdminCsrf` might be rejecting requests if headers are missing or 2FA session expired.

## Proposed Changes

### 1. Edge Function (`manage-products`)
- **Isolation of SEO Pings**: Ensure the background pings are truly detached from the response lifecycle. We will use `EdgeRuntime.waitUntil` (if available) or ensure the response is returned *immediately* after the database operation succeeds.
- **Robust Error Catching**: Add more granular logging inside the `upsert` action to identify exactly which line fails (DB write vs. SEO ping preparation).
- **Service Role Key Handling**: Verify `SUPABASE_SERVICE_ROLE_KEY` is correctly used for admin-level operations.

### 2. Admin UI (`AdminProductEdit.tsx`)
- **Improved Error Visibility**: Enhance the error display to show the `detail` returned by `withAdminLogging`.
- **Validation**: Ensure all required fields are validated client-side before invoking the function to prevent 400 errors that look like system failures.

### 3. Database / RLS
- Re-verify `GRANT` and `POLICY` for `digital_products` and `product_upsells`.
- Ensure the `admin_payment_errors` table exists and is writable by the function.

## Verification Plan
1. **Manual Test**: Try to save a product in the admin preview and monitor the network tab for the specific response status and body.
2. **Logs**: Check `supabase--edge_function_logs` after a failed attempt to see the structured output from `withAdminLogging`.
3. **Function Invocation**: Test the function directly via `supabase--test_edge_functions` with a mock payload.
