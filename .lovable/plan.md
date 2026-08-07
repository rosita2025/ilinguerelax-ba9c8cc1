# Plan: Fix New Product Save Errors & Optimize SKU Logic

The user is experiencing errors when saving new products despite recent fixes. Investigation revealed that while database permissions and RLS are set up, there are strict validation guards in the `manage-products` Edge Function (like Drive URL consistency and Alias uniqueness) that might be triggering 400/409 responses which are then reported as generic errors. Additionally, the automatic SKU generation needs to be more robust to handle edge cases and avoid manual overrides when not intended.

## Proposed Changes

### 1. Backend: Edge Function Hardening (`supabase/functions/manage-products/index.ts`)
- **Enhanced Error Details**: Ensure the `upsert` action returns specific error codes for Drive URL conflicts and Alias clashes so the frontend can show helpful toasts instead of a generic "non-2xx".
- **RLS Verification**: Double-check that the `service_role` client is used for all internal checks to bypass potential RLS delays or misconfigurations during validation.

### 2. Frontend: Admin UI Improvements (`src/pages/AdminProductEdit.tsx`)
- **SKU Generation Logic**:
    - Improve the slugification regex to handle more characters.
    - Add a "Regenerate SKU" button next to the field for when the user changes the title but already edited the SKU once.
- **Improved Error Handling**:
    - Update the `save` function to specifically handle the `requiresConfirmation` (409) response from the Edge Function if the Drive URL is changed.
    - Show specific toasts for SKU or Alias conflicts returned by the backend.
- **Image Upload Robustness**: Ensure the `ProductImageUploader` correctly passes the SKU to the bucket path even for new products (using the auto-generated one).

### 3. Database: Security & Permissions
- **Verify RLS**: Run a quick check on `digital_product_changes` and `product_upsells` to ensure the `authenticated` role has full access via the `has_role` function.
- **Grant Review**: Ensure `GRANT ALL` is explicitly applied to any newly discovered related tables.

## Verification Plan
1. **Automated Test**: Run a Playwright script to:
    - Navigate to `/admin/productos/nuevo`.
    - Enter a product name and verify auto-SKU generation.
    - Upload a dummy image and verify it lands in the `product-images` bucket.
    - Save the product and verify it appears in the list.
2. **Conflict Check**: Attempt to create a product with a duplicate SKU and verify the error message is clear.
