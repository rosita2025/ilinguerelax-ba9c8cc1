# Plan - Spanish Mastery System Updates

The user requested branding and price updates for the "Spanish Mastery System" (5,000 Spanish Words product). Specifically, branding should be "Spanish Mastery System - Digital Only", and the digital price should be $97 (reduced from $215). The physical book bundle should also be verified.

## User Preferences & Constraints
- Branding: "Spanish Mastery System"
- Digital Price: $97 (Original $215)
- Product: 5,000 Spanish Words with English Pronunciation
- Admin SKU: `5-000-spanish-words-with-english-pronunciation-digital`

## Proposed Changes

### Frontend Optimization
- Update `src/pages/ProductSpanish5000Digital.tsx`:
    - Change branding from "Spanish Relax - 5,000 Words" to "Spanish Mastery System - Digital Only".
    - Update pricing to $97 (Current) / $215 (Original).
    - Ensure features list matches the latest "Spanish Mastery System" requirements (5,000 words + 1,000 verbs + 500 questions + Grammar Guide).
- Update `src/pages/ProductSpanish5000.tsx`:
    - Ensure the "Digital Only" cross-sell matches the new $97 price.
    - Update comparison tables if applicable.
- Update `src/config/checkoutCatalog.ts`:
    - Set the `5000-spanish-words` item price to $97 and original price to $215.
    - Update region-based pricing (Global $97, LatAm $67, etc. - based on typical scaling for this tier).
- Update `src/components/ProductComparisonSpanish.tsx`:
    - Sync prices and branding.

### Technical Details
- Verify `useAdminPricing` hook usage in `ProductSpanish5000Digital.tsx` to ensure it doesn't override local hardcoded values incorrectly if the database hasn't been updated yet (though the plan will include updating the database values).

### Database Updates
- Update the `digital_products` table in Supabase (via `supabase--migration` or `supabase--insert`) for SKU `5-000-spanish-words-with-english-pronunciation-digital` to reflect the new price of $97 and name "Spanish Mastery System - Digital Only".

## Verification Plan
- Check the preview URLs for:
    - `/products/5-000-spanish-words-with-english-pronunciation-digital`
    - `/products/5-000-spanish-words-with-english-pronunciation-physical`
- Verify the "Shop Now" / "Buy Now" buttons in the cart and checkout reflect $97.
- Use Playwright to capture screenshots of the updated pricing and branding.
