# Plan: Global Stripe Stability and USD Fallback

Ensure Stripe payments work flawlessly worldwide by implementing robust fallback mechanisms and maintaining a stable configuration for international transactions.

## User Review Required

> [!IMPORTANT]
> The system will automatically switch to USD and disable "Adaptive Pricing" only if a regional currency transaction fails or if the country is known to have banking restrictions (e.g., Honduras). This ensures the payment goes through even when local currency processing is unstable.

## Proposed Changes

### 1. Robust Fallback in Payment Methods Configuration
- **File:** `src/hooks/useCheckoutMethodsConfig.ts`
- Ensure that if no specific regional configuration is found in the database, the system defaults to a "GLOBAL" state where `stripe_card` is explicitly enabled. This prevents the checkout from appearing empty for users in unconfigured regions.

### 2. Intelligent USD Fallback in Checkout Logic
- **File:** `src/components/checkout/PaymentMethodsGroup.tsx`
- Implement a recursive retry logic when creating a Stripe session:
    - If the initial attempt (potentially in local currency) fails with a currency-related error or a gateway rejection.
    - Automatically trigger a second attempt forcing the currency to **USD**.
    - Inform the user visually with a subtle message: "Switching to USD for international compatibility."

### 3. Server-Side Enforcement of Stability
- **File:** `supabase/functions/create-checkout-prueba/index.ts`
- Update the Edge Function to handle the `isRestrictedRetry` flag.
- When this flag is active (or for restricted countries like HN), explicitly set `adaptive_pricing: { enabled: false }` and `currency: "usd"`. This bypasses Stripe's automatic currency conversion which can sometimes trigger bank declines in high-risk or restricted regions.

### 4. Expansion of Restricted Countries List
- **File:** `supabase/functions/_shared/catalogPricing.ts`
- Audit and potentially expand the `RESTRICTED_CURRENCY_COUNTRIES` list to include countries where local currency processing is notoriously unreliable for international digital goods.

## Technical Details
- **Adaptive Pricing:** Disabling this in Stripe's `CheckoutSession` ensures the user is charged exactly the USD amount defined in the catalog, avoiding discrepancies caused by mid-checkout exchange rate fluctuations.
- **Recursive Retry:** Using a state variable `isFallingBackToUsd` to track the fallback state and update the UI badges/pricing accordingly.

## Validation Plan
- Simulate a failed local currency transaction for a restricted region (e.g., HN or AR) and verify the automatic switch to USD.
- Verify that Stripe always loads at least the credit card option for "GLOBAL" users.
- Check that the Meta Pixel still receives the correct USD value even when a local display currency is used.
