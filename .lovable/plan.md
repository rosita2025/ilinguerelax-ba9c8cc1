# Plan: Direct UI Shrink & Refinement

The user is unhappy with the "huge" and "ugly" cards. I will immediately shrink all oversized elements, reduce padding, and simplify the design to be more professional and compact.

## Proposed Changes

### 1. Shrink Purchase Cards
- In `ProductSpanishMastery.tsx` and `ProductSpanish5000Digital.tsx`:
    - Reduce padding from `p-8` to `p-5`.
    - Change border radius from `rounded-[2.5rem]` to `rounded-xl`.
    - Reduce border thickness from `border-4` to `border`.
    - Remove `shadow-2xl` and use `shadow-sm`.
    - Shrink the price text from `text-5xl` to `text-3xl`.

### 2. Compact Comparison Layout
- In `ProductComparisonSpanish.tsx`:
    - Reduce card padding from `p-8` to `p-5`.
    - Change radius from `rounded-[2rem]` to `rounded-xl`.
    - Remove `scale-105` on the popular card to stop it from feeling "huge".
    - Reduce button height.

### 3. Tighten Hero Sections
- Reduce vertical padding in hero sections.
- Make product images smaller in the grid.

### 4. Typography Clean-up
- Decrease main heading sizes by one step (e.g., `text-5xl` -> `text-4xl`).

## Technical Details
- Focus on Tailwind classes: `p-5`, `rounded-xl`, `border`, `shadow-sm`, `text-3xl`.
- Ensure mobile layout remains usable but compact.

## Verification
- Verify that no element feels "massive" or "oversized".
- Confirm that the total page length (scroll) is reduced.
