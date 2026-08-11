# Plan - Payment Checkout Optimization and Verification

The user is reporting issues with the checkout process, specifically mentioning that "nothing has been done" or it's not working correctly despite previous verification. I will perform a comprehensive review and live verification of the checkout flow, focusing on region-specific logic (Stripe vs. dLocal vs. Mercado Pago), currency handling (USD forcing for global gateways), and backend resilience.

## Proposed Changes

### 1. Checkout Core Logic
- Review `src/components/checkout/PaymentMethodsGroup.tsx` to ensure `selectedMethod` state is correctly handled and triggers the appropriate gateway.
- Verify that `clientSecret` fetching for Stripe and dLocal correctly handles the `isRestrictedRetry` logic to prevent loops or failures in countries like Argentina/Honduras.

### 2. Backend Edge Functions
- Inspect `supabase/functions/create-checkout-prueba/index.ts` to ensure it doesn't have conflicting `payment_method_types` that block specific regions.
- Verify `dlocal-create-payment` edge function for correct amount/currency mapping when local currency is used.

### 3. UI/UX Refinement
- Ensure skeleton loaders are correctly placed to avoid layout shifts during payment initialization.
- Verify that the regional badges (BBVA, OXXO, Pix) in `src/lib/dlocalCoverage.ts` are correctly rendering in the checkout UI.

## Verification Plan

### Automated Simulation (Playwright)
- I will run a multi-region simulation script to verify:
    - **Peru (PE)**: Should show Yape/Plin, BCP/BBVA (dLocal/MP), and Stripe.
    - **Mexico (MX)**: Should show OXXO, SPEI (dLocal), and Stripe.
    - **Argentina (AR)**: Should show local rails via dLocal but force USD for Stripe to avoid regional blocks.
- The script will:
    1. Navigate to `/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion`.
    2. Click "Comprar ahora" to reach `/checkouts/1-000-verbos`.
    3. Fill `BuyerInfoForm`.
    4. Select different payment methods and verify the backend call (Network logs).
    5. Capture screenshots of the payment frames (Stripe iframe, dLocal redirect).

### Manual Code Audit
- Re-verify the `embedded_page` mode in Stripe to ensure it's the most stable version for the current sandbox environment.
