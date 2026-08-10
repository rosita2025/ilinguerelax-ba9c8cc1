# SEO and Blog Automation Plan

The user reported that the blog agenda is "disorganized" and "very long," and that they want generated articles to remain unpublished until they review them (reversing the previous automatic publication change). Additionally, there's an Edge Function error in the `admin/seo` panel.

## Proposed Changes

### 1. Revert to Manual Publication for Blog Agenda
*   **`supabase/functions/process-blog-queue/index.ts`**: Change `publish: true` to `publish: false`.
*   **`supabase/functions/manage-blog-queue/index.ts`**: In `generate-one` action, change `publish: true` to `publish: false`.
*   **`src/components/admin/BlogScheduleCard.tsx`**: Update UI labels to clarify that generated posts are drafts awaiting review.

### 2. Optimize Agenda Display
*   **`src/components/admin/BlogScheduleCard.tsx`**: 
    *   Group items by day to reduce the "long list" feeling.
    *   Add a "Show More/Less" toggle for the agenda list.
    *   Improve visual hierarchy of scheduled slots.

### 3. Fix SEO Dashboard Edge Function Error
*   **`supabase/functions/gsc-inspect-urls/index.ts`**:
    *   The user previously had a "GSC connector not configured" error. Although the connector was linked, the function might still be failing if the GSC property matched doesn't have data or if the API key is not being refreshed in the sandbox.
    *   I will add more robust logging to diagnose the specific error when the connector *is* configured but still returns 500.
    *   I'll ensure `SITE_CANDIDATES` covers the actual verified property in the user's GSC account.

### 4. Improve GSC Reporting Reliability
*   **`supabase/functions/gsc-report/index.ts`**: 
    *   Similar to inspection, improve candidate site matching and error messaging.

## Verification Plan

### Automated Checks
*   `lovable-exec`: Check for syntax errors in Edge Functions.
*   `vitest`: If existing tests exist for these functions, run them.

### Manual Verification (via Preview)
*   Navigate to `/admin/seo`.
*   Check the "Agenda de blog" card: verify it looks more compact and organized.
*   Trigger a "Generar ahora" and verify the item status changes to "processing" then "pending approval" (draft), NOT "done" immediately.
*   Verify the SEO report loads without the 500 error.
