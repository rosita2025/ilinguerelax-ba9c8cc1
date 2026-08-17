# Plan: Spanish Mastery System - Pricing Alignment & Page Optimization

The user wants to fix the pricing and layout for the Spanish Mastery System.
Specifically:
1.  **Product Alignment**:
    *   `/products/5-000-spanish-words-with-english-pronunciation-digital` (Mastery System): **$97 USD** (Bundle of 1,000 verbs, structures, etc.).
    *   `/products/5-000-words-spanish-with-pronunciation-english-nwna` (Digital Only): **$30 USD**.
    *   `/products/5-000-spanish-words-with-english-pronunciation-physical` (Physical + Digital): **$44 USD**.
2.  **Layout Fixes**:
    *   `ProductSpanish5000Digital.tsx` is too long/scroll-heavy. Need to shorten/optimize.
    *   `StickyBuyBar` testimonials are missing or not showing correctly.

## Proposed Changes

### 1. Route & Component Separation (`src/App.tsx`)
- Ensure `/products/5-000-spanish-words-with-english-pronunciation-digital` points to the Mastery System page ($97).
- Ensure `/products/5-000-words-spanish-with-pronunciation-english-nwna` points to the "Solo Digital" page ($30).
- I will create a new component `src/pages/ProductSpanishMastery.tsx` for the $97 Mastery System to avoid confusion, or refactor existing ones.

### 2. Update `ProductSpanish5000Digital.tsx` (Targeting $30 version)
- Shorten the page content as requested ("too long").
- Consolidate sections into a more compact, high-conversion format.
- Set price to $30 USD.
- Ensure 7-day refund policy is clear.

### 3. Update `ProductSpanish5000.tsx` (Physical version)
- Set price to $44 USD.
- Ensure "Digital Only" links to the $30 version (`/products/5-000-words-spanish-with-pronunciation-english-nwna`).

### 4. Create/Update Mastery System Page ($97)
- Target SKU: `5-000-spanish-words-with-english-pronunciation-digital`.
- Price: $97 USD.
- Content: Include "1,000 verbs", "structural", etc.

### 5. `StickyBuyBar.tsx` Fixes
- Ensure `testimonials` prop is passed correctly from product pages.
- Verify mobile rendering of testimonials.

## Technical Details
- Standardize SKUs and prices in `useCountryTierRouting` and `useAdminPricing` hooks where applicable.
- Update `ProductComparisonSpanish.tsx` to reflect the 3-tier structure if needed.

## Verification
- Verify each URL and its price.
- Check StickyBuyBar on mobile preview.
- Confirm 7-day guarantee everywhere.
