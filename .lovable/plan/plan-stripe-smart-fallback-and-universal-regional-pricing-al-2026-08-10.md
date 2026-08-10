# Plan: Stripe Smart Fallback and Universal Regional Pricing Alignment

Implement a "Smart Fallback" for Stripe payments where, if a local currency transaction (Adaptive Pricing) fails due to bank/region restrictions (common in AR, HN, etc.), the system automatically retries in USD. Also ensure regional pricing (USD vs. Local) is consistent across all payment providers (Stripe, dLocal, PayPal, Binance).

## Proposed Changes

### 1. Edge Function: `create-checkout-prueba`
- Re-enable `adaptive_pricing` for all countries (removing the hardcoded block for AR/HN).
- Wrap the Stripe session creation in a try-catch that specifically looks for currency-related errors.
- **Fallback Logic**: If `adaptive_pricing` fails with a known restriction error, retry creating the session with `adaptive_pricing: { enabled: false }` to force USD.
- Update `PaymentMethodsGroup.tsx` to handle the backend retry transparently.

### 2. Shared Logic: `catalogPricing.ts` & `fxRates.ts`
- Ensure `localTotalFromPricing` in `catalogPricing.ts` (used by dLocal/PayPal) correctly handles the distinction between "forced USD countries" and "local currency countries".
- Add a helper `isRestrictedCurrency(country)` to identify countries like Argentina where local currency payments are high-risk or often blocked, to preemptively suggest or fallback to USD.

### 3. Frontend: `PaymentMethodsGroup.tsx`
- Improve error reporting when a payment method fails, showing a user-friendly "Switching to USD for compatibility" message if the fallback triggers.
- Ensure the UI badge (Price Display) matches the final currency that will be sent to the gateway.

### 4. dLocal Go Integration
- Synchronize retry logic in `dlocal-create-payment` to use the same `isRestrictedCurrency` check to decide when to skip local currency attempts entirely for better UX.

## Verification Plan

### Automated Tests
- Mock Stripe API to return `currency_not_supported` for AR and verify the Edge Function retries in USD.
- Verify `catalogPricing` returns correct local amounts for LATAM countries.

### Manual Verification
- Test checkout from an AR/HN IP (via Playwright or header overrides) and confirm Stripe loads in USD while other countries load in local currency.
- Check `/admin/payment-errors` to ensure technical reasons for fallbacks are logged.
