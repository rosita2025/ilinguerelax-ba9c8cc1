# Plan: Admin Purchase Status & Webhook Data Enrichment

The user reported that the `/admin/purchases-status` dashboard and payment webhooks are missing customer details (name, country) for some providers (specifically Stripe) and that some Hotmart amounts or sync logic might be inaccurate or incomplete. We will update the webhooks and the aggregation function to ensure maximum data coverage.

## Proposed Changes

### Backend (Edge Functions)

#### 1. `list-purchases-status` Edge Function
- Improve field extraction for Stripe: Ensure `name` and `country` are pulled from all possible locations in the `funnel_events.referrer` JSON.
- Improve Hotmart sync: Validate the mapping of statuses and ensure transaction codes are consistently extracted.
- Add "Reason" column data for Stripe failures by parsing `failure_message` or `last_payment_error`.

#### 2. `stripe-webhook` Edge Function
- Ensure the `name`, `email`, and `country` are explicitly saved in the `funnel_events` table columns (not just hidden in the `referrer` JSON).
- Log `order_events` for failures so the dashboard can show "Why it failed".

#### 3. `mercadopago-webhook` & `dlocal-webhook`
- Standardize the way `name` and `country` are persisted to `funnel_events` to match the improved Stripe logic.
- Ensure the `provider` column is always set correctly.

#### 4. `hotmart-purchase-pixel`
- Verify amount and currency extraction.
- Ensure `name` and `email` are explicitly saved to the top-level columns in `funnel_events`.

### Frontend

#### 1. `AdminPurchasesStatus.tsx`
- Add a visible "Country" (País) column/badge to the list.
- Ensure the "Name" (Nombre) is displayed even if it's deeply nested in the payload.
- Improve the "Failed Step" display to be more descriptive for technical errors.

## Technical Details

- **Table**: `public.funnel_events` (columns: `name`, `email`, `country`, `provider`, `value`, `currency`, `referrer`).
- **Logic**: Use the `referrer` JSON as a source of truth when columns are null, but update webhooks to populate columns moving forward.
- **Deduplication**: Keep the existing status-priority deduplication but ensure it uses the cleaned email/transaction keys.

## Validation Plan
- Test Stripe webhook simulation (via logs/payloads) to see if name/country now populates the admin view.
- Verify Hotmart sync by checking the `hotmart-purchase-pixel` execution logs against the dashboard.
- Confirm the country code is visible in the admin UI for recent entries.
