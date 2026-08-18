# Plan - Final Unification of Spanish Digital Price

The user is reporting that the price update for the **Spanish Mastery System - Digital Only** (5,000 Spanish words) is not reflecting correctly, despite previous attempts. I will perform a comprehensive synchronization across the database and all frontend files to ensure the price is **$34.99 USD** (Global, LATAM, and Tienda) and the original price is **$97.00 USD**.

## Proposed Changes

### 1. Database Update
- Execute a Supabase migration to enforce the price for SKU `5-000-spanish-words-with-english-pronunciation-digital`:
  - `price_usd = 34.99`
  - `price_usd_latam = 34.99`
  - `price_usd_tienda = 34.99`
  - `price_pen = 135.00`
  - `original_price = 97.00`

### 2. Frontend Hardcoded Fallbacks
- **`src/pages/ProductSpanish5000Digital.tsx`**: Update the `PRICE` and `ORIGINAL_PRICE` constants and the `useCountryTierRouting` fallback values to match **$34.99**.
- **`src/config/checkoutCatalog.ts`**: Update the `5000-spanish-words` entry to set `price: 34.99`, `originalPrice: 97`, and all `regionPrices` to `34.99`.
- **`src/data/products.ts`**: Update the product with ID `spanish-5000-digital` to have `price: 34.99` and `originalPrice: 97.00`.
- **`src/pages/ProductSpanish5000.tsx`**: Ensure any cross-sell links to the digital version reflect the **$34.99** price.

## Verification Plan
- **Database Check**: Run a query to confirm the `digital_products` table is updated.
- **Visual Verification**: Use Playwright to check:
  - The main landing page (`/products/5-000-spanish-words-with-english-pronunciation-digital`).
  - The checkout page for that product (`/checkouts/5000-spanish-words`).
  - The cross-sell section on the physical book page.
- **Regional Testing**: Simulate a user from the USA and a user from Peru to ensure the $34.99 and S/135.00 prices are displayed respectively.
