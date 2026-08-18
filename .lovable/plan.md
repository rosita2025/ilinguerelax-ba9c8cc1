# Plan - Unify Spanish Digital Price to $34.99

The user wants the price for the **Spanish Mastery System - Digital Only** (5,000 Spanish words) to be consistently **$34.99 USD** (originally **$97 USD**) globally. The database currently shows $75 for global users, while LATAM and store prices are already $34.99.

## User Review Required

> [!IMPORTANT]
> I will unify the price to **$34.99 USD** for all regions (Global, LATAM, and Tienda) to ensure consistency across all pages and the checkout.

- **Current Global Price:** $75.00
- **Target Global Price:** $34.99
- **Current LATAM/Tienda Price:** $34.99 (already correct)

## Proposed Changes

### Database
- Update the `digital_products` table for SKU `5-000-spanish-words-with-english-pronunciation-digital`.
- Set `price_usd`, `price_usd_latam`, and `price_usd_tienda` all to **34.99**.
- Set `price_pen` to **135.00** (PEN conversion).

### Frontend Code
- **`src/data/products.ts`**: Update the digital product price from $97.00 (which was incorrectly set in a previous turn) to **34.99**.
- **`src/config/checkoutCatalog.ts`**: Verify `5000-spanish-words` has `price: 34.99` and all `regionPrices` at `34.99`.
- **`src/pages/ProductSpanish5000Digital.tsx`**: Ensure the fallback prices in `useCountryTierRouting` match the new $34.99 global price.

## Verification Plan
- Check the admin panel to confirm the SKU shows $34.99 for all tiers.
- Use Playwright to simulate a user from a non-LATAM region (e.g., USA) and verify the product page and checkout show $34.99.
