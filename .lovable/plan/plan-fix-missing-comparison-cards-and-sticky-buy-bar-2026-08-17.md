# Plan: Fix Missing Comparison Cards and Sticky Buy Bar

The user reported that the "2 clear cards" (comparison cards) and the "Sticky Buy Bar" are missing. This likely refers to the new comparison flow for the Spanish 5,000 Words product.

## Proposed Changes

### 1. Navigation & Linking
- **`src/pages/ProductSpanish5000.tsx` (Physical Book page)**: Update the "Digital Only" button to link to the comparison page (`/products/5-000-spanish-words-with-english-pronunciation`) instead of directly to the digital page. This gives the user a clear choice between the $22 and $34.99 options.
- **`src/pages/ProductSpanish5000Digital.tsx` (Digital Book page)**: Add a small "Need the physical book?" link or button that points to the comparison page.

### 2. Comparison Page Enhancements
- **`src/pages/ProductComparisonSpanish.tsx`**:
    - Add the `StickyBuyBar` component to this page to maintain high conversion.
    - Pass short high-conversion testimonials to the `StickyBuyBar`.
    - Ensure the "2 cards" are prominent and clear on all screen sizes.

### 3. Component Visibility
- **`src/components/StickyBuyBar.tsx`**: Review the `dismissed` logic to ensure it doesn't hide the bar in a way that makes the user think it's gone entirely. I'll add a subtle "Restore" icon or ensured it re-opens if the user scrolls back to key conversion points.

### 4. Route Verification
- Double-check `App.tsx` routes to ensure no typos are preventing the pages from loading.

## Technical Details
- The comparison page will now use `useCountryTierRouting` (if needed) or just the standardized pricing defined in the cards.
- Testimonials will be synchronized across the product family.

## Verification Plan
- **Manual Verification**: Navigate to `/products/5-000-spanish-words-with-english-pronunciation` and confirm the 2 cards and Sticky Buy Bar are visible.
- **Navigation Check**: Click "Digital Only" on the physical page and confirm it leads to the comparison page.
- **Responsive Check**: Verify the comparison cards stack correctly on mobile.
