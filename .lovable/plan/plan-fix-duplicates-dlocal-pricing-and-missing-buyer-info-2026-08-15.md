# Plan: Fix Duplicates, dLocal Pricing, and Missing Buyer Info

The admin panel at `admin/purchases-status` currently shows duplicate entries, incorrect dLocal amounts for Peru, and missing buyer information for some regions like Colombia. This plan will deduplicate the data, improve buyer info extraction, and ensure correct currency display.

## Proposed Changes

### Backend (Supabase Edge Functions)

#### 1. Update `supabase/functions/list-purchases-status/index.ts`
- **Global Deduplication**: Use a `Map` to group records by `provider` + `transaction`.
- **Status Prioritization**: When merging duplicates, prioritize statuses in this order: `approved` > `pending` > `refused` > `abandoned`.
- **Enhanced Data Extraction**:
    - Add `name` to the row object by extracting it from payloads (`payerName`, `customer_name`, `buyer.name`, etc.).
    - Improve `email` extraction from nested payload objects.
    - Standardize `amount` and `currency`: prefer local currency values from the payload if they differ from the base USD value, to avoid showing USD prices with local currency symbols.
- **Deduplicate `internal_cart`**: Ensure internal cart abandonments are skipped if a matching payment attempt (Stripe, dLocal, etc.) exists for the same email within a recent timeframe.

#### 2. Update `supabase/functions/dlocal-webhook/index.ts`
- Ensure the `email` column in `funnel_events` is populated (after ensuring it exists in the schema).
- Include the payer's name in the `referrer` payload for `funnel_events` so the admin can display it.

#### 3. Database Schema
- Ensure `email` column exists in `funnel_events` (via migration).
- Add `name` column to `funnel_events` to simplify future queries.

### Frontend

#### 1. Update `src/pages/AdminPurchasesStatus.tsx`
- **Interface Update**: Add `name` and `local_amount`/`local_currency` to the `Row` type.
- **UI Update**:
    - Display the customer's name next to the email.
    - Clearly show if an amount was converted or is a local override.
    - Improve the "Duplicates" handling by showing a "Merged" badge if multiple events were combined.

## Technical Details
- **Deduplication Key**: `provider:transaction` (or `provider:email` for abandonments without transactions).
- **Amount Logic**: If `payload.localAmount` exists, use it. Otherwise, fallback to `r.value`.

## Verification Plan
- **Edge Function Test**: Run `list-purchases-status` locally or via Supabase CLI and verify that duplicate events (e.g., `InitiateCheckout` + `Purchase`) for the same transaction ID are merged into a single `approved` row.
- **Data Integrity**: Check that a dLocal Peru order for $16.65 USD correctly displays as its PEN equivalent (or whatever the fixed local price is) rather than "16.65 PEN".
- **Admin Review**: Manually inspect the `/admin/purchases-status` page to confirm names are appearing for Colombia/LatAm customers and duplicates are gone.
