# Plan: Multi-Regional USD Pricing Support

The user wants to define distinct USD base prices for different regions/currencies in the product administration panel, ensuring that the local currency prices are calculated from these specific USD values rather than just a single global USD price.

## Technical Details

### 1. Database Schema
- Add a new `jsonb` column `local_usd_prices` to the `digital_products` table.
- This column will store specific USD values for each currency code (e.g., `{"MXN": 15, "EUR": 25}`).

### 2. Admin Interface (`src/pages/AdminProductEdit.tsx`)
- Update the pricing grid to include a new "Regional USD Price" input field for each currency.
- When this field is edited, the system will automatically:
    - Update the corresponding "Local Price Override" using the exchange rate.
    - Store the regional USD source in `local_usd_prices`.
- Add a visual indicator showing if a region is using a "Distinct USD" base price.
- Ensure validation (no negative values, correct rounding) applies to both USD and local inputs.

### 3. Price Calculation Logic (`src/lib/catalogPricing.ts` / `src/i18n/index.ts`)
- Update the regional pricing tiers to respect `local_usd_prices`.
- Priority order for calculation:
    1.  Manual Local Currency Override (`local_prices`).
    2.  Regional USD Price (`local_usd_prices`) × Exchange Rate.
    3.  Tiered USD Price (`price_usd_latam`, `price_usd_tienda`) × Exchange Rate.
    4.  Global USD Price (`price_usd`) × Exchange Rate.

### 4. Frontend Hooks (`src/hooks/useLocalCurrency.ts`, `src/hooks/useCardPrice.ts`)
- Update hooks to fetch and apply the `local_usd_prices` overrides.
- Ensure the "≈ $XX.XX USD" reference labels on the product page and checkout reflect the *regional* USD price when one is defined.

## User Review Required

> [!IMPORTANT]
> This change introduces a new "Regional USD Price" field. If you set $15 USD for Mexico, the system will calculate the MXN price automatically. If the exchange rate in `src/i18n/index.ts` is updated later, the MXN price will stay the same unless you manually recalculate it or re-enter the USD value.

- **Currency Tiers**: We will maintain the existing LATAM and Tienda (VE/CU/NI) tiers as quick presets, but the new per-currency USD setting will override them for maximum control.
