# Plan: Unified Pricing for Spanish Mastery System

The user is reporting that the updated price of **$97** is not reflecting across all pages. Investigation reveals that while the global USD price was updated, the regional overrides for Latin America (LatAm) and the internal store (Tienda) are still set to the old values (approx. $22-$67).

## Proposed Changes

### Database (Lovable Cloud)
- Update `public.digital_products` for SKU `5-000-spanish-words-with-english-pronunciation-digital`.
- Set `price_usd_latam = 97`.
- Set `price_usd_tienda = 97`.
- Ensure `price_usd = 97` (global baseline).

### Frontend
#### Checkout Configuration
- Update `src/config/checkoutCatalog.ts`.
- Set `regionPrices` for `5000-spanish-words` to:
  ```typescript
  regionPrices: { latam: 97, global: 97, tienda: 97 }
  ```

#### Product Page
- Update `src/pages/ProductSpanish5000Digital.tsx`.
- Synchronize `useCountryTierRouting` fallbacks to match the new $97 pricing across all tiers.

#### Metadata & Static Data
- Ensure `src/data/products.ts` remains consistent with the $97 price and $215 original price.

## Technical Details
- Use `supabase--migration` for database updates to ensure persistence and correct permissions.
- Trigger a catalog broadcast via `publishCatalogUpdate` (automatically handled by database triggers or manual call if needed) to refresh all open tabs.
