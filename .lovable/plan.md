# Plan - Fix Checkout Price Discrepancy (C$450 vs C$477)

The user identified a price discrepancy in the checkout for Nicaragua (NIO): the order summary shows **C$450.00**, but the payment buttons (Stripe/Bank Transfer) show **C$477.10**.

## Analysis
- **Base Price:** $13.00 USD.
- **Order Summary Calculation:** Uses `localTotalAmount` which is derived from `sumItemsLocal`. `sumItemsLocal` uses `exchangeRates` from `@/i18n`.
- **Payment Button Calculation:** Uses `totalUsd` (13.00) formatted via `localFormatted` or `formatLocalDirect`.
- **Discrepancy Source:** `exchangeRates["NIO"]` in `@/i18n` likely does not match the multiplier being applied in `localTotalAmount` vs the one in `formatLocalDirect`.
- **Wait, shipping cost!** In `OrderSummary.tsx`, `localTotalAmount` includes `+ shipping`. 
    - `isLatam` is true for Nicaragua (`NI`).
    - `shippingCost` is 9.
    - $13 + $9 = $22.
    - If the user expects C$450 for $13, that's a rate of ~34.6 NIO/USD.
    - If $22 is being converted, C$477.10 / 22 = ~21.6 NIO/USD.
    - Actually, looking at the image:
        - Subtotal: C$450.00
        - Shipping: Free (Digital Delivery)
        - Total: **C$450.00** (This is the order summary)
        - Button: **C$477.10** (≈ $13.00 USD)
- **The Culprit:** The payment buttons are calculating the price based on $13.00 USD using a different conversion rate or logic than the `useLocalCurrency` hook used in the summary.
    - In `PaymentMethodsGroup.tsx`: `localTotalAmount` is used for `localFormatted`.
    - `localTotalAmount` = `localItemsSum.amount * (1 - coupon)`.
    - `localItemsSum` = `sumItemsLocal(...)`.
    - In `useLocalCurrency.ts`, `exchangeRates["NIO"]` is used.
- **Why C$477.10?** 13 * 36.7 = 477.1. 36.7 is likely the rate for NIO in `exchangeRates`.
- **Why C$450.00 in Summary?** The user might have a **manual price override** for NIO or the SKU in the database is set to C$450.
    - `sumItemsLocal` honors `resolver` (overrides).
    - `OrderSummary.tsx` uses `localTotalAmount` which uses `sumItemsLocal`.
    - `PaymentMethodsGroup.tsx` *also* uses `sumItemsLocal` to calculate `localTotalAmount`.
    - **Wait!** In `PaymentMethodsGroup.tsx` (line 370), `localFormatted` uses `formatLocalDirect(localTotalAmount, countryCode)`.
    - `localTotalAmount` in `PaymentMethodsGroup` (line 352) does **not** include shipping. 
    - The summary says "C$450.00".
    - If `localTotalAmount` is C$450, then `formatLocalDirect(450, "NI")` should return "C$450,00".
    - However, the button shows "C$477,10".
- **Real Cause:** In `PaymentMethodsGroup.tsx`, the `localFormatted` variable is being calculated at line 368:
    ```typescript
    const localFormatted = local.loading || showUsdOnly 
      ? `USD $${totalUsd}` 
      : (local.formatted || formatLocalDirect(localTotalAmount, countryCode));
    ```
    If `local.formatted` exists, it uses it. `local` comes from `useLocalCurrency(total)`.
    `total` is the USD amount.
    If there is a manual override for the product in NIO, `useLocalCurrency` should pick it up.
    BUT, `total` is the *discounted* USD total. If the override is set for the *base* price, `useLocalCurrency` might be applying the rate to the discounted total instead of using the local override correctly when a discount is present.

## Proposed Changes

1. **Synchronize Price Calculation:**
   - Ensure `PaymentMethodsGroup.tsx` uses the exact same `localTotalAmount` logic as `OrderSummary.tsx`.
   - Specifically, ensure shipping is handled consistently if it's not a digital product (though the image shows digital).
   - Investigate why `local.formatted` (from `useLocalCurrency`) might differ from the value calculated via `sumItemsLocal`.

2. **Fix `PaymentMethodsGroup.tsx` Price Label:**
   - The button label calculation needs to be identical to the summary's "Total" display.
   - I will modify `PaymentMethodsGroup.tsx` to use the pre-calculated `localTotalLabel` or equivalent logic that matches `OrderSummary.tsx`.

3. **Check `exchangeRates` and Overrides:**
   - Verify if NIO has a specific rate or if the product has a manual override that isn't being reflected in the payment buttons.

## Technical details
- Edit `src/components/checkout/PaymentMethodsGroup.tsx` to align `localTotalAmount` and `localFormatted` with the logic in `OrderSummary.tsx`.
- Update `localTotalAmount` in `PaymentMethodsGroup.tsx` to handle shipping and discounts exactly as the summary does.

## User Review Required
> [!IMPORTANT]
> The discrepancy is caused by the payment buttons calculating the NIO price using the standard exchange rate (~36.7) while the summary uses a different value (likely a manual override or a different rate). I will unify the logic so the buttons always match the summary.
