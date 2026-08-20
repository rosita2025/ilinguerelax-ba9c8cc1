# Plan: Physical Product Upsell & Navigation

The user wants to add an option to buy the physical book on product pages, specifically for the "5,000 Spanish Words" digital product (CMB7), and update the "What our customers are saying" section.

## Proposed Changes

### 1. `src/pages/ProductDynamic.tsx`
- Add a high-visibility card for the Spanish Mastery System (CMB7 SKU) asking "Would you like the physical book?".
- Link the button to `https://ilinguerelax.com/products/5-000-spanish-words-with-english-pronunciation-physical`.
- Position this before the testimonials section.

### 2. `src/pages/ProductSpanish5000.tsx` (Physical Product Page)
- Update the "Digital Alternative Option" or the "Digital-only alternative" footer card to include a clear choice between digital and physical.
- Ensure the physical book link is consistent.

### 3. `src/components/LooxStyleReviews.tsx`
- Ensure the section title "What our customers are saying" is clearly visible and correctly localized if necessary (though the user request is in English/Spanish mixed, the app is primarily EN/ES).

## Technical Details
- Use the existing `Link` component for internal routing.
- Style the new upsell card to match the dark aesthetic of the CMB7 product page.
- Maintain mobile responsiveness and compact layout.

## Verification
- Check the CMB7 product page for the new physical book upsell card.
- Verify the link correctly navigates to the physical product page.
- Check the physical product page's digital alternative section.
