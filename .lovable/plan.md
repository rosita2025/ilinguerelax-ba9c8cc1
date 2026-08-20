# Plan: Add Preview Tables for Spanish Mastery System (CMB7)

The user wants to add 3 new preview images (tables) to the "Look Inside" gallery for the Spanish Mastery System (CMB7) product page. These images show the vocabulary tables and the study planner layout.

## Proposed Changes

### Assets
- Create asset pointers for the 3 uploaded images:
  - `vocab-table-preview-1.png.asset.json` (from `image-318.png`)
  - `vocab-table-preview-2.png.asset.json` (from `image-319.png`)
  - `study-planner-preview-table.png.asset.json` (from `image-317.png`)

### Frontend (`src/pages/ProductDynamic.tsx`)
- Import the new asset pointers.
- Add these assets to the `previewAssets` array specifically for the CMB7 SKU (`5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7`).
- Update the filtering logic to include these new "Table" previews while keeping the existing relevant ones (Planner, Exam Pack, Flashcards).

## Technical Details
- Product SKU: `5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7`
- The `previewAssets` array will be updated to include:
  - `Vocabulary Table 1`
  - `Vocabulary Table 2`
  - `Study Planner Table`
  - `Study Planner (6 Months)`
  - `Spanish Exam Pack`
  - `Digital Flashcards`

## Verification Plan
- Navigate to the CMB7 product page: `/products/5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7`.
- Verify the "Look Inside the PDF" section shows the 6 preview thumbnails.
- Open each preview in the dialog to ensure the images load correctly.
