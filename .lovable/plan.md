# Plan: SEO AI Enhancements for Product Gallery and Metadata

The user reports that the AI SEO generator for product gallery images is not working as expected, specifically missing text, title, and description. While the backend logic for generating and storing some of these fields exists, they are not properly exposed in the Admin UI for confirmation and editing, and the gallery description field is missing entirely.

## Proposed Changes

### 1. Admin UI (`src/pages/AdminProductEdit.tsx`)
- **Enhance AI Generator**:
    - Update the AI prompt to include a `gallery_description` field.
    - Explicitly ask for SEO-optimized `keywords`.
    - Handle the new fields in the response parsing logic.
- **Expose SEO Fields**:
    - Add a new section or fields in the "Gallery" card for:
        - **Gallery Title**: A text input for `gallery_metadata.gallery_title`.
        - **Gallery Description**: A textarea for `gallery_metadata.gallery_description`.
        - **Keywords**: A text input for `gallery_metadata.keywords`.
- **Logic Refinement**: 
    - Ensure that the `update` function correctly handles updates to `gallery_metadata`.
    - Make sure the cover image Alt Text is also clearly visible/editable.

### 2. Public View (`src/pages/ProductDynamic.tsx`)
- **Visual Improvements**:
    - Display the `gallery_description` below the `gallery_title` in the gallery section.
    - Pass the new `keywords` from `gallery_metadata` to the `SEO` component to improve search engine indexing.

## Verification Plan
- **Admin Flow**:
    1. Navigate to a product edit page.
    2. Click "Escribir con IA".
    3. Verify that the Title, Description, Alt Texts, and Keywords are populated in the new UI fields.
    4. Save the product and refresh to ensure data persistence.
- **Public Flow**:
    1. Visit the public product page.
    2. Inspect the HTML for `<meta name="keywords">`.
    3. Verify that the gallery section shows both the title and the new description.
