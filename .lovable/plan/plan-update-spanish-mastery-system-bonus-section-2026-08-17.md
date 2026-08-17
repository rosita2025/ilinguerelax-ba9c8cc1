# Plan: Update Spanish Mastery System Bonus Section

Update the text in the "EVERYTHING INCLUDED" (bonuses) section of `src/pages/ProductSpanish5000Digital.tsx` to match the exact labels and descriptions requested by the user.

## User Review Required

> [!IMPORTANT]
> The user wants to update the bonus titles and descriptions to specific values.

## Proposed Changes

### `src/pages/ProductSpanish5000Digital.tsx`

#### [Bonuses Configuration]
- Update `bonuses` array (lines 76-98):
  - **Bonus #1**:
    - Title: `BONUS #1 · Spanish Exam Test`
    - Subtitle: `Measure your progress with self-graded tests.`
    - Value: `$19`
  - **Bonus #2**:
    - Title: `BONUS #2 · Daily Planner`
    - Subtitle: `A printable planner to keep your study routine consistent.`
    - Value: `$14`
  - **Bonus #3**:
    - Title: `BONUS #3 · 1,000 Essential Verbs`
    - Subtitle: `A guide with the tricky Spanish sounds and how to master them.`
    - Value: `$17`

## Technical Details
- The changes are localized to the `bonuses` constant at the top of the file.
- No changes to component logic or other sections are required for this specific request.
