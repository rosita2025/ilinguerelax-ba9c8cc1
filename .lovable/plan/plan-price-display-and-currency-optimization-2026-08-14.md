# Plan: Price Display and Currency Optimization

Ensure local currency is prominently displayed across the checkout process, especially when using Stripe and other global gateways, while maintaining USD as a clear reference point.

## Proposed Changes

### Checkout Components

#### [OrderSummary.tsx](src/components/checkout/OrderSummary.tsx)
- Modify the total display logic to ensure the local currency reference is always visible, even in USD-native regions.
- Ensure `showLocalRef` correctly represents the dual-currency requirement.
- Adjust the summary labels to clearly indicate that the price is being converted to the user's local currency.

#### [PaymentMethodsGroup.tsx](src/components/checkout/PaymentMethodsGroup.tsx)
- Update the `usdSuffix` logic to be more descriptive, ensuring it shows the local amount and the USD equivalent clearly on every payment button.
- Remove hardcoded exclusions for global gateways that might prevent the local currency from appearing.
- Ensure the `finalPriceLabel` follows the pattern "Local Currency Amount (≈ $USD Amount)".

### Currency Utilities

#### [useLocalCurrency.ts](src/hooks/useLocalCurrency.ts)
- Verify that currency detection and formatting remain consistent across the app.
- Ensure that `formatLocalDirect` correctly handles all regional currencies including those with zero decimals.

## Technical Details
- Use `useLocalCurrency` hook to fetch both the local amount and the USD amount for comparison.
- Maintain the internal consistency between the `OrderSummary` and `PaymentMethodsGroup` to avoid user confusion.
- Ensure compliance with Stripe Adaptive Pricing requirements by showing both currencies when applicable.

## Verification Plan
- **Manual Verification:** Test the checkout page using a VPN or local IP simulation for different regions (MX, PE, US, ES).
- **Component Audit:** Verify that both `OrderSummary` and `PaymentMethodsGroup` show matching totals in both currencies.
- **Pixel Tracking:** Ensure that Meta Pixel events still receive the normalized USD value for accurate reporting.
