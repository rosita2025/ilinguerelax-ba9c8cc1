# Plan: Support for Multiple Images and AI-Powered Content Generation

The user wants to add support for 3-5 images per product (with preview) and automate product content creation using AI templates.

## Database Changes
- [x] Add `gallery_images` text array column to `digital_products` table.
- [x] Grant necessary permissions for the new column.

## Component Updates

### 1. `ProductImageUploader.tsx`
- Refactor to support multiple images (`value` as a string array).
- Allow uploading 3-5 images.
- Show previews for up to 3-5 images with individual "remove" buttons.
- Maintain existing WebP conversion and resizing logic.

### 2. `AdminProductEdit.tsx`
- Update the `Product` interface to include `gallery_images: string[]`.
- Add a new section in the form for gallery images using the updated `ProductImageUploader`.
- Integrate AI generation for product descriptions and details.
- Add an "AI Generate" button that uses the product name/category to create a description based on a predefined template.

## AI Implementation
- Create a helper function to call the AI Gateway to generate product content.
- Provide a clear prompt template that includes brand guidelines (iLingue Relax).
- Auto-populate description and other fields when AI generation is triggered.

## Verification Plan
- Verify that multiple images can be uploaded and appear in the gallery.
- Verify that AI generation produces relevant product content.
- Check that all data is correctly saved to the backend.
