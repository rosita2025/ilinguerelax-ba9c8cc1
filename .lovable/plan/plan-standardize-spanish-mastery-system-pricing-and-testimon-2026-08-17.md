# Plan: Standardize Spanish Mastery System Pricing and Testimonials

The user is reporting that the 2-card comparison and sticky testimonials are missing or not correctly updated on the Spanish Mastery System page (`ProductSpanish5000Digital.tsx`). I will verify and synchronize the pricing ($30 digital, $44 physical) and ensure the rotating testimonials are active in the `StickyBuyBar`.

## User Review Required

> [!IMPORTANT]
> - Digital Only price: **$30**
> - Physical + Digital Bundle price: **$44.00**
> - Refund Policy: **7 days** (Standardized across the site)

## Proposed Changes

### 1. Product Page (`src/pages/ProductSpanish5000Digital.tsx`)
- Standardize all text mentions of price to $30 (Digital) and $44 (Physical Upgrade).
- Ensure the "What's Included" list reflects the correct discounted prices.
- Verify the `StickyBuyBar` properties to ensure `testimonials` are being passed correctly.

### 2. Comparison Page (`src/pages/ProductComparisonSpanish.tsx`)
- Verify the two cards display $30 and $44.00 respectively.
- Ensure the CTAs reflect these amounts.

### 3. Sticky Component (`src/components/StickyBuyBar.tsx`)
- Ensure the rotating testimonial logic (every 4 seconds) is functioning and visibly rendered in both mobile and desktop layouts.
- Standardize the "7-day guarantee" text (already updated in previous turns, but will double-check).

## Technical Details
- Using `useAdminPricing` and `useCountryTierRouting` hooks to handle regional pricing.
- Testimonials are passed as an array to `StickyBuyBar` and managed by an internal `useEffect` timer.

## Validation Plan
- Inspect `src/pages/ProductSpanish5000Digital.tsx` for hardcoded price strings that need updating.
- Verify the `StickyBuyBar` implementation in that page includes the `shortTestimonials` array.
- Manually check `ProductComparisonSpanish.tsx` for pricing consistency.
