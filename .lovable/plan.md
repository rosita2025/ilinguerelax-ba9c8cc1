# Plan - Automated Drafts and Permission Fixes

The user is experiencing issues saving products ("non-2xx status code") and wants to "automate drafts without losing products". This likely refers to preventing data loss when a save operation fails and providing a more robust "Draft" (Borrador) workflow. I also discovered that while RLS policies exist, the necessary SQL `GRANT` statements are missing, which is likely causing some of the reported errors.

## Database Fixes
- Grant `SELECT, INSERT, UPDATE, DELETE` on `digital_products`, `product_upsells`, and `digital_product_changes` to the `authenticated` and `service_role` roles.
- Ensure `usage` on the `public` schema is granted (usually is, but good to be sure).

## Product Management Enhancements (`AdminProductEdit.tsx`)
1.  **Auto-save to LocalStorage**:
    - Implement a background auto-save that stores the current form state (`product` and `upsells`) to `localStorage` every few seconds.
    - Use SKU-specific keys (e.g., `product-draft-{sku}`) and a special key for new products (`product-draft-new`).
2.  **Draft Restoration**:
    - On component mount, detect if a local draft exists.
    - If found, show an alert/notice allowing the user to "Restaurar borrador" or "Descartar".
3.  **Default to Draft Status**:
    - New products will now default to `active: false` (Borrador) instead of `active: true`.
    - This allows admins to "automate" the creation of products as drafts until they are fully ready for publication.
4.  **UI Feedback**:
    - Label the `active` toggle more clearly (e.g., "Publicado" vs "Borrador").
    - Improve error reporting when the Edge Function fails by showing the specific error message in the toast.
5.  **Cleanup**:
    - Clear the `localStorage` draft upon successful save to the database.

## Edge Function Improvements (`manage-products`)
- No immediate logic changes needed to the function itself, but the database grants will resolve the "non-2xx" errors caused by permission blocks.

## Verification
- Verify that permissions are correctly granted using `psql`.
- Test the auto-save by modifying a product, refreshing the page, and confirming the restoration prompt appears.
- Confirm that new products default to "Borrador" status.
