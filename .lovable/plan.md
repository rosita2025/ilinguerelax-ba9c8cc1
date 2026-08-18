# Plan: Correct Korean Product Preview

The user reported that the preview for the "1,000 Essential Korean Words" product is incorrect ("equivocado se ha puesto la previa vista"). Upon inspection, several components and pages are still using assets and mockups from the "100 Mind Maps" product (like `mapaSaludos`, `mapaVocales`, etc., which are labeled as "Mapa Mental" in captions and alt text).

## Proposed Changes

### 1. Update Product Page Preview Assets
- Modify `src/pages/ProductCoreanoRelax.tsx` to replace the carousel items that reference "mapas mentales" with assets that represent the "1,000 Essential Words" list.
- Update captions and alt text to reflect "Palabras esenciales" instead of "Mapas mentales".

### 2. Update Preview Page
- Modify `src/pages/VistaPreviaCoreano.tsx` to update the `previews` array. 
- Ensure all alt text and captions refer to "Páginas del ebook de 1,000 palabras" and not "Mapa Mental N.º X".
- Update the video link if the current YouTube Short (`6kV0N5VKlWw`) specifically shows mind maps instead of the word list (pending verification of the video content if possible, but at minimum updating the metadata).

### 3. Update Hero Component Mockup
- Modify `src/components/coreano/CoreanoHeroRedesign.tsx` to ensure the overlapping preview image (`mapaSaludos`) is replaced or correctly labeled as a word list preview.

### 4. Asset Audit
- Identify if there are dedicated "listado de palabras" assets available in the repository to replace the "mapa-mental" ones. If not, I will update labels to be generic "Vista previa del ebook" to avoid confusing the buyer until the correct assets are provided.

## Technical Details
- All text changes will ensure that "1,000 Palabras Esenciales" is the focus.
- Captions like "Saludos y presentaciones" are fine, but "Mapa Mental N.º 2" must be removed.
- I will check `src/assets/` for any files related to "1000-palabras" that might have been missed.

## Verification Plan
- Inspect the `/products/1-000-palabras-esenciales-para-aprender-coreano` page in the preview.
- Inspect the `/vista-previa/coreano-1000-palabras` page.
- Verify that no customer-facing text mentions "Mapas Mentales" as the primary content of this specific product.
