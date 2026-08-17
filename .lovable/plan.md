# Plan: Minimalist & Compact Design Overhaul

The user finds the current elements "too large" and "ugly". I will transition the design to a more minimal, Apple-like aesthetic that emphasizes compactness, high-quality typography, and subtle accents.

## Proposed Changes

### 1. `src/pages/ProductSpanishMastery.tsx` ($97 Bundle)
- **Refined Hero**: Change grid from `lg:grid-cols-2` to a more balanced layout where the image is slightly smaller (e.g., `lg:grid-cols-[0.8fr,1.2fr]`).
- **Elegant Purchase Card**: Remove heavy borders and shadow-2xl. Use a simple, clean card with `p-5`, `rounded-xl`, and a subtle border.
- **Typography**: Downscale H1 from `text-5xl` to `text-3xl` (desktop) to make it feel more sophisticated.

### 2. `src/pages/ProductSpanish5000Digital.tsx` ($30 Solo Digital)
- **Compact Layout**: Tighten the entire hero section. Reduce the sticky image size.
- **Micro-Copy**: Use smaller font sizes for secondary information to create a better hierarchy.
- **Buy Section**: Make the price and button block more compact, fitting better into the flow without being an "oversized" card.

### 3. `src/pages/ProductComparisonSpanish.tsx` (Comparison View)
- **Minimal Cards**: Remove `border-4` and `rounded-[2.5rem]`. Use `border`, `rounded-xl`, and `p-5`.
- **Vertical Spacing**: Reduce gaps to avoid excessive scrolling.

### 4. `src/components/StickyBuyBar.tsx`
- **Mobile optimization**: Ensure the bar is as slim as possible while remaining functional.

## Technical Details
- Use `text-2xl` to `text-3xl` for main headings.
- Standardize on `rounded-xl` for a more modern, less "bubbly" look.
- Use `bg-card` with very subtle `shadow-sm` instead of `shadow-2xl`.

## Verification Plan
- Preview all pages to ensure the "huge" elements are gone.
- Confirm that the layout feels "premium" and "compact".
- Check mobile responsiveness to ensure text fits comfortably.
