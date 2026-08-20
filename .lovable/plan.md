# Plan: Copy Design to Dynamic Product Route

The user wants to copy the high-conversion design of `ProductSpanish5000Digital.tsx` (the "Spanish Mastery System") to the dynamic product route used by `5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7`. The goal is to keep the target product's title, cover image, and pricing while adopting the "tristiplot" (Trustpilot), testimonials, and visual preview layout.

## User Review Required

> [!IMPORTANT]
> - The target SKU `5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7` is handled by the `ProductDynamic.tsx` component, which fetches data from the database.
> - I will modify `ProductDynamic.tsx` to include the high-conversion sections (Trustpilot badge, expanded benefits, "Look Inside" gallery, and enhanced FAQ) while ensuring it still uses the database values for the title, price, and cover image.

## Proposed Changes

### 1. `src/pages/ProductDynamic.tsx` (Target Component)
- Add Trustpilot "Excellent" badge above the product title.
- Integrate the `ResenasWhatsAppCoreano` style testimonials or the `LooxStyleReviews` gallery depending on the context (the user mentioned "testimonios" and "tristiplot"). I will adapt `LooxStyleReviews` as it matches the "Spanish Relax" aesthetic better.
- Add the "Look Inside" section with the grid of preview images.
- Enhance the benefits list to match the 2-column grid style from the source page.
- Update the FAQ section to be more comprehensive like the one in `ProductSpanish5000Digital`.
- Ensure the header, hero, and sticky bar maintain their existing logic for dynamic data.

### 2. Assets and Components
- Ensure all necessary lucide icons are imported (`Star`, `Eye`, `Shield`, etc.).
- Use the preview image assets already present in the project.

## Verification Plan

### Automated Tests
- Run `lovable-exec test` to ensure no regressions in checkout logic.
- Verify `ProductDynamic.tsx` still renders correctly for other SKUs.

### Manual Verification
- View `/products/5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7` in the preview.
- Confirm the title, price, and cover image match the database entry for that SKU.
- Verify the new design sections (Trustpilot, Look Inside, Testimonials) are visible and styled correctly.
