# Plan: Global Availability and Checkout Verification

The user wants to ensure that the purchase flow works in any region and that the purchase button leads correctly to the checkout without errors. We recently modified `ProductDynamic.tsx` to ignore country exclusions and force global availability. Now we need to verify this behavior and ensure the checkout itself doesn't have hidden regional blocks.

## Verification Steps
1. **Product Page Access**: Verify that a product page (e.g., `/products/1-000-palabras-en-ingles-con-pronunciacion-espa-ol-con-pronunciacion-hispano`) loads the "Comprar ahora" button regardless of the detected country.
2. **Checkout Navigation**: Verify that clicking "Comprar ahora" correctly navigates to `/checkouts/:sku`.
3. **Regional Payment Methods**: Verify that the checkout page loads payment methods for different regions (e.g., US, Mexico, Peru).
4. **Checkout Gate**: Confirm `isCheckoutAuthorized` (in `src/lib/checkoutGate.ts`) doesn't block legitimate users arriving from the product page.

## Proposed Actions

### 1. Manual/Automated UI Testing
Since full automated testing with Supabase auth is complex due to 2FA/Password requirements in the sandbox, I will perform a check of the core logic to ensure no other components are blocking regions.

### 2. Logic Audit
- **`src/pages/ProductDynamic.tsx`**: Already updated to ignore `store_excluded_countries` for display.
- **`src/lib/checkoutGate.ts`**: Ensure it doesn't redirect users if they lack a "token" but come from a valid internal referer.
- **`src/hooks/useCheckoutMethodsConfig.ts`**: Ensure that if a country doesn't match any specific region, it falls back to a "GLOBAL" region configuration so payment methods are always available.

### 3. Adjustments (if needed)
- If a region is missing in `checkout_regions`, the code currently falls back to a region named "GLOBAL". I will verify this fallback is robust.

## Success Criteria
- Product page shows "Comprar ahora" even for IP-detected countries that were previously excluded.
- Checkout page loads without immediate redirection to `/products/:sku`.
- Payment methods appear for a "Global" visitor (e.g., US).

I will now verify the `useCheckoutMethodsConfig` fallback and then report.
