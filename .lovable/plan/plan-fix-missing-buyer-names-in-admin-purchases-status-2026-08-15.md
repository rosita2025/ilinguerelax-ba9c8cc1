# Plan: Fix Missing Buyer Names in Admin Purchases Status

The user reports that buyer names are missing in the `/admin/purchases-status` dashboard. This dashboard aggregates data from several providers (Stripe, Hotmart, Mercado Pago, PayPal, dLocal, and internal carts). The root cause likely stems from inconsistent data extraction in the `list-purchases-status` edge function or missing top-level column population in the respective webhooks.

## Proposed Changes

### Backend (Edge Functions)

#### 1. `list-purchases-status`
- Review and reinforce the extraction logic for the `name` field across all provider loops.
- Ensure fallback mechanisms (checking metadata, payload, and `buyer` objects) are robust.
- Standardize name extraction for `internal_cart` (checking `buyer.fullName` vs `buyer.name`).

#### 2. Webhooks (`stripe-webhook`, `hotmart-purchase-pixel`, `mercadopago-webhook`, `dlocal-webhook`)
- Ensure that when a `funnel_events` record is inserted, the `name` column is explicitly populated alongside `email`.
- For Stripe, verify `customer_details.name` or `metadata.customer_name` is being captured.
- For Mercado Pago, ensure `payer.first_name` and `payer.last_name` are joined and saved.
- For Hotmart, verify `buyer.name` is captured.

## Technical Details
- The `funnel_events` table has dedicated `email` and `name` columns.
- The `list-purchases-status` function currently tries to extract names from `r.name` (the column) or the `referrer` JSON payload.
- I will consolidate the name extraction into a helper or ensure consistent application in the main loops.

## Validation Plan
1. Check the `funnel_events` table data for recent events to see if `name` is null.
2. Verify that the updated `list-purchases-status` function correctly extracts names from existing payloads.
3. Test a mock webhook call (if possible) to ensure new events populate the top-level `name` column.
