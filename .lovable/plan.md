# Plan: Standardize Checkout Coupon Validation

The user reports that coupons are showing as "invalid" across all payment methods (Stripe, Mercado Pago, PayPal, Manual, etc.). This is likely due to a discrepancy between the client-side coupon list and the server-side validation logic, or the coupon code not being passed correctly to the payment Edge Functions.

## Proposed Changes

### 1. Unified Coupon Configuration
- Synchronize `VALID_COUPONS` and `FIXED_TOTAL_COUPONS` between:
  - `src/stores/checkoutStore.ts` (Client state)
  - `supabase/functions/_shared/catalogPricing.ts` (Server-side validation)
- Ensure common coupons like `NEW10`, `PRUEBA20`, `RELAX15`, and the test coupon `FIXED1` are present in both locations.

### 2. Frontend Resilience
- Update `src/components/checkout/OrderSummary.tsx`:
  - Improve error feedback when a coupon is applied.
  - Ensure the `couponCode` is correctly persisted in the store and passed to the checkout flow.
- Update `src/stores/checkoutStore.ts`:
  - Fix `applyCoupon` to correctly identify and apply percentage vs fixed-total coupons.

### 3. Backend Hardening
- Update `supabase/functions/create-checkout-prueba/index.ts` (Stripe):
  - Ensure `couponCode` from the request body is passed to `resolveServerPricing`.
- Update `supabase/functions/create-mercadopago-preference/index.ts` (Mercado Pago):
  - Ensure `couponCode` is handled and the final price reflects the discount.
- Update `supabase/functions/dlocal-create-payment/index.ts` (dLocal Go):
  - Verify coupon support in the payment intent creation.

## Technical Details
- Coupons are currently hardcoded in two places. I will ensure they match.
- The fixed-total coupon `FIXED1` (for $1 tests) must be consistently handled so it doesn't revert to a percentage discount during payment creation.
- I will verify that `resolveServerPricing` in the shared catalog logic correctly applies the `FIXED_TOTAL_COUPONS` override.

## Verification Plan
- **Manual Test**: I will attempt to apply `FIXED1` and `NEW10` in the preview and check if the total updates correctly.
- **Edge Function Check**: I will verify via logs or dry-run that the Edge Functions receive and process the `couponCode`.
