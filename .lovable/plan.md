# Plan: Fix `manage-products` Edge Function Errors - Final Review

The user reported "Edge Function error" (non-2xx) when publishing products. 

## Accomplishments
1. **Permission Fix**: Verified and corrected database GRANTS for `digital_products` and `product_upsells` to ensure the `authenticated` role (used by admins) can perform CRUD operations.
2. **Timeout Prevention**: Refactored the `manage-products` edge function to run SEO pings (Google, Pinterest, Sitemap) in the background. Improved logging for these pings.
3. **Admin UI Robustness**: 
    - Switched from `supabase.functions.invoke` to `adminInvoke` in `AdminProductEdit.tsx`.
    - `adminInvoke` is superior because it correctly extracts and displays the response body (json) even on non-2xx errors, allowing the user to see the actual problem (e.g., "SKU duplicado", "2FA required") instead of a generic "non-2xx" message.
    - Added display for `detail` in the toast error message.
4. **Build Fixes**: Resolved TypeScript errors related to `adminInvoke` and generics.

## Final Verification
- The code is now type-safe and handles errors with detailed feedback.
- Background tasks in the edge function are non-blocking for the response.
- RLS and GRANTS are aligned with admin needs.

Everything is ready.
