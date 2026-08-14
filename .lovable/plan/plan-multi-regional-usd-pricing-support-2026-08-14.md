# Plan: Multi-Regional USD Pricing Support

Refine the regional pricing logic to ensure distinct USD base prices are applied correctly across different global regions (LATAM, Europe, Asia, Africa, etc.) and that these prices are reflected accurately in the local currency conversions.

## Proposed Changes

### Database
- No schema changes needed (the `local_usd_prices` column already exists in `digital_products`).

### Backend (Edge Functions)
- Update `supabase/functions/_shared/catalogPricing.ts` to ensure the regional USD resolution logic correctly handles the new regional tiers.
- Verify that conversion logic in edge functions uses the intended regional USD base before applying exchange rates.

### Frontend
#### Pricing Logic
- Refine `src/i18n/index.ts` to ensure `exchangeRates` and `formatPrice` correctly utilize `local_usd_prices`.
- Update `src/hooks/useLocalCurrency.ts` to prioritize the regional USD override for all calculations (subtotals, discounts, upsells).
- Ensure `useCardPrice.ts` correctly fetches and applies regional USD overrides for product cards.

#### UI Components
- **Admin Panel**: In `AdminProductEdit.tsx`, ensure the pricing grid allows for easy entry of regional USD overrides and that "Suggested" local prices update in real-time based on the specific regional USD selected.
- **Checkout**: In `OrderSummary.tsx` and `PaymentMethodsGroup.tsx`, ensure the "≈ USD $XX.XX" reference label always matches the regional USD base defined for that specific country/currency.
- **Upsell Panel**: Ensure upsell prices in `UpsellPanel.tsx` also respect regional USD overrides.

## Technical Details
- **Regional USD Resolution**: When a user visits from Mexico (MXN), the system should check:
  1. `local_prices.MXN` (Manual local price, e.g., 540 MXN).
  2. `local_usd_prices.MXN` (Regional USD base, e.g., $20 USD).
  3. Tier-based USD (`price_usd_latam`, `price_usd`).
- **Precision**: Use `Math.round(val * 100) / 100` for all USD values to prevent floating-point errors in Meta Pixel and checkout totals.
- **Global Tiers**: Map Africa and Asia to specific tiers if they require lower USD bases as requested.

## Verification Plan
- Use Playwright to simulate visitors from different regions (e.g., US, Mexico, Spain, Japan, Nigeria).
- Verify that the USD reference label in the checkout matches the expected regional base for each.
- Check that the Meta Pixel `Purchase` event reports the correct regional USD value.
- Verify that changing the Base USD in Admin updates all regional suggestions correctly.
