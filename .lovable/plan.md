# Plan - Unified Pricing Fix for Spanish Mastery System

The user wants to update the price of the "Spanish Mastery System - Digital Only" product. Based on the request "del precio actualzar seimpre admin/products/:sku", it seems the user is frustrated that the price set in the admin/database is not consistently reflected everywhere, or they want a specific price to be "always" updated. 

The previous messages indicate a flip-flop between $97 and $34.99. The most recent command was to set it to $34.99. However, the database currently shows `price_usd` as **$78.99**, while `price_usd_latam` and `price_usd_tienda` are **$34.99**. 

I will unify all price tiers to **$34.99** in the database and ensure the frontend (catalog and landing page fallbacks) matches this value.

## Proposed Changes

### Database
- Update `public.digital_products` for SKU `5-000-spanish-words-with-english-pronunciation-digital`:
    - Set `price_usd` = 34.99
    - Set `price_usd_latam` = 34.99
    - Set `price_usd_tienda` = 34.99

### Frontend
- **`src/config/checkoutCatalog.ts`**:
    - Ensure `5000-spanish-words` has `price: 34.99` and `regionPrices: { latam: 34.99, global: 34.99, tienda: 34.99 }`.
- **`src/pages/ProductSpanish5000Digital.tsx`**:
    - Ensure `PRICE` constant is `34.99`.
    - Ensure `fallbackPriceGlobalUsd`, `fallbackPriceLatamUsd`, and `fallbackPriceTiendaUsd` in `useCountryTierRouting` are all `34.99`.
- **`src/pages/ProductSpanish5000.tsx`**:
    - Update any hardcoded price references in the digital cross-sell section to `34.99`.

## Technical Details
- Use `supabase--migration` for the database update.
- Use `code--line_replace` for frontend file updates.
- Verify the changes with `supabase--read_query`.
