# Plan: Relocate Physical Book Upsell

The user wants to move the "Physical Book" upsell card on the digital product page (CMB7 SKU). Instead of being placed at the top of the reviews section, it should be placed below the "What our customers are saying" (Loox Reviews) section.

## Proposed Changes

### 1. `src/pages/ProductDynamic.tsx`
- Remove the Physical Book upsell card from its current position (above `ResenasWhatsAppCoreano`).
- Add the same Physical Book upsell card *after* the `LooxStyleReviews` component.
- Maintain the conditional check for the CMB7 SKU.
- Ensure proper spacing between the reviews and the upsell card.

## Technical Details
- The card will be relocated to line ~568, after the `Suspense` block for `LooxStyleReviews`.
- Use a `div` with margin-top to separate it from the reviews.

## Verification
- Visit the CMB7 product page.
- Scroll down to the reviews.
- Confirm the Physical Book card appears *after* the reviews section.
- Verify the WhatsApp reviews still appear in their original position (above Loox reviews).
