# Plan: Verify Product Image Uploads (WebP & Others)

The user wants to verify that the admin panel allows uploading WebP and other image formats without RLS errors. I have already implemented a robust V8 storage policy that grants full access to the `product-images` bucket.

## Proposed Actions

### 1. Verification Script
I will create a Playwright script to:
- Authenticate into the admin panel (using the injected session).
- Navigate to the "New Product" page (`/admin/productos/nuevo`).
- Simulate an image upload using a sample WebP or JPG file.
- Verify that the upload succeeds and the image URL is generated.
- Capture screenshots at each step to provide visual evidence.

### 2. Manual Test Guidance
I will provide the user with clear steps to manually verify the fix:
- Go to `/admin/productos/nuevo`.
- Try uploading a `.webp`, `.png`, or `.jpg` file.
- Confirm no "row-level security policy" error appears.

## Verification
- [ ] Run the Playwright script and check the output for any errors.
- [ ] Review screenshots to ensure the UI reflects a successful upload.
