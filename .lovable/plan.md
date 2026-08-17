# Plan: Final Branding & Preview Refinement

Synchronize the Spanish Mastery System page with specific naming conventions for bonuses and study materials, while removing redundant gallery items.

## User Review Required

> [!IMPORTANT]
> - The user wants to update specific titles for the preview assets:
>   - "Grammar Mastery" -> "Grammar Master A1 to C1"
>   - "Daily Study Planner" -> "Daily Study Planner 6 months a 1 years"
> - The user mentioned removing duplicates ("borra esa"). I will check the "Look Inside" gallery for visual duplicates between the original generic previews and the new asset-based ones.

## Proposed Changes

### Content Updates

#### `src/pages/ProductSpanish5000Digital.tsx`
- **Preview Gallery Updates**:
  - Update title: "Grammar Mastery" to **"Grammar Master A1 to C1"**.
  - Update title: "Daily Study Planner" to **"Daily Study Planner 6 months to 1 year"** (matching user's request for "6 months a 1 years").
- **Asset Consolidation**:
  - Remove the original generic imports `previewSpanishIndex`, `previewSpanishVocab`, and `previewSpanishPhrases` from the `Look Inside` gallery as they are redundant with the specific asset-based previews now being used.

## Technical Details

- **Titles**:
  - Line 469: `title: "Grammar Master A1 to C1"`
  - Line 484: `title: "Daily Study Planner 6 months to 1 year"`
- **Gallery Trimming**: Remove lines 446-461 in the `Look Inside` gallery array to eliminate the old generic placeholders.

## Validation Plan

- Verify the gallery contains only the 5 high-quality asset-based previews (Exam, Grammar, Verbs, Questions, Planner).
- Confirm the new titles are correctly displayed in the gallery.
