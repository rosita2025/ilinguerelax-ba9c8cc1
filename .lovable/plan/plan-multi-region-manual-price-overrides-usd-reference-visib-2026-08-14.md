# Plan: Multi-Region Manual Price Overrides & USD Reference Visibility

The user wants to ensure that manual price overrides (local currency) are correctly handled across all regions (LATAM, Anglosphere, Europe, Asia) and that the USD reference is always visible to avoid confusion, especially since Stripe, dLocal, and PayPal ultimately process based on these prices.

## Proposed Changes

### 1. Admin UI Enhancements (`src/pages/AdminProductEdit.tsx`)
- Expand the "Exact Prices by Currency" section to include major global currencies beyond LATAM (EUR, GBP, CAD, AUD, NZD, etc.).
- Maintain the logic that shows "(Ref: $XX.XX USD)" and the exchange rate used for automatic conversion suggestions.
- Ensure the layout remains clean and readable even with more currencies.

### 2. Backend Pricing Logic (`supabase/functions/_shared/catalogPricing.ts`)
- Verify that `localTotalFromPricing` correctly honors manual overrides for these new global currencies.
- Ensure shipping logic remains consistent with the local price overrides.

### 3. Payment Integration Verification
- Confirm that Stripe, dLocal, and PayPal Edge Functions use the `localTotalFromPricing` utility to ensure the amount charged matches the manual override configured in the admin.

## Technical Details
- Currencies to add: `EUR`, `GBP`, `CAD`, `AUD`, `NZD`, `JPY`.
- The `exchangeRates` object in `src/i18n/index.ts` should already have these; I will verify.
- The `digital_products` table in Supabase stores `local_prices` as a JSONB object, so no schema change is needed.

## Verification Plan
- Check the admin panel to see the new currency fields.
- Enter a manual price for a non-LATAM currency (e.g., EUR) and verify the reference USD calculation.
- Mock a checkout for a European country to ensure the manual EUR price is picked up instead of the automatic conversion.
