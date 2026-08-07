# Consistent LATAM local-currency number formatting

Goal: every local-currency amount shown to the buyer uses the same convention — **dot for thousands, comma for decimals** (e.g. `Bs.S 1.889,25`, `$ 43.900`, `S/ 39,90`). USD amounts keep the international style (`$13.99`).

## Current situation (verified)

- The central formatter `formatPrice` in `src/i18n/index.ts` already formats with `es-ES` (dot/comma) and is used by the product page, sticky bar, cart and checkout through `src/hooks/useLocalCurrency.ts`.
- Several places bypass it and print raw numbers, so they still show the wrong style:
  - `src/stores/checkoutStore.ts` — Peru totals formatted with `es-PE` (produces `S/ 1,889.25`).
  - `src/components/CartDrawer.tsx`, `src/components/checkout/UpsellPanel.tsx`, `src/components/checkout/OrderSummary.tsx`, `src/components/checkout/MoreProductsPanel.tsx` — soles amounts printed with `toFixed(2)` (dot decimals, no thousands separator).
  - `src/components/StickyBuyBar.tsx` — savings label printed with `toFixed`.
  - `src/components/checkout/PaymentMethodsGroup.tsx` — Hotmart price label uses the browser default locale, so the separators change per visitor.
  - `src/components/checkout/MercadoPagoButton.tsx` — displayed PEN total uses `toFixed`.

## What will change

1. Add one shared money formatter (in `src/i18n/index.ts`, next to `formatPrice`) that renders any non-USD amount with dot thousands / comma decimals, honouring each currency's decimal count (0 for COP, CLP, ARS, PYG, CRC; 2 for the rest).
2. Replace the raw `toFixed` / `es-PE` / default-locale money strings listed above with that formatter, so cart, order summary, upsells, sticky bar, payment buttons and product page all print identical strings.
3. Keep USD amounts in the international format (`$13.99`) so dollar prices are not confused with local ones.
4. Leave admin-only screens and backend/e-mail amounts untouched in this pass, except where the same helper is trivially reusable.

## Validation

- Load a product page and the checkout with `?currency=` forced to VES, COP, ARS, MXN and PEN, and confirm sticky bar, cart drawer, order summary and payment buttons print the same string in each case.
- Confirm the USD view is unchanged.
