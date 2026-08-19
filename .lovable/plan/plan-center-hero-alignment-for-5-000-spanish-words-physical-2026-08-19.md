# Plan: Center Hero Alignment for 5,000 Spanish Words (Physical & Digital)

The user wants to improve the mobile layout of the "5,000 Spanish Words" product pages by centering the Hero section elements (title, description, benefits, and reviews).

## Changes

### 1. Frontend: Product Page Centering (`ProductSpanish5000.tsx`)
- Apply `text-center` and `mx-auto` to the main headline and description in the Hero.
- Center the benefits checkmark list while maintaining internal left-alignment for the icons.
- Center the reviews/ratings row (Stars, 4.8, Verified badge).
- Ensure the overall Hero container has proper centering classes for mobile.

### 2. Frontend: Digital Product Page Centering (`ProductSpanish5000Digital.tsx`)
- Apply identical centering logic to the digital version of the product page for consistency.

## Technical Details
- In `ProductSpanish5000.tsx`:
    - Update `h1` classes to include `text-center` (already has `md:text-left`).
    - Update `p` description classes to include `text-center md:text-left`.
    - Update `ul` (benefits) to be wrapped in a centering container or using `flex flex-col items-center sm:items-start`.
    - Update the reviews `div` to use `justify-center md:justify-start`.
- Similar changes for `ProductSpanish5000Digital.tsx`.

## Verification Plan
- Use Playwright to capture mobile screenshots (iPhone 12/13/SE viewport) of:
    - `https://ilinguerelax.com/products/5-000-spanish-words-with-english-pronunciation-physical`
    - `https://ilinguerelax.com/products/5-000-spanish-words-with-english-pronunciation-digital`
- Verify that elements are centered and visually balanced on mobile.
