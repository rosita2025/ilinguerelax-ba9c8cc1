# Plan: Clean up unused assets and imports in Spanish Mastery System page

The user requested to remove unused imports (`previewSpanishIndex`) and confirmed a list of assets that were modified or removed in previous turns. I will clean up the imports and constants in `src/pages/ProductSpanish5000Digital.tsx` to match the current state of the page.

## Proposed Changes

### Frontend Edits

#### [src/pages/ProductSpanish5000Digital.tsx](src/pages/ProductSpanish5000Digital.tsx)
- Remove unused import `previewSpanishIndex`.
- Remove unused imports `bonus1Image`, `bonus2Image`, and `bonus3Image`.
- Ensure the `Look Inside` gallery and `What's Included` lists accurately reflect the requested content and pricing. (Already done in previous turns, but I'll verify the cleanup).

## Technical Details
- The user explicitly said "borra" (delete) for `previewSpanishIndex`.
- Previous turns removed the Bonuses section, so `bonus1Image`, `bonus2Image`, and `bonus3Image` are no longer needed.
- No functional logic changes, just asset and import cleanup.
