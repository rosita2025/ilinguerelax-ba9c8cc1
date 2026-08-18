# Plan: Fix Korean Product Previews and Testimonials

Correct lingering references to "Mind Maps" (Mapas Mentales) and remove watermarks in the "1,000 Essential Korean Words" product flow to ensure visual consistency with the ebook content.

## User Review Required

> [!IMPORTANT]
> The current WhatsApp testimonials in `ResenasWhatsAppCoreano.tsx` mention "mapas mentales" in their text summaries. I will update these to focus on "vocabulario visual" or "1,000 palabras" to match the product.

## Proposed Changes

### Korean Product Page & Previews
#### [src/pages/ProductCoreanoRelax.tsx]
- Update preview captions and descriptions to ensure they strictly refer to "Listado de palabras" or thematic vocabulary lists.
- Confirm the `coverImageUrl` and storage path use the "1,000 palabras" asset.

#### [src/pages/VistaPreviaCoreano.tsx]
- Remove any residual "ilinguerelax.com" watermark text overlays or mentions in the grid.
- Update the YouTube Short description or context if it mentions mind maps.

#### [src/components/coreano/CoreanoHowItWorks.tsx]
- Update the mockup header to say "Listado de Palabras" instead of generic "Greetings".
- Ensure the sample words visual doesn't resemble a "mind map" structure but a clean list.

### Testimonials & Social Proof
#### [src/components/ResenasWhatsAppCoreano.tsx]
- Update the `resenas` array text summaries to replace "mapas mentales" with phrases like "material visual de vocabulario" or "listado de 1,000 palabras".

### Layout & Features
#### [src/components/coreano/CoreanoFeaturesGrid.tsx]
- Double-check that "1,000 PALABRAS" is the lead feature and "Mind Maps" is not mentioned.

## Verification Plan
1. **Visual Audit**: Navigate to `/products/1-000-palabras-esenciales-para-aprender-coreano` and check the carousel captions.
2. **Preview Audit**: Navigate to `/vista-previa/coreano-1000-palabras` to verify watermark removal and page numbering captions.
3. **Testimonial Check**: Verify the WhatsApp slider text does not mention "mapas mentales".
