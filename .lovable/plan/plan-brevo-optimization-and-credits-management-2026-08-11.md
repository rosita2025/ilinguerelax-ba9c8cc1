# Plan: Brevo Optimization and Credits Management

The user wants to centralize all email automation in Brevo, ensuring no duplicate emails are sent and credits are managed efficiently (avoiding unnecessary costs).

## Proposed Changes

### 1. Automation Consolidation
- **Consolidate `send-marketing-drip` and `process-review-invitations`**: Ensure both systems share a unified deduplication layer.
- **Deduplication Logic**: Implement a global check in `supabase/functions/_shared/emailGuard.ts` (or similar) to prevent multiple marketing/automated emails to the same address within a 24-hour window, across all categories.

### 2. Credit Optimization
- **Unified Provider Handling**: Ensure all non-critical emails (newsletters, reminders) strictly respect the `EMAIL_PROVIDER` setting, while critical emails (purchase success) retain the fallback mechanism.
- **Smart Filtering**: Refine triggers to skip emails for users who have already converted or opted out, reducing API calls to Brevo.

### 3. Admin Hub Improvements
- **Unified Log View**: Enhance `AdminMarketingHub.tsx` to show a combined log of all Brevo syncs and sends, helping the user monitor for potential duplicates or credit spikes.
- **Credit Monitor**: Add a dedicated "Brevo Credits" card in the hub (powered by `brevo-account-stats`) to track consumption in real-time.

## Technical Details

### Backend (Edge Functions)
- Update `supabase/functions/_shared/brevo.ts` to include a `checkRateLimit` helper.
- Modify `supabase/functions/process-review-invitations/index.ts` and `supabase/functions/send-marketing-drip/index.ts` to call this helper before sending.

### Frontend
- Update `src/pages/AdminMarketingHub.tsx` to include the global 24h throttle status in the "Safety Checklist".
- Integrate `AdminBrevoAbandoned` more tightly with `AdminMarketingDrips` for a unified monitoring experience.

## Validation Plan
- Trigger multiple drips for the same test email and verify only one is sent within the 24h window.
- Verify Brevo account stats (credits) update correctly in the Admin Hub.
