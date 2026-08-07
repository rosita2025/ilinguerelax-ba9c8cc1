# Fix: Missing Gallery Images Persistence

The `gallery_images` column was added to the database, but the `manage-products` Edge Function was not updated to map this field into the `row` object before saving to Supabase. This caused all gallery images to be lost during the upsert process.

## Changes
- **Edge Function (`supabase/functions/manage-products/index.ts`)**: Add `gallery_images` to the `row` object in the `upsert` action, ensuring it is treated as a text array and limited to 5 items.
- **Frontend (`src/pages/AdminProductEdit.tsx`)**: Ensure `gallery_images` is explicitly included in the payload sent to the Edge Function.

## Validation
- [ ] Upload 3-5 images in the admin panel.
- [ ] Save the product.
- [ ] Verify that the images persist after saving and are visible on the product page.
