# Plan: Fix Disappearing Gallery Images

The user reported that uploading 3-5 images for a new product works in the UI, but they disappear after saving. I have identified and fixed a mapping issue in both the frontend payload and the backend Edge Function.

## Proposed Changes

### 1. Frontend: AdminProductEdit.tsx
- Updated the `save` function to explicitly include `gallery_images` in the payload.
- Added a safety check to ensure it's always an array.
- Avoided accidental shadowing of the `gallery_images` variable.

### 2. Backend: manage-products Edge Function
- Updated the logic to correctly extract `gallery_images` from the incoming request.
- Added validation to ensure only valid URLs are stored.
- Limited the gallery to 5 images as per requirements.

### 3. Database & Security
- Verified that the `gallery_images` column exists in the `digital_products` table.
- Confirmed that RLS policies allow `authenticated` admins to perform `ALL` operations.

## Verification Plan

### Automated Verification
- I will use a debug script `src/lib/debug-gallery.ts` to query the database directly for a specific SKU to confirm the images are persisted.

### Manual Verification
1. Go to `/admin/productos/nuevo`.
2. Upload 3 gallery images.
3. Save the product.
4. Refresh the page or view the product to confirm images are still present.
