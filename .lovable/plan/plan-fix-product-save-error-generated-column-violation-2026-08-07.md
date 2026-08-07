# Plan: Fix Product Save Error (Generated Column Violation)

The user is encountering a "Database error" when saving new products at `/admin/productos/nuevo`. Logs indicate the error is `cannot insert a non-DEFAULT value into column "bonus_titles"`. This is because `bonus_titles` is a generated column in the `digital_products` table, but the `manage-products` Edge Function is attempting to include it in the `upsert` payload.

## Proposed Changes

### 1. Edge Function
- **File**: `supabase/functions/manage-products/index.ts`
- **Action**: Remove the `bonus_titles` key from the `row` object in the `upsert` logic. Since it is a generated column, Postgres will calculate it automatically from the `bonuses` JSONB array.

### 2. Frontend Admin UI
- **File**: `src/pages/AdminProductEdit.tsx`
- **Action**: 
    - Ensure `bonus_titles` is not sent in the payload to the Edge Function.
    - Clean up the `save` function to omit any properties that shouldn't be persisted directly.

## Verification Plan

### Automated Verification
- Run a smoke test on the Edge Function logic (mocking the database call if possible or verifying the payload structure).
- Use `supabase--curl_edge_functions` to attempt a dry-run or a controlled upsert of a test SKU (e.g., `test-sku-verification`) and verify success.

### Manual Verification
- Navigate to `/admin/productos/nuevo` in the preview.
- Fill in required fields (Name, SKU, Prices).
- Click "Guardar" and confirm the success toast appears and the product is created in the database.
