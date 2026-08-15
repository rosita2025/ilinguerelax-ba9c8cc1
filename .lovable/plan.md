# Plan: Sync Abandoned Carts with Accurate Buyer Data

The goal is to ensure that abandoned cart events (`internal_cart`) in the admin dashboard correctly display buyer names and emails, even if the user only partially filled out the form. We will also ensure that these events are consistently captured and deduplicated against actual purchases.

## Technical Details

- **Database**:
  - `persistent_carts`: Stores the authoritative state of open carts per email, including `buyer` (JSONB with name/phone) and `last_activity`.
- **Backend (`list-purchases-status`)**:
  - Update the `internal_cart` loop to correctly extract `name` and `email` from the `buyer` JSONB field in `persistent_carts`.
  - Ensure the deduplication logic correctly merges `internal_cart` events with later `approved` payments from other providers (Stripe, Hotmart, etc.) to prevent double-counting.
- **Frontend (`BuyerInfoForm.tsx`)**:
  - The form already triggers `trackAbandonedCheckoutNow` on `onBlur`. We will verify that it sends the most up-to-date data from the local store.
- **Edge Function (`track-abandoned-checkout`)**:
  - Verify that it correctly updates the `buyer` object in `persistent_carts` during the upsert.

## Proposed Changes

### Backend

#### [list-purchases-status] `supabase/functions/list-purchases-status/index.ts`
- Fix the `internal_cart` processing loop to pull `name` from `r.buyer.name` or `r.buyer.fullName`.
- Refine the deduplication logic to ensure that an `internal_cart` event is replaced by an `approved` transaction if they share the same email.

### Edge Functions

#### [track-abandoned-checkout] `supabase/functions/track-abandoned-checkout/index.ts`
- Ensure the `buyer` metadata is correctly formatted during the `persistent_carts` upsert so it matches the extraction logic in the dashboard.

## Validation Plan
1. Manually trigger an abandoned cart by filling out the name and email fields in the checkout preview and then navigating away.
2. Verify in the Admin Purchases Dashboard (`/admin/purchases-status`) that the "Abandonado" entry appears with the correct name and email.
3. Simulate a purchase with the same email and verify that the abandoned cart entry is superseded or hidden by the approved purchase.
