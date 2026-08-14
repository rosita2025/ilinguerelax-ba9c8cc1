# Plan: Unified USD and Local Currency Display Optimization

Optimize the checkout UI to ensure clear visibility of the local currency total and its USD equivalent across all payment methods, addressing user concerns about price transparency ("no tengo dolares").

## Proposed Changes

### 1. Unified Local Currency Display in `PaymentMethodsGroup.tsx`
- Ensure `isActuallyShowingLocal` is `true` for all regions, regardless of whether the primary gateway is global (Stripe, PayPal) or local (Yape, Plin).
- Modify the `finalPriceLabel` logic to consistently show `Local Amount (≈ $USD)` across all payment buttons.
- Remove the `showUsdOnly` restriction that was hiding local amounts for Stripe in non-LATAM regions.

### 2. Enhanced Transparency in `OrderSummary.tsx`
- Ensure the reference line `≈ $USD` is visible even when the visitor's local currency is USD (showing `≈ $TOTAL USD`).
- Standardize the display of the grand total to show the local amount as the primary figure and the USD equivalent as a sub-label.

### 3. Local Price Formatting in `useLocalCurrency.ts`
- Verify that `formatLocalDirect` correctly handles all regional currencies defined in the `i18n` layer.

## Technical Details

### `src/components/checkout/PaymentMethodsGroup.tsx`
- Update `isActuallyShowingLocal` to remove exclusions for global methods.
- Update `usdSuffix` logic to handle USD-native regions gracefully.
- Remove hardcoded country checks (`PE`, `MX`, `ES`) from `showUsdOnly`.

### `src/components/checkout/OrderSummary.tsx`
- Update the mobile collapsible summary and the desktop total section to consistently show the dual-currency reference.

## Verification Plan

### Manual Verification
1. Open the checkout from different simulated IP regions (e.g., USA, Mexico, Peru, Spain).
2. Confirm that every payment button (Stripe Card, PayPal, dLocal, Yape) shows the local currency followed by the `(≈ $USD)` reference.
3. Verify that the Order Summary shows the same dual-currency mapping.

### Automated Verification
- Use `check_currency_visibility.py` with Playwright to simulate multiple countries and verify that `textContent` for price elements contains both the local currency symbol and the `USD` string.
