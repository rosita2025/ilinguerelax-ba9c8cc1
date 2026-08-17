# Plan: Add High-Conversion Mini-Testimonials to Sticky Buy Bar

The user wants to add "small testimonials" to the high-conversion `StickyBuyBar` for the "Mastery Spanish" page (`ProductSpanish5000Digital`). This aims to increase social proof at the point of purchase.

## Proposed Changes

### 1. Components
#### `src/components/StickyBuyBar.tsx`
- Add a new `testimonials` prop to accept an array of small social proof strings or objects.
- Implement a rotating "mini-testimonial" display within the sticky bar, specifically for mobile and desktop layouts where space allows.
- Style these testimonials to be "small" (compact text, maybe with a star or avatar icon) as requested.

### 2. Pages
#### `src/pages/ProductSpanish5000Digital.tsx`
- Define a set of specific, high-conversion short testimonials (e.g., "Best Spanish book!", "Finally understood Ser vs Estar", "Fast delivery!").
- Pass these testimonials to the `StickyBuyBar` component.

## Technical Details
- The testimonials will rotate every few seconds using a simple interval.
- Animations will be handled via `framer-motion` for a smooth, high-quality feel.
- Layout: On mobile, it might appear just above the CTA button or next to the price. On desktop, it can occupy a more prominent spot in the bar.

## Verification Plan
- **Automated Check**: Verify that the `StickyBuyBar` renders without errors on the `ProductSpanish5000Digital` page.
- **Manual Verification**: Check the live preview to ensure the testimonials are visible, compact ("pequeñas"), and rotating as expected.
- **Responsive Check**: Ensure the sticky bar layout remains functional and doesn't become cluttered on small screens.
