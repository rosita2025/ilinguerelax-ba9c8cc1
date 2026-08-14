# Plan: Currency Conversion Breakdown in Checkout

This plan adds a detailed conversion breakdown to the checkout screen. It allows customers to see the base USD price, the applied exchange rate, and any regional adjustments (discounts) applied to lower prices in their local currency.

## User Review Required

> [!IMPORTANT]
> The breakdown will appear automatically in the order summary whenever a local currency (non-USD) is detected. It explicitly mentions regional adjustments for LATAM and other regions where prices are lowered to remain accessible.

- The breakdown will show:
    - Base Price in USD
    - Real-time Exchange Rate
    - Regional Adjustment (if the price was lowered for that region)
    - Final Local Price

## Technical Details

### Localization and UI
- **`src/i18n/checkoutUI.ts`**: Add new translation keys for breakdown labels in English, Spanish, Portuguese, and French.
- **`src/hooks/useLocalCurrency.ts`**: Export a new `useCurrencyBreakdown` hook that calculates these values consistently.
- **`src/components/checkout/OrderSummary.tsx`**: Render the breakdown below the total price using a clean, dashed-border section.

### Logic
- The breakdown uses the same logic as the payment gateways to ensure the numbers match exactly.
- If a product has a `local_usd_prices` override that is lower than the base price, it flags it as a "Regional Adjustment".

## Validation Plan
- Verify the checkout page shows the breakdown for a non-USD country (e.g., Colombia).
- Confirm the numbers (USD * Rate = Local) add up correctly.
- Check that the breakdown is hidden when the currency is USD.
- Ensure the translations update correctly when switching languages.
