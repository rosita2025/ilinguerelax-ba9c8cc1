# Plan: Global Stripe Stability and Transaction Reliability

Ensure Stripe remains the most reliable and primary payment method for international transactions, preventing failures and revenue loss due to regional restrictions or gateway instabilities.

## Proposed Changes

### Backend (Edge Functions)

#### 1. `supabase/functions/create-checkout-prueba/index.ts`
- Enhance the `forceUsd` logic to include a broader set of conditions for international stability.
- Add detailed logging for Stripe session creation attempts to help diagnose "unknown" failures in real-time.
- Ensure `adaptive_pricing` is strictly disabled whenever `forceUsd` is active, as this is a common source of regional rejection errors.

#### 2. `supabase/functions/_shared/catalogPricing.ts`
- Audit and expand `RESTRICTED_CURRENCY_COUNTRIES` if any other regions show high failure rates in local currency.
- Ensure the `localTotalFromPricing` function always provides a safe USD fallback if currency conversion or local price lookup fails.

### Frontend (Checkout Components)

#### 3. `src/hooks/useCheckoutMethodsConfig.ts`
- Reinforce the fallback logic so that `stripe_card` is not just enabled, but prioritized when regional metadata is missing or loading slowly.

#### 4. `src/components/checkout/PaymentMethodsGroup.tsx`
- Improve the USD fallback UI: when `isFallingBackToUsd` is true, display a clear, trust-building message (e.g., "Pagando en USD para garantizar la compatibilidad internacional").
- Add a manual "Retry in USD" button if a Stripe error is detected that looks currency-related (already partially implemented, will refine).
- Ensure the `fetchSecret` retry logic handles edge cases where the first attempt might have failed due to transient gateway timeouts.

#### 5. `src/lib/stripeErrorMap.ts`
- Add more specific mappings for Stripe regional errors (e.g., "Currency not supported for this method") to provide better guidance to the user instead of generic errors.

## Technical Details
- **Logic:** The `create-checkout-prueba` function will act as the final arbiter. If a transaction from a "risky" region is initiated, it will ignore the client-requested currency and force USD.
- **Redundancy:** If Stripe's `ui_mode: "embedded_page"` continues to show regional issues, we will implement a configuration flag to switch to a full redirect mode (`ui_mode: "hosted_checkout"`) as a high-reliability alternative.
- **Tracking:** Ensure Meta Pixel and Pinterest events correctly report the final USD amount regardless of the initial local currency displayed to the user.

## Verification Plan
1. **Automated Simulation:** Use Playwright to simulate checkouts from Mexico, Argentina, and Spain, ensuring Stripe loads correctly.
2. **Failure Injection:** Mock a 502 error from dLocal/MercadoPago to verify the frontend correctly falls back to Stripe as the "safe" global option.
3. **Log Review:** Check Edge Function logs for `isRestrictedRetry` flags being triggered.
