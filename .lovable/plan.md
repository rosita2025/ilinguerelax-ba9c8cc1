# Plan: Spanish Mastery System - Product Alignment and High-Conversion Improvements

The user wants to align the products for the "Spanish Mastery System", ensure consistent pricing ($30 digital, $44 physical bundle), and improve the high-conversion elements (StickyBuyBar testimonials and layout) on the digital product page.

## Proposed Changes

### 1. `src/pages/ProductSpanish5000Digital.tsx` (Digital Only - $30)
- Update product title to "Spanish Mastery System - Digital Only".
- Ensure price is $30 USD (original $43).
- Update the "Upgrade to Physical" section to point to the comparison page `/products/5-000-spanish-words-with-english-pronunciation`.
- Standardize the 7-day refund policy (already mostly done, but verify).
- Ensure high-conversion layout is clean.

### 2. `src/pages/ProductSpanish5000.tsx` (Physical + Digital - $44)
- Update pricing to $44.00 USD (original $59).
- Ensure "Digital Only" button links to the comparison page `/products/5-000-spanish-words-with-english-pronunciation`.
- Standardize the 7-day refund policy.

### 3. `src/pages/ProductComparisonSpanish.tsx` (Comparison Page)
- Ensure Digital is $30 and Physical Bundle is $44.00.
- Verify meta descriptions and titles.

### 4. `src/components/StickyBuyBar.tsx` (Sticky Bar)
- Ensure `testimonials` are being rendered correctly in the mobile layout.
- Adjust vertical spacing and font sizes for mobile to prevent "stuck" or overlapping elements.
- Ensure 7-day guarantee is visible.

## Technical Details
- Use `useI18n` for localized formatting.
- Ensure `StickyBuyBar` receives the `shortTestimonials` array.
- Update `products` array in `ProductComparisonSpanish.tsx`.
- Update constants in `ProductSpanish5000Digital.tsx` and `ProductSpanish5000.tsx`.

## Verification Plan
- Check the 3 URLs in the preview:
  1. `/products/5-000-spanish-words-with-english-pronunciation-digital`
  2. `/products/5-000-words-spanish-with-pronunciation-english-nwna` (This seems to be another digital SKU, I should check if it needs syncing or redirection).
  3. `/products/5-000-spanish-words-with-english-pronunciation-physical`
- Verify the comparison page: `/products/5-000-spanish-words-with-english-pronunciation`.
- Inspect the `StickyBuyBar` on mobile view to confirm testimonials rotate.
