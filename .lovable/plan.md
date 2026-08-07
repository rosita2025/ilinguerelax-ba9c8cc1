# Plan: Fix Edge Function "non-2xx" Errors and Admin Issues

The user reported a "non-2xx status code" error from an Edge Function. My investigation revealed that while the backend is healthy, there are frequent network errors (`Failed to fetch`) in client logs, and the `manage-products` function performs many "fire-and-forget" external SEO pings (Google, Bing, Pinterest) that might be timing out or failing, potentially causing the function to exceed Deno's execution limits or return errors if not handled correctly.

## 1. Hardening `manage-products` Edge Function
- **Identify Issue**: The function pings multiple external SEO services (`IndexNow`, `Google Indexing`, `Pinterest`, `Sitemap`) sequentially or in parallel without individual error isolation. If one service hangs, the whole function might time out or return a 500.
- **Fix**: Wrap SEO pings in a `try-catch` block and use `Promise.allSettled` to ensure one service's failure doesn't crash the product save operation.
- **Timeout Protection**: Ensure external fetches have strict timeouts (already present in `fetchRetry` but needs verification in the main flow).

## 2. Fix Database Permissions & Schema Discrepancies
- **Missing Table**: `public.admin_payment_errors` is referenced in code but missing from the database. I will create it.
- **RLS/Grants**: Ensure `authenticated` and `service_role` have proper grants on all audit and logging tables to avoid 403 errors that manifest as "non-2xx".

## 3. Improve Client-Side Error Handling
- **Identify Issue**: `adminInvoke` and `invokeWithRetry` catch errors but sometimes the "non-2xx" message is too generic for the user.
- **Fix**: Ensure the `adminInvoke` helper always extracts and displays the `edgeDetail` (the JSON error body) so the user sees "SKU duplicado" or "Drive link invalid" instead of a generic status code.

## 4. Storage Policy Verification
- Check if `authenticated` users have `INSERT` permissions on the `product-images` bucket to prevent upload failures.

## Proposed Changes

### Database Migration
- Create `public.admin_payment_errors` table.
- Grant permissions to `authenticated` and `service_role`.

### Edge Function: `manage-products`
- Wrap SEO pings in `Edge Function` to prevent blocking the main response.
- Ensure the response is returned as soon as the DB update is successful.

### Frontend: `src/lib/adminInvoke.ts`
- Improve error extraction to ensure `edgeDetail` is always prioritized in UI toasts.

### Frontend: `src/components/admin/AdminGate.tsx`
- Add a heartbeat or check to verify the 2FA session is still valid before performing actions, preventing "Forbidden" errors mid-session.

---
One short sentence: I'm preparing a fix for the Edge Function timeouts and missing database tables to resolve the "non-2xx" errors.
