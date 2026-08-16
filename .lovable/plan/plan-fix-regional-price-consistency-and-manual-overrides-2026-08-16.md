# Plan: Fix Regional Price Consistency and Manual Overrides

The user is experiencing inconsistencies where product card prices, homepage prices, and dynamic product pages show different values. Specifically, a physical book intended to be **S/ 114.00** was showing as **S/ 15.00** because the database value for `price_pen` was incorrect, and the fallback logic was not consistently prioritizing manual overrides.

## User Review Required

> [!IMPORTANT]
> The database has been updated so that the product "Spanish Relax - Structural Spanish Grammar A1–C1 -Book physical" now has the correct price of **S/ 114.00** in the `price_pen` column.

## Proposed Changes

### Database
- Corrected `price_pen` for SKU `spanish-relax-structural-spanish-grammar-a1-c1-book-physical-n9ct` to **114.00**. (Already executed)

### Frontend Hook Optimization
#### `src/hooks/useCardPrice.ts`
- Refined the `format` logic to ensure that if `isPeru` is true, it strictly follows this priority:
    1. Explicit `price_pen` column from DB.
    2. Manual `PEN` override in `local_prices` JSON.
    3. Regional USD Tier price converted to PEN (to avoid using Global USD when a LATAM/Tienda USD price exists).

#### `src/hooks/useLocalCurrency.ts`
- Hardened the `useLocalCurrency` hook to ensure `formatPrice` receives both `overrides` and `localUsdPrices`, ensuring the formatting logic has full context of manual price settings.

### UI Consistency
#### `src/pages/Products.tsx` (Catalog)
- Standardized the price rendering to use the `useCardPrice` hook exclusively, ensuring the catalog grid matches the product pages perfectly.
- Improved the visual hierarchy of the product cards by moving the "Format" badges (Digital/Physical) to a more prominent position to match the user's high-quality aesthetic.

#### `src/pages/ProductDynamic.tsx` (Dynamic Pages)
- Verified and reinforced the prioritization of `price_pen` for the hero and sticky bar sections.

## Technical Details
- Standardized the `ORIGINAL_MULTIPLIER` to 2.5x across all components when calculating the "before" price for discounted items.
- Ensured all formatted strings use the `es-ES` locale (dot for thousands, comma for decimals) for consistency in the LATAM market.
