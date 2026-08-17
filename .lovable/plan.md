# Plan: Compact and Elegant Design Refinement

The user finds the current design "too large" and "ugly". I will refine the UI to be more compact, professional, and visually balanced, focusing on the product cards and overall spacing.

## Proposed Changes

### 1. `src/pages/ProductSpanishMastery.tsx` ($97 Bundle)
- **Compact Hero Card**: Reduce padding from `p-8` to `p-6`. Change border radius from `rounded-[2.5rem]` to `rounded-2xl`.
- **Text Sizes**: Reduce the main heading size slightly and tighten the spacing.
- **Button**: Reduce the height of the main CTA button slightly for a more balanced look.

### 2. `src/pages/ProductSpanish5000Digital.tsx` ($30 Solo Digital)
- **Tighten Layout**: Further reduce vertical spacing between sections.
- **Card Styling**: Ensure the purchase block feels integrated rather than bulky.
- **Image**: Adjust the sticky image container to be less dominant.

### 3. `src/pages/ProductComparisonSpanish.tsx` (Comparison View)
- **Card Refinement**: Change `rounded-[2rem]` to `rounded-2xl`. Reduce padding from `p-8` to `p-6`.
- **Pricing Display**: Tighten the price block to make it more elegant.
- **Button Styling**: Make the buttons slightly more compact.

### 4. Global Refinements
- **Typography**: Ensure consistent use of weight and size to avoid a "cluttered" or "oversized" feel.
- **Borders & Shadows**: Use more subtle shadows and thinner borders to improve the "premium" aesthetic.

## Technical Details
- Adjust Tailwind classes for padding (`p-6` instead of `p-8`), rounded corners (`rounded-2xl` instead of `rounded-[2rem]`), and font sizes (`text-2xl` instead of `text-3xl` for sub-headings).
- Maintain all existing logic (pricing, tiers, redirects).

## Verification Plan
- Inspect all three target pages in the preview across mobile and desktop.
- Confirm that the cards look more balanced and less "oversized".
- Verify that the 7-day guarantee and security markers remain clearly visible.
