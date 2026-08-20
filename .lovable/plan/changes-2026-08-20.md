---
name: Korean 2000 Product Optimization
description: Update product page for "2000 Essential Korean Words" (NPCA) with WhatsApp testimonials and new preview assets.
type: feature
---

The user wants to optimize the product page for the "2000 Essential Korean Words" ebook (SKU: `2-000-palabras-esenciales-para-aprender-coreano-hangul-pronunciacion-para-hispanohablantes-npca`).

### Changes
- **Preview Assets**: Update the "Look Inside" gallery with 3 new images from the user uploads: cover, category index, and vocabulary table.
- **WhatsApp Testimonials**: Enable the `ResenasWhatsAppCoreano` component for this SKU to show high-conversion social proof.
- **Physical Book Removal**: Ensure the "Physical Book" upsell card (currently in `ProductDynamic.tsx`) is hidden for this SKU, as it's a digital-only product.
- **Translations/Copy**: Ensure all UI elements for this product are appropriately handled (the product name and description are already in the DB).

### Technical Details
- File: `src/pages/ProductDynamic.tsx`
- New Assets (pointers created):
    - `src/assets/previews/korean-2000-cover.asset.json`
    - `src/assets/previews/korean-2000-table.asset.json`
    - `src/assets/previews/korean-2000-index.asset.json`
- Logic update: Add the Korean NPCA SKU to the conditional rendering of `ResenasWhatsAppCoreano` and the gallery filter.
