# Plan: Standardize Regional Pricing Separators and Decimal Validation

The user is reporting issues with decimal separators (dots and commas) and validation in the regional pricing fields at `/admin/products/:sku`. The goal is to ensure consistency between the admin UI, the database, and the frontend display (checkout/product pages), following the established convention: dot for thousands, comma for decimals in the frontend, while maintaining standard numeric input in the admin.

## Proposed Changes

### 1. Admin UI (AdminProductEdit.tsx)
- Enhance the `local_prices` and `local_usd_prices` inputs to handle numeric values more robustly.
- Add real-time visual feedback in the admin showing how the price will look to the customer (e.g., "Muestra al cliente: $1.234,56").
- Ensure the `onChange` handler correctly parses both dots and commas if the user types them manually, though standard `type="number"` handles this partially.

### 2. Internationalization (i18n/index.ts)
- Verify `formatAmountLocalized` correctly implements the `es-ES` convention (dot for thousands, comma for decimals).
- Ensure `formatCurrencyAmount` and `formatPrice` correctly use this localized formatting for all non-USD currencies.

### 3. Validation & Normalization
- Ensure the `save` function in `AdminProductEdit.tsx` normalizes all prices before sending to the backend (already does some rounding, but will make it more explicit).

## Technical Details

- **Admin Inputs**: Use `inputMode="decimal"` and `step="any"` for better mobile support and flexibility.
- **Rounding Logic**:
    - `COP`, `CLP`, `ARS`, `PYG`: 0 decimals (already partially implemented).
    - `USD`, `EUR`, `MXN`, `PEN`, etc.: 2 decimals.
- **Formatting**: `toLocaleString('es-ES', ...)` is the standard for the requested "dot-comma" format.

## Verification Plan

- **Automated**: Run existing tests (if any) related to pricing.
- **Manual**:
    - Edit a product in `/admin/productos`.
    - Enter manual prices for COP (e.g., 45000), MXN (e.g., 299.50), and PEN (e.g., 45.90).
    - Save and verify the database stores correct numeric values.
    - View the product page and checkout as a visitor from those countries (using `?country=MX` or similar if supported, or mocking IP).
    - Verify visual separators: MXN should show e.g., "$299,50" or "MXN 299,50".
