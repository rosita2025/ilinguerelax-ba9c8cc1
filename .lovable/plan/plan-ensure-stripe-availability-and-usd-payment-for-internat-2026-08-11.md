# Plan: Ensure Stripe availability and USD payment for international transactions

The user wants to ensure Stripe is working flawlessly for international payments, specifically requesting to prioritize USD when necessary to avoid regional payment failures.

## User Review Required

> [!IMPORTANT]
> To ensure international payments work without errors (like the previous ones in Mexico/Ecuador), the system will force USD for Stripe transactions when a regional currency fails or isn't fully supported. This is the most reliable way to handle "pagos internacionales" without technical errors.

## Proposed Changes

### Checkout Logic (Frontend)
- **Stripe Priority**: Ensure Stripe "Tarjeta" is always visible for international regions in `src/hooks/useCheckoutMethodsConfig.ts` and `src/components/checkout/PaymentMethodsGroup.tsx`.
- **Force USD**: Update `PaymentMethodsGroup.tsx` to explicitly fallback to USD if a regional currency checkout session fails with a currency-related error.
- **Visual Feedback**: Show a clear notice when paying in USD for compatibility (e.g., "Pagando en USD por compatibilidad / Transacción internacional").

### Edge Functions (Backend)
- **Stripe Session Configuration**: In `supabase/functions/create-checkout-prueba/index.ts`, ensure `adaptive_pricing` is disabled when a fallback to USD is requested.
- **International Support**: Maintain the removal of `payment_method_types` to allow Stripe to automatically present the best methods (Apple Pay, Google Pay, Cards) for USD in the buyer's country.

## Technical Details

### `src/components/checkout/PaymentMethodsGroup.tsx`
- Refine the `isFallingBackToUsd` logic to be more proactive for countries with historically unstable local currency gateways in Stripe.
- Ensure the `stripeOptions` memoization correctly handles the fallback state to prevent iframe flicker.

### `supabase/functions/create-checkout-prueba/index.ts`
- Ensure the `currency: "usd"` is strictly enforced when the `isRestrictedRetry` flag is sent from the frontend.
- Log specific Stripe error codes to `order_events` or a dedicated log table for better debugging of international failures.

## Validation Plan
- Simulate a checkout from a country with currency restrictions (e.g., Honduras or Argentina) and verify it correctly prompts for USD via Stripe.
- Verify that Stripe's `embedded_page` mode loads correctly with Apple Pay/Google Pay available for USD transactions.
