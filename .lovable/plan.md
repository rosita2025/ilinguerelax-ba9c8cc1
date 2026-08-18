# Plan: Unify Spanish Mastery System Pricing to $97 USD

The user wants to ensure the "Spanish Mastery System - Digital Only" product (5,000 Spanish words) is consistently priced at **$97 USD** (original price **$215 USD**) across all pages. Currently, while the main digital page is updated, other references (like the cross-sell on the physical book page) might still show outdated prices.

## Technical Details

- **Affected Files:**
    - `src/pages/ProductSpanish5000.tsx`: Update the digital version cross-sell price from hardcoded values to $97/$215.
    - `src/pages/ProductSpanish5000Digital.tsx`: Verify all price labels and fallbacks are $97/$215.
    - `src/config/checkoutCatalog.ts`: Verify `5000-spanish-words` entry.
- **Database:** Ensure `public.digital_products` for SKU `5-000-spanish-words-with-english-pronunciation-digital` has `price_usd`, `price_usd_latam`, and `price_usd_tienda` all set to **97**.

## Proposed Changes

### 1. Unified Price Updating in Frontend
- Update `src/pages/ProductSpanish5000.tsx` (Physical Book Page):
    - Change the "View Digital Version" button/label to show **$97**.
    - Change the original price reference to **$215.00**.
- Update `src/pages/ProductSpanish5000Digital.tsx` (Digital Page):
    - Ensure `PRICE` constant is `97`.
    - Ensure `ORIGINAL_PRICE` constant is `215`.
    - Ensure `fallbackPriceGlobalUsd`, `fallbackPriceLatamUsd`, and `fallbackPriceTiendaUsd` are all `97`.

### 2. Database Sync
- Execute a SQL migration to enforce the $97 price for the digital SKU in the database to prevent overrides.

---
**Verification Plan:**
- Check the physical product page (`/products/5-000-spanish-words-with-english-pronunciation-physical`) and confirm the digital cross-sell shows $97.
- Check the digital product page (`/products/5-000-spanish-words-with-english-pronunciation-digital`) and confirm the price is $97.
- Verify checkout for both regions (USA/LatAm) defaults to $97.
