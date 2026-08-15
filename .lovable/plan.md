# Plan: Fix Sync Issues in Orders Admin

The user reports that two purchases (Stripe and Hotmart) from today are missing or not synchronized in `/admin/orders` (which maps to `AdminPurchasesStatus.tsx` in the frontend).

## Analysis
1.  **Stripe**: A purchase for `ing.jaguilarreyes@yahoo.es` (`ILR-ST-17QH7TNP`) exists in the `funnel_events` table (created `2026-08-14 20:23:54`), but the `list-purchases-status` function might be filtering it out due to rigid `event_data` or `referrer` checks.
2.  **Hotmart**: Recent Hotmart purchases (e.g., `2026-08-10`) are in `funnel_events` with `referrer: hotmart-webhook`. The `list-purchases-status` function uses a complex `.or()` filter that might be missing certain variations of the webhook payload or manual indexing.
3.  **Mercado Pago**: Webhook alerts show `401 Unauthorized (Firma HMAC inválida)` errors, suggesting a secret mismatch or hashing issue in the `mercadopago-webhook` function.
4.  **Backend Inconsistency**: The `list-purchases-status` function is trying to read a non-existent `event_data` column in `funnel_events` for Stripe/Hotmart, which causes it to return an error or skip results. The data is actually stored in the `referrer` column as a JSON string.

## Proposed Changes

### 1. Backend (Edge Functions)

#### `list-purchases-status`
- Fix the SQL queries to handle the fact that `event_data` doesn't exist on `funnel_events`; use `referrer` instead.
- Improve the logic for parsing `referrer` JSON strings to extract order details.
- Loosen the Hotmart/Stripe filters to ensure all relevant events are captured.

#### `mercadopago-webhook`
- Improve signature verification logging to help diagnose the `401` errors.
- Ensure the `MERCADOPAGO_WEBHOOK_SECRET` is correctly utilized.

#### `stripe-webhook` & `hotmart-purchase-pixel`
- Ensure consistent tagging of events in `funnel_events` (e.g., setting the `provider` column explicitly if available).

### 2. Frontend

#### `AdminPurchasesStatus.tsx`
- Add a "Sync Status" indicator that shows the timestamp of the last successful fetch.
- Improve error reporting when the function fails.

## Technical Details
- Update `supabase/functions/list-purchases-status/index.ts` to use `referrer` instead of `event_data` for `funnel_events` queries.
- Normalize `funnel_events.referrer` parsing: `JSON.parse(r.referrer || '{}')`.
- Add `provider` column check to `list-purchases-status` since the table schema now includes it.

## Verification Plan
- Run a database query via `supabase--read_query` to verify that the `funnel_events` records for the missing orders are now correctly structured.
- Call the `list-purchases-status` function manually via `curl` (using the admin key) to verify it returns the Stripe and Hotmart orders in the JSON response.
- Inspect the admin panel to confirm the "Missing" orders appear in the list.
