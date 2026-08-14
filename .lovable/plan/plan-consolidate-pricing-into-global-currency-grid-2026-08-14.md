# Plan: Consolidate Pricing into Global Currency Grid

The user wants to simplify the admin interface by removing the tiered regional pricing (LATAM USD, PEN, Tienda USD) and instead using only the "Exact Prices by Currency" grid for the entire world.

## Proposed Changes

### 1. Admin UI Cleanup (`src/pages/AdminProductEdit.tsx`)
- **Delete Section 3**: Remove the "3. Precios por región" card which currently contains Global USD, LATAM USD, PEN, and Tienda USD fields.
- **Relocate Primary Fields**: 
    - Move the **Base Price (USD)** input to the top of the "Precios exactos por moneda" section. This field will continue to update `product.price_usd`.
    - Move the **Rating** and **Review Count** fields to a more appropriate location (likely right before or after the base price in the same section).
- **Consolidate Regional Pricing**: The "Precios exactos por moneda" section (which was recently expanded to include EUR, GBP, etc.) will now be the primary place for all currency-specific overrides.
- **Remove Redundancy**: Ensure the "Producto Físico" switch is not duplicated.

### 2. Implementation Details
- Rename the header "💱 Precios exactos por moneda (Global)" to "💰 Configuración de Precios Globales".
- Ensure that `product.price_usd` remains the "Anchor" price used for automatic conversion suggestions in the grid.
- Keep the recently added global currencies (EUR, GBP, CAD, AUD, NZD, JPY) in the grid.

## Technical Details
- The database fields `price_usd_latam`, `price_usd_tienda`, and `price_pen` will remain in the schema but will no longer be exposed in the UI, as the user prefers manual overrides via the `local_prices` JSONB field for precision.
- The `price_usd` field remains critical as the base for all calculations.

## Verification Plan
- Open a product in `/admin/products/:sku`.
- Verify the "3. Precios por región" section is gone.
- Verify the "Configuración de Precios Globales" section has the Base USD Price, Rating, and Review Count.
- Verify that the currency grid correctly uses the Base USD Price for its "Sug: XX.XX" calculations.
