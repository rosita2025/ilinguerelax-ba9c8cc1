# Plan: Fix Currency and Price Sync for Products

The user reported that the local currency prices for new products (specifically mentioned 15 soles for a product that should be 114 soles) are not reflecting correctly, despite having configured them in the admin panel.

## Problem Analysis

1.  **PEN Formatting:** In `src/i18n/index.ts`, `PEN` is configured with `decimals: 2`. The user mentioned "15 soles" vs "114 soles".
2.  **Product Metadata:** The database query reveals:
    *   `100-mapas-mentales-para-aprender-coreano-hangul-c1`: `price_pen: 28.90`, `price_usd: 15.00`.
    *   `spanish-relax-structural-spanish-grammar-a1-c1-book-physical-n9ct`: `price_pen: 15.00`, `price_usd: 48.00`.
3.  **Pricing Logic:**
    *   `ProductDynamic.tsx` uses `local.amount` (calculated from `effectiveUsd` via `useLocalCurrency`) OR `product.price_pen` if the country is Peru.
    *   `useLocalCurrency` uses `exchangeRates` or `local_prices` overrides.
    *   The user says they set the price to **114 soles** in the admin, but it shows **15 soles**.
    *   In the DB, `spanish-relax-structural-spanish-grammar-a1-c1-book-physical-n9ct` actually has `price_pen: 15.00`.
    *   In `src/hooks/useCardPrice.ts`, the fallback example in the comment is `$15,00`.

## Proposed Changes

### 1. Verification of Admin Input vs DB
The user claims they set 114 soles, but the DB shows 15 soles for the physical grammar book. I will verify if there's a sync issue or a specific SKU the user is referring to that wasn't in the initial query.

### 2. Standardize PEN Display
The user specifically mentioned "soles" and expressed frustration with rounding or incorrect values. I will ensure that if `price_pen` is present, it is used as the absolute truth for Peru, bypassing any conversion.

### 3. Logic Improvements
- Update `ProductDynamic.tsx` and `useCardPrice.ts` to prioritize `price_pen` for Peru visitors if available in the database.
- Ensure `useLocalCurrency` correctly picks up the manual `local_prices` override if `price_pen` is null but a PEN override exists.

## Technical Details

- **Files to modify:**
    - `src/pages/ProductDynamic.tsx`: Ensure it uses `product.price_pen` correctly.
    - `src/hooks/useCardPrice.ts`: Ensure card previews also respect the specific PEN price.
    - `src/stores/checkoutStore.ts`: Verify calculation logic for `pricePen`.

## Security Review
- RLS policies for `digital_products` already allow reading for all users, so the data should be available.
- No sensitive keys or credentials will be exposed.
