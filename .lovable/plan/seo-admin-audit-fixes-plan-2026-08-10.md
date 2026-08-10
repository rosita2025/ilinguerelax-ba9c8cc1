# SEO Admin Audit & Fixes Plan

The user reported errors in `/admin/seo`. Based on codebase inspection and logs, several potential points of failure were identified: CORS inconsistencies, 502/504 timeouts due to heavy GSC/Indexing pings, and missing Search Console property matching.

## Proposed Changes

### 1. Unified CORS & Security Headers
- Standardize `corsHeaders` across all SEO functions (`gsc-report`, `check-multi-search-index`, `google-suggest`, `sitemap-notify`).
- Ensure all functions include `OPTIONS` preflight handling.

### 2. Resilience and Timeouts
- **`sitemap-notify`**: Parallelize pings with `Promise.allSettled` (done) but add explicit timeouts to each fetch so one slow provider (like Yandex or Baidu) doesn't kill the 60s Edge Function limit.
- **`gsc-inspect-urls`**: Add more detailed error reporting when a Search Console property isn't found, suggesting which candidate failed.

### 3. Database & Logging
- Keep monitoring `indexing_events`. The current `dead_letter` logs show Yandex/Bing 404/410 errors which are external, but the dashboard should clarify these are "External Provider Errors" not system crashes.

### 4. Admin UI Improvements
- **`AdminSEO.tsx`**: Add a global "Retry all failed indexing" shortcut directly in the main SEO dashboard, similar to the one in `AdminIndexing.tsx`.
- **`SitemapHealthCard.tsx`**: Improve the error display to be more actionable when a 504 timeout occurs (suggesting retrying individual products).

## User Review Required
> [!IMPORTANT]
> Some SEO features rely on the **Google Search Console Connector** being active. Please ensure the connector "iLingue relax" is still connected in your settings.

- Should I proceed with standardizing the CORS headers and adding timeouts to the sitemap pings?
- Would you like a button to "Reset Indexing Logs" if the historical errors (410/404 from Bing) are cluttering your view?
