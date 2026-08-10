# Plan: Unified USD for Global Gateways (Stripe & dLocal)

The user wants Stripe and dLocal to always use USD to avoid regional currency failures and provide a clearer pricing experience ("USD to PEN" confusion).

## 1. Backend: Edge Function Hardening
- **Stripe ()**:
  - Always set `currency: "usd"`.
  - Always set `adaptive_pricing: { enabled: false }`.
  - Remove recursive retry logic for restricted currencies as it's no longer needed (always USD).
- **dLocal ()**:
  - Always set `startCurrency: "USD"` and `startAmount: calculatedUsd`.
  - Keep fallbacks only as a last-resort safety measure.

## 2. Frontend: Pricing & UI Alignment
- **Checkout Store ()**:
  - Add `selectedPaymentMethod` to the store to allow the `OrderSummary` to reflect the correct currency for the selected method.
- **Payment Methods ()**:
  - Update `priceBadge` and UI labels to show USD when Stripe, dLocal, PayPal, or Binance are selected.
  - Inform the user explicitly when a payment will be processed in USD (especially in countries like Peru).
  - Sync the selected method to the store.
- **Order Summary ()**:
  - React to the `selectedPaymentMethod` from the store.
  - Switch the main total display to USD if a global gateway is selected, avoiding the "2 buttons/prices" confusion.

## 3. Validation
- Verify Stripe creation always uses USD.
- Verify dLocal creation always uses USD.
- Verify the checkout total changes from local currency (e.g., PEN) to USD when selecting Stripe/dLocal.
