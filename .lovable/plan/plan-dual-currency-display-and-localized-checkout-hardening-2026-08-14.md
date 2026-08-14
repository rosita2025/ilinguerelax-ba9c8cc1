# Plan: Dual Currency Display and Localized Checkout Hardening

Implement a unified dual-currency display (Local Currency ≈ USD) across the checkout experience and ensure payment gateways (Stripe, PayPal, dLocal) prioritize processing in local currency whenever supported.

## User Review Required

> [!IMPORTANT]
> - **Dual Display**: All prices will now show `Local Currency ≈ $USD` (e.g., `MXN 360 ≈ $18.00 USD`).
> - **Payment Gateways**: We will update backend logic to attempt local currency processing first. If a gateway rejects a specific local currency (e.g., Argentine Peso on Stripe), it will automatically fallback to USD to ensure the sale is completed.
> - **Peru (PEN)**: Per existing business rules, Soles (PEN) remains the primary native currency for Peru and will not show a USD approximation unless explicitly forced by a global gateway.

## Technical Details

### Frontend Changes

- **`OrderSummary.tsx`**: Update the total and subtotal displays to include the `≈ $USD` reference when a local currency is active.
- **`PaymentMethodsGroup.tsx`**: Update "Buy Now" and "Checkout" button labels to include the dual currency reference (e.g., `Pagar con Tarjeta · MXN 360 (≈ $18.00 USD)`).
- **`i18n/index.ts`**: Verify `AMBIGUOUS_DOLLAR_CURRENCIES` correctly triggers ISO prefixes (MXN, ARS, etc.) to prevent confusion with USD "$".

### Backend & Edge Functions

- **`supabase/functions/_shared/catalogPricing.ts`**: Ensure server-side pricing resolution correctly handles local overrides and provides consistent USD equivalents for all gateways.
- **`supabase/functions/paypal-create-order/index.ts`**: Update to pass the local currency amount to PayPal when the currency is in the `PAYPAL_SUPPORTED` set.
- **`supabase/functions/create-checkout-prueba/index.ts` (Stripe)**: Adjust the `adaptive_pricing` and `currency` logic to favor local currency while maintaining the "Restricted Country" fallback to USD for stability in high-risk regions.
- **`supabase/functions/dlocal-create-payment/index.ts`**: Refine the attempt sequence to prioritize the local currency rail before falling back to USD.

## Verification Plan

- **Manual Visual Check**: Open `/checkouts/patrones-ingles` from a Mexican IP (simulated) and verify the order summary shows `MXN ≈ USD`.
- **Gateway Simulation**:
    - Verify Stripe session creation includes the correct local currency.
    - Verify PayPal order creation receives local currency for supported countries (MX, BR).
- **Regression Check**: Ensure Peru (PEN) still shows Soles as the primary/only currency where applicable.
