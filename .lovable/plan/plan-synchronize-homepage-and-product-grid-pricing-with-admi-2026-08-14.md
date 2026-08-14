# Plan: Synchronize Homepage and Product Grid Pricing with Admin Settings

The user wants to ensure that prices on the homepage (`/`) and the products catalog (`/products`) are fully synchronized with the manual overrides and regional settings defined in `/admin/products/:sku`. Currently, while some synchronization exists via the `useCardPrice` hook, there might be inconsistencies in how some components fetch or display these prices.

## Proposed Changes

### 1. Global Price Formatter Hook (`useCardPrice.ts`)
- Review and refine `useCardPrice.ts` to ensure it correctly handles all regional tiers (PEN for Peru, TiendaUSD for VE/CU/NI, LATAM, and Global).
- Ensure it prioritizes `local_prices` and `local_usd_prices` overrides exactly as the single product page and checkout do.
- Add logging or debug markers (visible only in debug mode) to verify which source a price is coming from.

### 2. Homepage Products (`src/components/Languages.tsx`)
- Ensure the `Languages` component (which renders products on the homepage) uses `cardPrice.format()` for all product prices.
- Verify that the `merged` products list correctly passes the `slug` (SKU) to the formatter.
- Update the pricing display to include the currency label and regional badge consistently.

### 3. Products Catalog (`src/pages/Products.tsx`)
- Audit the `Products` page to ensure every product card uses `useCardPrice`.
- Remove any redundant or local pricing logic that might conflict with the centralized hook.
- Ensure "Original Price" calculations also follow the centralized `formatOriginal` logic.

### 4. Data Consistency (`src/hooks/useDigitalProducts.ts`)
- Ensure the `toProduct` mapping includes all necessary fields for pricing (like `price_pen`, `price_usd_latam`, etc.) if they are used as fallbacks before the hook hydrates.

## Technical Details
- **Sync Mechanism**: `useCardPrice` uses a singleton-style cache and subscribes to catalog updates via `subscribeCatalogUpdates`.
- **Formatting**: All components must use `cardPrice.format(product.slug, fallbackPrice)` to ensure the `es-ES` (dot-comma) formatting and regional overrides are applied.

## Verification Plan

### Manual Verification
1. **Admin Sync**:
   - Go to `/admin/productos` and set a manual MXN price (e.g., 299.50) for a product.
   - Open the homepage in a separate tab/window.
   - Verify the price updates to "MXN 299,50" (if detected region is Mexico).
2. **Catalog Sync**:
   - Navigate to `/products`.
   - Verify the same product shows the same "MXN 299,50" price.
3. **Regional Logic**:
   - Use a VPN or mock the IP to check different regions (PE, CO, US).
   - Verify the "Global", "LATAM", "PE" badges appear correctly on the cards.
