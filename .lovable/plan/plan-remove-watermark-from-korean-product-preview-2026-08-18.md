# Plan: Remove Watermark from Korean Product Preview

The user wants to remove the watermark from the "Mira dentro del ebook" section on the Korean product page. This section contains a mockup of a PDF page with sample words and a watermark overlay.

## Proposed Changes

### Frontend Components

#### `src/components/coreano/CoreanoHowItWorks.tsx`
- Remove the watermark element (lines 84-87) which overlays the "ILINGUE RELAX" text.

#### `src/pages/ProductCoreanoRelax.tsx`
- Update the subtitle of the preview section (line 208) to remove the mention of "Marca de agua incluida".

## Technical Details
- The watermark in `CoreanoHowItWorks.tsx` is an absolute-positioned `div` with `pointer-events-none` and low opacity.
- The text in `ProductCoreanoRelax.tsx` is a descriptive paragraph within the "Vista previa · Páginas reales" section.

## Verification Plan

### Automated Tests
- N/A (Visual UI change)

### Manual Verification
- Navigate to `https://ilinguerelax.com/products/1-000-palabras-esenciales-para-aprender-coreano` (or local preview).
- Scroll down to the "Así aprenderás las palabras" section and verify the diagonal "ILINGUE RELAX" watermark is gone from the mockup.
- Scroll further down to the "Mira dentro del ebook" carousel and verify the subtitle no longer says "Marca de agua incluida".
