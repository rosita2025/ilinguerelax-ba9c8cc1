# Plan: Regional Pricing & Physical Shipping Standardization

Standardize the 3-tier regional pricing logic and ensure physical shipping costs ($8.00/$9.00 USD) are correctly added and synchronized across the summary, PayPal, Stripe, and dLocal Go.

## Technical Details

### 1. Pricing Tier Logic
- Refactor `pickTierPrice` in `supabase/functions/_shared/catalogPricing.ts` and `itemPrice` in `src/stores/checkoutStore.ts` to strictly follow the 3-tier USD model:
    - **LATAM**: `price_usd_latam`
    - **Anglo/Global**: `price_usd`
    - **Tienda (VE, CU, NI)**: `price_usd_tienda`
- Ensure `useRegionTier.ts` correctly classifies countries into these three buckets.

### 2. Shipping Logic Alignment
- Centralize shipping cost constants: $9.00 USD for LATAM countries, $8.00 USD for the rest.
- Update `useCheckoutTotal.ts` and `PaymentMethodsGroup.tsx` to use the same logic for determining if shipping applies (`isPhysical` product AND `subtotal < $50.00 USD`).
- Ensure `shippingCostUSD` is consistent across all components.

### 3. Payment Gateway Synchronization
- **PayPal**: Pass `totalUsd` (which already includes shipping) directly to `amountUsd` in `PaymentMethodsGroup.tsx` when calling `PayPalButtons`. Update `PayPalButtons.tsx` to ensure `createOrder` uses this total.
- **Stripe**: Update `create-checkout-prueba` edge function to re-calculate shipping server-side and add it as a line item, ensuring the PaymentIntent total matches the frontend.
- **dLocal Go**: Update `dlocal-go-create-payment` (if exists) or the client-side call to include shipping in the final amount.

### 4. Visual Consistency
- Ensure the "Amount to pay" header and the "Pay $XX.XX" button labels in `PaymentMethodsGroup.tsx` use the same calculated `totalUsd`.

## Verification Plan

### Automated Checks
- Run `vitest` if applicable to check calculation logic.
- Use `supabase functions serve` to test Edge Function pricing resolution.

### Manual Preview Steps
1. Navigate to `/checkouts/libro-impreso` (a physical SKU).
2. Set country to US (Anglo). Verify price is `price_usd` + $8.00.
3. Set country to Mexico (LATAM). Verify price is `price_usd_latam` + $9.00.
4. Verify the PayPal button shows the total including shipping.
5. Repeat for a digital product and verify shipping is $0.
