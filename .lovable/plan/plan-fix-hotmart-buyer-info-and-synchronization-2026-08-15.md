# Plan - Fix Hotmart Buyer Info and Synchronization

The user reported that buyer names from Hotmart are not appearing in the admin dashboard (`/admin/purchases-status`) for transaction `HP1413567978`. My investigation shows that `funnel_events` for Hotmart often have `email` and `name` set to `null` because the webhook handler might not be extracting them correctly from the payload, or the deduplication logic in the admin aggregator is filtering them out.

## Proposed Changes

### Backend (Edge Functions)

#### 1. `hotmart-purchase-pixel`
- Refine name and email extraction to handle both `body.data` (V2 API) and flat `body` structures.
- Ensure `email` and `name` columns in `funnel_events` are explicitly populated during insertion.
- Add fallback for `country` from `buyer.address`.

#### 2. `list-purchases-status`
- Improve Hotmart row mapping to check deeper into the `payload` JSON if the top-level `email`/`name` columns are missing.
- Refine the deduplication logic to ensure that an event with a name/email (like a `Purchase`) always preserves that data when merged with a previous event (like `InitiateCheckout`) that might have lacked it.
- Fix the unique key for Hotmart to handle varying ID lengths and suffixes (like `C1`, `C2`).

### Frontend

#### 1. `AdminPurchasesStatus.tsx`
- Ensure the name display uses the best available field from the row object or the underlying payload as a last resort.

## Technical Details

- **Table**: `funnel_events`
- **Key Fields**: `name`, `email`, `session_id` (transaction code), `referrer` (stores full payload).
- **Issue**: Hotmart webhooks sometimes send different structures. The current code might miss `buyer.name` vs `buyer_name`.
- **Deduplication**: We will use the first 12 characters of the Hotmart transaction ID for the key to ensure consistent grouping of related purchase events.

## Validation Plan
- I will verify the code changes by inspecting the `list-purchases-status` output via `adminInvoke` (if possible) or by reviewing the logic against known Hotmart payload structures.
- I will check if `HP1413567978` starts appearing with a name once the logic is deployed and a fresh sync is triggered.
