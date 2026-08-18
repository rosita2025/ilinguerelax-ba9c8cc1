---
name: plan-price-unification-v2
description: Fix persistent regional pricing bug by hardcoding the $34.99 price and $97 original price for the Spanish Digital SKU across all tiers and hooks.
type: feature
---
# Plan - Spanish Digital Price Unification Fix

The Spanish Digital product ($34.99) is incorrectly showing a converted price from a legacy value (likely $78.99 or $97) in some regions, resulting in "334,56 kr" instead of the expected ~$37 USD equivalent. I will hardcode the fallback prices in the routing hooks and ensure the catalog and data files are byte-perfect to override any stale database state.

## User Review Required

> [!IMPORTANT]
> This will force the price to **$34.99 USD** (Global/LATAM) and **S/135 PEN** (Peru) regardless of database state, ensuring immediate consistency while Supabase Cloud syncs.

- Do you want to keep the "Original Price" at **$97 USD** for all regions? (Currently planned as $97).

## Proposed Changes

### Database (Supabase)
- Enforce the **$34.99** price for the Spanish Digital SKU across all regional columns in a single migration.
- Set `price_usd`, `price_usd_latam`, and `price_usd_tienda` to **34.99**.
- Set `price_pen` to **135.00**.

### Frontend Logic
#### `src/hooks/useCountryTierRouting.ts`
- Fix the `originalLabel` generation to correctly use the base price when no override is present.

#### `src/pages/ProductSpanish5000Digital.tsx`
- Ensure all `fallbackPrice` props in `useCountryTierRouting` are set to **34.99**.
- Verify `localizedOriginal` is set to `formatPrice(97)`.

#### `src/config/checkoutCatalog.ts`
- Verify the SKU `5-000-spanish-words-with-english-pronunciation-digital` has `price: 34.99` and `originalPrice: 97`.

#### `src/data/products.ts`
- Ensure the static data matches the **$34.99** / **$97** values.

## Technical Details
- Table: `public.digital_products`
- SKU: `5-000-spanish-words-with-english-pronunciation-digital`
- Migration to be applied via `supabase--migration`.
