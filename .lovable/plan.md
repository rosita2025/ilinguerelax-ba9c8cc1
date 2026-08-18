# Plan: Separate "1,000 Words" and "100 Maps" into Different Options

The user clarified that the main product should be **"1,000 Essential Words"** and that the **"100 Mind Maps"** should be a separate option (likely an upsell or a distinct selection) rather than being bundled together by default in the main title.

## Proposed Changes

### Configuration
#### [checkoutCatalog.ts](src/config/checkoutCatalog.ts)
- Update `coreano-100-mapas` entry:
    - Change `name` to "Coreano Sin Complicaciones · 1,000 Palabras Esenciales (PDF)".
    - Change `description` to focus only on the 1,000 words.
    - Add the **100 Mind Maps** as an `upsell`.

### Product Page
#### [ProductCoreanoRelax.tsx](src/pages/ProductCoreanoRelax.tsx)
- Update `handleBuyStore` metadata to match the 1,000 words focus.
- Update `SEO` component props (title/description).
- Update `StickyBuyBar` productName.

### Components
#### [CoreanoHeroRedesign.tsx](src/components/coreano/CoreanoHeroRedesign.tsx)
- Remove "Incluye +100 Mapas Mentales" from the benefits list in the hero if it's no longer part of the base product.
- Adjust the subtitle/description to focus on the 1,000 words.

#### [CoreanoFeaturesGrid.tsx](src/components/coreano/CoreanoFeaturesGrid.tsx)
- Update the "1,000 PALABRAS" feature description to remove the mention of 100 maps if they are now separate.

#### [CoreanoBonuses.tsx](src/components/coreano/CoreanoBonuses.tsx)
- Ensure the bonuses reflect the new structure.

## Technical Details
- The price remains $12 USD for the base 1,000 words product.
- The "100 Mind Maps" will be added as an `UpsellItem` in the catalog so it appears in the checkout drawer as an optional add-on.

## Verification Plan
- Check the Korean product page to ensure the title and benefits only mention 1,000 words.
- Click "Buy" to verify the checkout drawer shows the 1,000 words product and offers the 100 maps as an upsell.
