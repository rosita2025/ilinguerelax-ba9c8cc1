# Plan - Import Physical Products to Database

The user wants to ensure that the physical products (5,000 words, 8,000 words, and Spanish 5,000 words) are available in the admin panel just like digital products. Currently, these physical products exist in the frontend `src/data/products.ts` but are missing from the `public.digital_products` database table (which despite its name, now supports a `is_physical` flag for unified management).

## User Review Required

> [!IMPORTANT]
> This will synchronize your physical products into the database. If they already exist with different SKUs in the database, you might see duplicates in the admin panel.

- Do you want to keep the current SKUs from `products.ts` (e.g., `5-000-palabras-libro-fisico`) or do you have specific ones you'd prefer?

## Proposed Changes

### Database Integration

#### [Admin/Backend] Sync Physical Products to Supabase
- Insert the following products into `public.digital_products` if they don't exist:
    - **SKU**: `5-000-palabras-libro-fisico` (Inglés Relax - 5,000 Palabras)
    - **SKU**: `8-000-palabras-libro-fisico` (Inglés Relax - 8,000 Palabras)
    - **SKU**: `5-000-spanish-words-with-english-pronunciation-physical` (Spanish Relax - 5,000 Words)
- Set `is_physical = true` for these records.
- Set prices matching the current frontend: $24.00, $34.99, and $34.99 respectively.

### Frontend Synchronization

#### [Data] Update Product Definitions
- Ensure `src/data/products.ts` uses the correct `groupId` and `isPhysical` flags to match the database entries.

## Verification Plan

### Automated Tests
- Run a database query to confirm the 3 physical products are present and marked as `is_physical = true`.

### Manual Verification
- Navigate to `/admin/productos`.
- Use the "Físico" filter to confirm the three products appear with their orange badges.
- Open one for editing to verify that the "Producto Físico" toggle is active.
