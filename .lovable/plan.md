---
name: plan-price-unification-hard-fix
description: Force the Spanish Digital product price to $34.99 and original price to $97 globally by hardcoding values in hooks and frontend components to bypass any stale database state.
type: feature
---
# Plan - Final Spanish Digital Price Unification

The Spanish Digital product ($34.99) is showing incorrect converted prices in some regions (e.g., Sweden) because the routing logic is likely pulling legacy values from the database or failing to pass the unified overrides through the currency formatter. I will implement a "hard fix" that ensures these prices are correctly displayed globally.

## User Review Required

> [!IMPORTANT]
> This plan forces the price to **$34.99 USD** and the original price to **$97 USD** for the Spanish Digital SKU globally. This will override any values currently in the database to ensure immediate consistency.

- Is **$34.99 USD** the final intended price for all global regions (Sweden, USA, etc.)?

## Proposed Changes

### Frontend Logic & Hooks

#### `src/hooks/useCountryTierRouting.ts`
- Modify the `originalLabel` generation logic. Currently, it might be using a default multiplier (2.5x) on a legacy base price.
- I will ensure that if the SKU is the Spanish Digital one, it explicitly uses **$97** as the base for the `originalLabel` regardless of other calculations.

#### `src/pages/ProductSpanish5000Digital.tsx`
- The `useCountryTierRouting` call already has `fallbackPriceGlobalUsd: 34.99`, but I will ensure the `localizedOriginal` is also explicitly derived from **97**.
- Verify that the `addItem` payload in `handleBuyNow` and `handleAddToCart` passes the unified $34.99 price to the cart.

#### `src/config/checkoutCatalog.ts`
- Ensure the SKU `5-000-spanish-words-with-english-pronunciation-digital` entry has `price: 34.99` and `originalPrice: 97` for all regions in the `regionPrices` object.

#### `src/data/products.ts`
- Update the static `spanish-5000-digital` entry to have `price: 34.99` and `originalPrice: 97.00`.

### Database Enforcements
- Run a final Supabase migration to set `price_usd`, `price_usd_latam`, and `price_usd_tienda` to **34.99** and `price_pen` to **135.00** for the SKU `5-000-spanish-words-with-english-pronunciation-digital`.

## Technical Details
- Product SKU: `5-000-spanish-words-with-english-pronunciation-digital`
- Target Price: **$34.99 USD**
- Target Original Price: **$97.00 USD**
- I will use `supabase--migration` for the database update.
