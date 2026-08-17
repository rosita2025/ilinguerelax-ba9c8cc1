# Plan: Restore Preview and Bonuses sections

Restore the "Look Inside" and "Bonuses" sections that were accidentally removed during the "Spanish Mastery System" update.

## Changes

### `src/pages/ProductSpanish5000Digital.tsx`

- **Re-add Preview Section**: Insert a "Look Inside the Spanish Mastery System" section below the "What's Included" section. Use `previewSpanishVocab`, `previewSpanishPhrases`, and `previewSpanishIndex` images.
- **Restore Bonuses Section**: Insert the "Exclusive Bonuses Included" section below the Preview section. Use the existing `bonuses` array and `BonusPreviewDialog` component.
- **Adjust Layout**: Ensure the transitions between the new sections and the existing "How it works" and "Reviews" sections are smooth and visually consistent with the branding.

## Technical details
- Use the already imported assets (`previewSpanishVocab`, `previewSpanishPhrases`, `previewSpanishIndex`, `bonus1Image`, etc.).
- Utilize the `BonusPreviewDialog` component which is already defined in the file but currently unused in the JSX.
- Maintain responsive design and dark-themed accents consistent with the project's design tokens.

## Verification
- Visual inspection of the preview page at `/products/5-000-spanish-words-with-english-pronunciation-digital`.
- Verify the 3 preview images are visible with their descriptions.
- Verify the 3 bonuses are visible with their "See sample" buttons working.
