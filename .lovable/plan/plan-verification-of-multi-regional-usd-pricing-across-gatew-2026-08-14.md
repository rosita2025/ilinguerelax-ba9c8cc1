# Plan: Verification of Multi-Regional USD Pricing across Gateways

The user wants to be sure that the distinct USD prices configured for different regions (LATAM, Global, etc.) are correctly passed to **Stripe**, **dLocal Go**, and **PayPal**.

## Technical Confirmation
- **`catalogPricing.ts`**: The shared logic `pickTierPrice` correctly prioritizes `local_usd_prices` overrides (JSONB) when a currency hint is provided.
- **Stripe**: `create-checkout-prueba` passes the currency hint and uses the resolved unit price.
- **PayPal**: `paypal-create-order` uses `resolveServerPricing` with the currency hint to determine the base USD amount before local conversion.
- **dLocal Go**: `dlocal-create-payment` follows the same pattern, ensuring the "Regional USD" price is the source of truth.

## Proposed Actions
1. **Verification**: Run a Playwright test to simulate a checkout from a specific region (e.g., Mexico) with a configured `local_usd_prices` override and verify that the gateway request contains the correct amount.
2. **Logging**: Add explicit debug logging to the `catalogPricing.ts` function to track when a regional USD override is picked, which will help the user verify behavior in the "View Backend" logs.

## Technical Details
- The logic in `pickTierPrice` (lines 118-133 of `supabase/functions/_shared/catalogPricing.ts`) will be augmented with a `console.log` to provide visibility.
- No functional changes are required as the architecture is already sound, but this adds transparency.
