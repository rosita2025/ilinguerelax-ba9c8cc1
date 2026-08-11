# Plan: Review and Optimize "5,000 Words" and "Special Patterns" Product Pages

Ensure the product pages for "5,000 Words" and "Special Patterns" are fully optimized for regional pricing, tracking, and clarity.

## 1. Optimize `Product5000.tsx`
- [ ] Import `DigitalProductNotice` component.
- [ ] Add `DigitalProductNotice` under the price section in the Hero area to clarify it's a PDF.
- [ ] Update `StickyBuyBar` to pass `currencyCode={displayCurrency}` and `flag={tier.country ? getFlagEmoji(tier.country) : undefined}`.
- [ ] Refine `handleBuy` to ensure it uses the latest `priceUSD` and regional prices from the `tier` object.
- [ ] Ensure all Meta Pixel events (`AddToCart`, `InitiateCheckout`) are fired only for internal checkouts to avoid double-counting on Hotmart.

## 2. Optimize `ProductPatronesEspeciales.tsx`
- [ ] Refactor pricing logic to use `useCountryTierRouting` (replacing `useRegionTier` and manual logic) to unify the behavior with other product pages.
- [ ] Import `DigitalProductNotice`.
- [ ] Add `DigitalProductNotice` under the pricing section in the Hero area.
- [ ] Update `StickyBuyBar` with `currencyCode` and `flag` props.
- [ ] Update the primary CTA buttons to fire `trackHotmartEvent("InitiateCheckout", ...)` only when navigating to the internal store.
- [ ] Update `handleAddToCart` to fire `trackHotmartEvent("AddToCart", ...)` explicitly.

## 3. Localization and Currency Refinement
- [ ] Ensure `detectCurrency` and `formatPrice` are used consistently.
- [ ] Verify that the `StickyBuyBar` correctly handles "very long prices" (e.g., COP, ARS) on mobile.

## 4. Quality Check
- [ ] Verify SEO tags (headings, meta description).
- [ ] Check responsive layout on mobile vs desktop.
- [ ] Ensure watermarks are visible on preview images.
