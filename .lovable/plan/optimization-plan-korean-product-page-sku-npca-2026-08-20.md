# Optimization Plan - Korean Product Page (SKU: npca)

The goal is to optimize high-conversion layout for the "2,000 Essential Korean Words" product page, ensuring relevant previews and real social proof (WhatsApp reviews) are correctly implemented.

## User Requirements
- Target Page: `https://ilinguerelax.com/products/2-000-palabras-esenciales-para-aprender-coreano-hangul-pronunciacion-para-hispanohablantes-npca`
- Previews: Add 3 specific preview images (Cover, Index, Vocabulary Table) provided as references.
- Testimonials: Use the WhatsApp-style testimonials (`ResenasWhatsAppCoreano`) with real Korean learning context.
- Layout: Optimize for high volume/mobile (compact vertical spacing).
- Translations: Ensure all UI text is professional English.

## Technical Details

### Frontend Components
- `src/pages/ProductDynamic.tsx`:
    - Ensure `previewAssets` correctly filters for the `npca` SKU using the referenced Korean preview assets.
    - Confirm the `ResenasWhatsAppCoreano` section is active and correctly positioned below the primary content.
    - Apply compact layout styling (reduced padding/margins) consistent with other optimized products (like CMB7).
- `src/components/ResenasWhatsAppCoreano.tsx`:
    - Verify data represents Korean learning context (references to "mapas mentales de coreano" and language guides).

### Assets
- Import and map new Korean preview assets (Cover, Index, Table) in `ProductDynamic.tsx`.

## Verification Plan

### Manual Verification
- Navigate to the `/products/npca` route.
- Confirm "Look Inside" gallery shows the 3 new Korean preview images.
- Confirm WhatsApp testimonials section appears with English labels.
- Verify mobile scroll length is minimized through compact spacing.

### Automated Tests
- Run `lovable-exec test` to ensure no regressions in routing or component loading.
