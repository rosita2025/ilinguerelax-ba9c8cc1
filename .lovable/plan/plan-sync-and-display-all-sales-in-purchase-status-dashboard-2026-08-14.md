# Plan: Sync and Display All Sales in Purchase Status Dashboard

The user is reporting that the Purchase Status dashboard (`/admin/purchases-status`) is showing no results even though they have recent sales in Stripe and Hotmart. My investigation shows that the dashboard is empty because it only scans the most recent 200-300 events and the mapping logic for Hotmart and Stripe was too restrictive. The user has requested a historical sync of all past data.

## User Review Required

> [!IMPORTANT]
> A historical sync of all data will process all logs from the beginning of the project. This might take a few moments to load the first time, but I will optimize the query to ensure the dashboard remains fast.

## Proposed Changes

### Backend (Edge Functions)
- **`list-purchases-status`**: 
    - Increase the `take` limit to allow retrieving more historical data.
    - Broaden the mapping logic for **Hotmart** to include `Purchase` and `InitiateCheckout` events (case-insensitive) across both `event_data` and `referrer` fields.
    - Improve **Stripe** detection by checking both `funnel_events` (where `event_data->provider` is 'stripe') and `referrer` JSON strings for historical events.
    - Map `cancelled`, `expired`, and `failed` statuses more accurately to show "Rechazados" and "Cancelados" counts as requested.

### Frontend (Admin Dashboard)
- **`AdminPurchasesStatus.tsx`**:
    - Add a "Sync History" indicator while loading.
    - Ensure the KPI counters correctly reflect the full dataset, not just the filtered view.

## Verification Plan
1. **Manual Inspection**: Verify `funnel_events` contains records for Stripe and Hotmart using `supabase--read_query`.
2. **Dashboard Verification**: Use the admin panel to trigger a reload and verify that the Approved/Rejected counts are no longer zero.
3. **Status Check**: Verify that "Recent sales" from today (as mentioned by the user) appear at the top of the list.
