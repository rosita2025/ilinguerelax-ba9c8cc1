# Plan: Fix SEO Edge Function Errors

The SEO dashboard in the admin panel is showing "Edge Function returned a non-2xx status code" and "Failed to send a request to the Edge Function" errors. This is primarily caused by two issues:
1. **Invalid CORS Imports**: Several Edge Functions are importing `corsHeaders` from `npm:@supabase/supabase-js@2/cors`, which does not exist in the Deno environment, leading to module resolution failures.
2. **Timeouts**: The `sitemap-notify` and `request-google-indexing` functions perform multiple sequential external requests (GSC, IndexNow, Google Indexing API), which often exceed the 60s Edge Function timeout.

## Proposed Changes

### 1. Fix CORS Headers
- Replace the incorrect `npm:@supabase/supabase-js@2/cors` import with the shared `adminCorsHeaders` from `supabase/functions/_shared/adminCsrf.ts` or local definitions where appropriate.
- I will perform a mass replacement across all affected functions identified in `functions_to_fix.txt`.

### 2. Optimize Indexing Functions
- Refactor `sitemap-notify` and `request-google-indexing` to:
    - Increase concurrency using `Promise.allSettled`.
    - Implement a strict timeout per external request (using `AbortSignal.timeout`).
    - Use `Deno.env.get("LOVABLE_API_KEY")` and GSC connector correctly.
- Ensure `request-google-indexing` uses the correct `ADMIN_REVIEW_KEY` for authorization.

### 3. Verify Fixes
- Deploy the modified Edge Functions.
- Use the SEO dashboard to trigger a sitemap check and indexing request.
- Monitor logs for any remaining CORS or timeout errors.

## Affected Files
- All functions listed in `functions_to_fix.txt` (approx. 28 files).
- `supabase/functions/sitemap-notify/index.ts`
- `supabase/functions/request-google-indexing/index.ts`
- `supabase/functions/_shared/indexnow.ts` (optimization)
