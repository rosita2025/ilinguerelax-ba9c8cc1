# Plan: Fix Marketing Hub Data Visibility

The user is reporting that the Marketing Hub (`/admin/marketing-drips`) is appearing empty ("está vacío") despite recent activity. Initial investigation shows that while `newsletter_drip_sends` contains records, `marketing_drip_sends` is empty and `brevo_sync_logs` has no recent entries for abandoned checkouts (last one was August 11th).

## Proposed Changes

### Backend (Edge Functions)

#### 1. `list-marketing-drips`
- **Audit data aggregation**: Verify that the function is correctly joining and filtering records.
- **Timezone adjustment**: Ensure the "Today" calculation correctly handles UTC vs. Peru Time (UTC-5) to not miss late-night records.
- **Expand Source Coverage**: Check if there are other event types in `brevo_sync_logs` that should be visible as "Marketing Activity" but are currently filtered out.

#### 2. `track-abandoned-checkout`
- **Fix Data Gaps**: Investigate why recent abandoned checkouts aren't appearing in `brevo_sync_logs`.
- **Validation**: Ensure that checkout attempts from all sources (Stripe, Hotmart, Manual) are being tracked.

### Frontend

#### 1. `AdminMarketingDrips.tsx`
- **Loading State UI**: Ensure the "No se encontraron registros" message only appears after a successful empty response, not while loading or on error.
- **Sync Trigger**: Improve the "Procesar Colas" feedback to show immediate progress.

## Technical Details

- **Database**:
    - `marketing_drip_sends`: Records for post-purchase sequences.
    - `newsletter_drip_sends`: Records for the 9-step newsletter sequence.
    - `brevo_sync_logs`: Centralized logs for Brevo/Marketing API interactions (abandoned carts, etc.).
- **Permissions**: Verify that `authenticated` users (admins) have sufficient RLS permissions to view these logs via the Edge Function (which uses `service_role`).

## Verification Plan

### Automated Tests
- Run `vitest` on `useAbandonedCheckoutTracker.ts` if mocks are available.
- Use `supabase--curl_edge_functions` to verify that `list-marketing-drips` returns data when called with a valid admin key.

### Manual Verification
- Simulate a checkout to trigger `track-abandoned-checkout`.
- Check the Admin Marketing Hub to confirm the new entry appears.
- Verify that statistics (KPI cards) update correctly.
