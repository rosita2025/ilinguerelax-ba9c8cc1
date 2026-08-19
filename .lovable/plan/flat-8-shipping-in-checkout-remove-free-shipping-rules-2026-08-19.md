# Flat $8 shipping in checkout — remove free shipping rules

Shipping in `/checkouts/:sku` becomes a single flat fee: **$8 USD for every country**, charged whenever the order contains a physical product. No free-shipping threshold, no free shipping for upsells. Digital-only orders stay at $0.

## Changes

1. **Remove the $50 free-shipping threshold** in the three places it is duplicated:
   - `src/hooks/useCheckoutTotal.ts` (source of truth for totals)
   - `src/components/checkout/OrderSummary.tsx`
   - `src/components/checkout/PaymentMethodsGroup.tsx`

2. **Remove upsell-based free shipping**: the `hasUpsell` exception in `useCheckoutTotal.ts` goes away. Physical orders always pay shipping.

3. **Flat $8 worldwide**: change `const n = isLatam ? 9 : 8` to `8` in `OrderSummary.tsx` and `PaymentMethodsGroup.tsx`. LATAM no longer pays $9.

4. **UI copy**: the order summary stops showing "Envío Gratis" / "Envío Gratis (Upsell)" for physical items and shows the $8 charge (converted to local currency as it does today). Digital-only orders keep "Gratis (Entrega Digital)".

## Not touched

- Stripe, dLocal Go and any other gateway code is left untouched. They already read `totalUsd` from `useCheckoutTotal`, so the corrected amount flows through automatically and stays in sync.
- Cart drawer and product pages outside the checkout flow are out of scope for this change.

## Verification

- Digital-only order: shipping row shows free digital delivery, total unchanged.
- Single physical order: shipping $8 (local equivalent), total = subtotal - discount + 8.
- Physical + upsell: still $8 shipping, no free-shipping label.
- Physical order over $50: still $8 shipping.
- Confirm `totalUsd` sent to the gateways matches the displayed total in each case.
