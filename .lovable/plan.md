# Plan: Fix Currency Display in Checkout

The user reported that the checkout is not showing local currency correctly and requested that "moneda local = usd" be added/fixed. Based on the provided image (image-283.png), the checkout summary shows `$13.00` (USD) but lacks the dual currency indicator (`≈ local amount`) or the local currency badge that should appear for international users.

We recently implemented a dual-currency system, but it seems it might be hidden or not triggering correctly in some views, or the user wants to ensure USD is always clearly visible alongside local currency.

## Proposed Changes

### Frontend Enhancements

1. **Ensure Dual Currency Visibility in `OrderSummary.tsx`**
   - Verify why `showLocalRef` might be false for the user.
   - Force the display of the reference currency (USD) even when a local currency is active, or ensure the "≈ USD" label is always present when the primary currency is NOT USD.
   - Adjust the layout to match the user's request for "moneda local = usd" by showing the conversion more clearly.

2. **Standardize Labels in `PaymentMethodsGroup.tsx`**
   - Ensure the `finalPriceLabel` always includes the USD equivalent in a consistent format across all payment methods.

3. **Update Translations in `checkoutUI.ts`**
   - Add a specific label for the USD equivalent if needed (e.g., `inUsdEquivalent`).

### Backend Verification

1. **Verify `catalogPricing.ts` (shared)**
   - Ensure the server-side price resolution is correctly calculating both local and USD totals for all items.

## Technical Details

- **`OrderSummary.tsx`**: Update the `penMode` and `showLocalRef` logic to be less restrictive if the goal is to always show the USD equivalent for clarity.
- **`useLocalCurrency.ts`**: Ensure the hook returns valid USD amounts even when an override is present.

## Validation Plan

1. **Manual Check**: Verify the checkout page with a simulated non-US IP (e.g., Mexico or Peru) to see if the dual currency labels appear.
2. **Visual Audit**: Compare the resulting UI with the user-provided screenshot to ensure the circled areas now show both currencies.
