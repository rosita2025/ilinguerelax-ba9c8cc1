# Plan: Korean Product Optimization

Refine the Korean product page to focus exclusively on the **"1,000 Palabras Esenciales"** product, removing all mentions of "100 Mapas Mentales" as the primary offer and ensuring visual consistency with the 1,000 words branding.

## Proposed Changes

### Configuration & Data
- Update `src/config/checkoutCatalog.ts` for the `coreano-100-mapas` key:
    - Change `name` to "Coreano Sin Complicaciones · 1,000 Palabras Esenciales (PDF)".
    - Ensure `description` matches the 1,000 words focus.
    - Confirm the `upsell` for "+100 Mapas Mentales" remains separate for $5.

### Product Page (`src/pages/ProductCoreanoRelax.tsx`)
- Update `trackInitiate` metadata to use "1,000 Palabras Esenciales" instead of "100 Mapas Mentales".
- Update the subscription logic in `handleSubscribe` (metadata only).
- Refine the `FAQ` content if any stray "Mapas Mentales" mentions remain.
- Update `StickyBuyBar` `productName` to "Coreano · 1,000 Palabras Esenciales".
- Ensure the `features` array is strictly about the 1,000 words.

### UI Components (`src/components/coreano/`)
- **CoreanoHeroRedesign.tsx**: 
    - Verify title: "Aprende las 1,000 palabras esenciales del coreano 🇰🇷".
    - Update benefit list to ensure no "Mapas" are mentioned as part of the base offer.
- **CoreanoFeaturesGrid.tsx**: 
    - Ensure the "1,000 PALABRAS" card is the highlight.
- **CoreanoBonuses.tsx**: 
    - Verify that the 100 expressions and writing exercises are the only bonuses shown.
- **CoreanoUpdates.tsx**: 
    - Confirm it focuses on the expansion to 2,000 words.
- **CoreanoHowItWorks.tsx**: 
    - Ensure the PDF preview reflects a vocabulary list format (1,000 words).
- **WhatsAppTestimoniosCoreano.tsx** & **ResenasWhatsAppCoreano.tsx**:
    - Update descriptions to mention "1,000 Palabras Esenciales" instead of "100 Mapas Mentales" where appropriate.

### Navigation & Banners
- **CoreanoLaunchBanner.tsx**: 
    - Update the fallback product name and description to "1,000 Palabras Esenciales".

## Technical Details
- Using existing `digital_products` database values (SKU: `100-mapas-mentales-para-aprender-coreano-hangul-c1`).
- Price remains at **$12 USD**.
- URL remains `/products/1-000-palabras-esenciales-para-aprender-coreano`.

## Validation Plan
- Visual inspection of the product page at the specified URL.
- Verify cart contents after clicking "Comprar" to ensure it shows "1,000 Palabras Esenciales".
- Check for any residual "100 mapas" text using `grep`.
