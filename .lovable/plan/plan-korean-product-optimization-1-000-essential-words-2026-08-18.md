# Plan: Korean Product Optimization (1,000 Essential Words)

Complete the transition of the Korean product page from "100 Mapas Mentales" to "**1,000 Palabras Esenciales**". This involves updating metadata, assets, previews, and ensuring the correct database SKU is linked to the page and checkout.

## Proposed Changes

### Configuration & Routing
- **`src/pages/ProductCoreanoRelax.tsx`**:
    - Change `ADMIN_SKU` to `"1-000-palabras-esenciales-para-aprender-coreano"`.
    - Change `id` to `"coreano-1000-palabras"`.
    - Update `trackInitiate` metadata.
    - Update `handleBuyStore` to use the correct ID and name.
    - Update `TIENDA_CHECKOUT_PATH` to `/checkouts/1000-palabras-coreano` (and ensure this exists in the catalog).
- **`src/config/checkoutCatalog.ts`**:
    - Add or update the entry for the 1,000 words product.
    - Ensure `adminSku` matches `"1-000-palabras-esenciales-para-aprender-coreano"`.
    - Add `"coreano-100-mapas"` as an optional upsell.

### UI & Assets
- **`src/pages/ProductCoreanoRelax.tsx`**:
    - Update the `coverAsset` reference or use the URL from the database.
    - Change the "Vista previa" section title from "Mira dentro del ebook" (referencing maps) to focus on the vocabulary lists.
    - Update the carousel captions to "Listado de palabras", "Pronunciación práctica", etc.
- **`src/components/coreano/CoreanoHeroRedesign.tsx`**:
    - Update the mockup image and floating badges.
- **`src/pages/VistaPreviaCoreano.tsx`**:
    - Update titles, SEO, and content to reflect the "1,000 Palabras Esenciales" product.
    - Remove or update references to "+100 Mapas Mentales".

### SEO & Keywords
- Update `keywords` in `src/pages/ProductCoreanoRelax.tsx` to prioritize vocabulary and pronunciation over "mapas mentales".

## Technical Details
- **Primary SKU**: `1-000-palabras-esenciales-para-aprender-coreano` (Drive: `..._Naco`).
- **Upsell SKU**: `100-mapas-mentales-para-aprender-coreano-hangul-c1` (Drive: `...SQU4GLc`).
- Preservation: All existing Drive links in the database will remain untouched.

## Validation Plan
- Verify that the "Comprar" button adds the correct product to the cart.
- Check the preview page (`/vista-previa/coreano-100-mapas-mentales` or new URL) to ensure it shows the correct titles.
- Use `rg` to ensure no "100 mapas" text remains in primary customer-facing areas of the Korean page.
