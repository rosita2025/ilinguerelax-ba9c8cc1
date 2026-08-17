# Plan: Remove Bonuses Section

The user wants to completely remove the "Bonuses Section" from the Spanish Mastery System product page (`src/pages/ProductSpanish5000Digital.tsx`). This includes the header "Added to your download at no extra cost" and the individual bonus cards (Spanish Exam Test, Daily Planner, and 1,000 Essential Verbs).

## Proposed Changes

### Frontend

- **src/pages/ProductSpanish5000Digital.tsx**
    - Remove the entire `<section>` containing the bonuses (lines 517-577 approx).
    - Remove the `bonuses` constant array if it's no longer used.
    - Remove the `BonusPreviewDialog` component if it's no longer used.

## Technical Details

- Clean up unused imports related to bonuses (e.g., `Gift`, `bonus1Image`, `bonus2Image`, `bonus3Image`).
- Ensure no other parts of the page rely on the removed section or components.
