# Plan - Fix "Error del Producto Nuevo"

The user is still experiencing errors when creating new products ("otra vez me dio error del rpoducto nuevo"). Despite previous fixes, there seems to be a persistent issue in the product creation flow.

## Diagnosis
1.  **Race Condition in `save`**: The `save` function in `AdminProductEdit.tsx` might be failing due to how `adminInvoke` errors are handled or how the UI state (like `isNew`) interacts with the backend `upsert`.
2.  **Missing Fields/Types**: The backend `manage-products` might be rejecting the payload if certain fields (like `sku_aliases` or `bonus_titles`) are missing or incorrectly formatted when creating a new record.
3.  **RLS/Permissions**: Although we added `GRANT`s, there might be a specific policy violation (like the one reported earlier: "new violates row level security policy") if the `authenticated` role doesn't have `INSERT` permission on `digital_products` despite the grant.
4.  **SKU Validation**: The backend strictly validates SKUs. If the frontend is sending an empty or invalid SKU before it's properly generated, it will fail.

## Proposed Changes

### 1. Backend: Data Integrity & Error Logging
- Update `supabase/functions/manage-products/index.ts` to log the *exact* payload received and any database error details to the function logs.
- Ensure all optional fields have safe defaults in the `upsert` payload.

### 2. Frontend: Robust Save & Error Reporting
- In `AdminProductEdit.tsx`, ensure that `isNew` products are handled correctly by the `save` function.
- Add more explicit logging in `adminInvoke` and `AdminProductEdit` to capture the specific database error (code and message).
- Ensure `sku` is finalized (trimmed/lowercase) before sending to the backend.

### 3. Database: Permission Audit
- Verify the `authenticated` role has both `GRANT ALL` and a valid `INSERT` policy on `public.digital_products`.

## Verification Plan
1. **Log Analysis**: Check Supabase Edge Function logs for the most recent "upsert" attempts.
2. **Manual Creation**: Try creating a new product via the Admin UI and monitor the console and network tab.
3. **Database Check**: Run a query to confirm the `authenticated` role's effective permissions.
