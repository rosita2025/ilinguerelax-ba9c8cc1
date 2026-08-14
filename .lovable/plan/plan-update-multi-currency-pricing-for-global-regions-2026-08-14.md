# Plan - Update Multi-Currency Pricing for Global Regions

The user is reporting that pricing for regions like USA, Canada, Europe, Asia, and Africa is showing incorrect or "frozen" reference values (e.g., "Ref: $27 USD") and not correctly reflecting the intended local currency values in the checkout and admin panels. I will update the multi-currency system to ensure consistent and accurate pricing across all regions.

## Proposed Changes

### Internationalization & Pricing
- **Update `src/i18n/index.ts`**
  - Verify and refine exchange rates for `CAD`, `AUD`, `NZD`, `EUR`, `GBP`, `JPY`, `KRW`, `CNY`, `INR`, and major African currencies.
  - Ensure the `AMBIGUOUS_DOLLAR_CURRENCIES` set includes all currencies that use "$" to prevent confusion with USD.
  - Verify `formatPrice` and `formatCurrencyAmount` logic to ensure USD references are always accurate and reactive.

### Hooks & Data Fetching
- **Update `src/hooks/useAdminPricing.ts`**
  - Ensure all regional pricing fields (`price_usd_latam`, `price_usd_tienda`, etc.) are correctly typed and returned.
  - Optimize the `maybeSingle()` query to handle potential data inconsistencies.
- **Update `src/hooks/useCardPrice.ts`**
  - Ensure the tier detection for "Global" regions correctly applies the base `price_usd` before conversion.

### Admin Interface
- **Update `src/pages/AdminProductEdit.tsx`**
  - Fix the pricing grid to ensure `baseUsdRef` and suggested prices (`Sug:`) update in real-time as the user types the base USD price.
  - Add more descriptive labels for non-LATAM regions to clarify that these are automatic conversions unless a manual override is set.

## Technical Details

- Use `es-ES` locale for formatting non-USD currencies (dot for thousands, comma for decimals).
- Enforce `useGrouping: "always"` in formatting to maintain visual consistency.
- Ensure the `price_usd` field in `digital_products` table remains the primary source for global pricing.

## Verification Plan

### Automated Verification
- Run a Playwright script to simulate visitors from USA (USD), Spain (EUR), and Japan (JPY).
- Verify that the price shown in the Sticky Bar and Checkout matches the expected converted value or the manual override if set.

### Manual Verification
- Navigate to `/admin/productos/editar` and verify that changing the "Base USD" price instantly updates the reference labels for all global currencies in the grid.
