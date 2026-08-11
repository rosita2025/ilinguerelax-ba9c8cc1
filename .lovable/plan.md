# Plan: Global Stripe Availability for Latin America

The goal is to ensure that Stripe (Card/Apple Pay) is always available as a primary payment option globally, specifically addressing the concern that customers in Latin America might be forced into cash methods when they prefer cards or Apple Pay.

## Technical Details

- **Stripe Global Enablement**: Verify and ensure that the `useCheckoutMethodsConfig` hook and `PaymentMethodsGroup` component do not inadvertently hide Stripe for LatAm countries.
- **Payment Method Ordering**: Confirm that Stripe (Card/Apple Pay) is prioritized in the list of payment methods to encourage its use over cash/transfer methods.
- **Stripe Iframe Resilience**: Ensure the Stripe `embedded_page` mode works correctly for all LatAm regions without currency mismatch errors by maintaining the forced USD strategy for global gateways.

## Proposed Changes

### Frontend
- **useCheckoutMethodsConfig.ts**: Confirm the `DEFAULT_ORDER` has `"stripe"` at the beginning.
- **PaymentMethodsGroup.tsx**:
    - Ensure `stripe_card` is always checked for availability.
    - Verify that Apple Pay and Google Pay badges are correctly shown when Stripe is active.
    - Confirm the `showUsdOnly` logic allows localized pricing for the initial view while correctly handling the gateway's requirement for USD.

### Backend (Edge Functions)
- **create-checkout-prueba**: Keep the logic that allows Stripe to manage valid methods automatically by omitting explicit `payment_method_types` when appropriate, ensuring card payments are always an option.

## Validation Plan

- Use Playwright to simulate visits from multiple LatAm countries (e.g., MX, CO, AR, BR).
- Verify that "Tarjeta" (Stripe) appears at the top or near the top of the payment list.
- Confirm the Stripe iframe loads correctly after selecting the method and filling buyer info.
