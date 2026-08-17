# Plan: Final Branding Cleanup for Spanish Mastery System

Refine the "Spanish Mastery System" product page by removing mentions of "3 free bonuses" (now that they are considered part of the system) and updating the FAQ to reflect the correct product bundle and pricing (removing specific $22 references).

## Changes

### `src/pages/ProductSpanish5000Digital.tsx`

- **Hero & Copy Updates**:
  - Update the price block subtitle to remove "Includes 3 free bonuses".
  - Change the final CTA section text to remove "3 free bonuses" and mention that the price will increase when the Audio Edition is released.
- **FAQ Section Updates**:
  - Question 1: Remove "and the 3 free bonuses".
  - Question 2: Remove the specific "$22" price mention.
- **Bonuses Section Styling**:
  - Update the badge/header to simply say "Everything Included" or similar, avoiding the "3 exclusive bonuses" branding.

## Technical details
- Literal text replacements in `src/pages/ProductSpanish5000Digital.tsx`.
- No changes to logic or data structures.

## Verification
- Visual inspection of `/products/5-000-spanish-words-with-english-pronunciation-digital`.
- Confirm "3 free bonuses" mentions are gone.
- Confirm FAQ mentions are updated.
- Confirm "Price will increase" warning is present.
