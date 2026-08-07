# Same price everywhere: homepage, /products and the product page

Product cards on the homepage and on "All products" can show a different amount than the product page (`/products/:sku`), even though both should come from `/admin/productos/:sku`. The card price is calculated by a separate helper that does not read all the admin fields.

## What is different today (verified in the code)

1. **Manual per-currency amounts are ignored on cards.** The product page uses the `local_prices` column set in the admin (exact amount per currency: MXN, COP, ARS, VES...). The card formatter (`useCardPrice`) never reads that column, so it shows the automatic USD-to-local conversion instead of the exact price you typed.
2. **Peru is formatted differently.** Cards print `S/ 55.00` (dot decimals) while the product page prints `S/ 55,00` with the unified dot-thousands/comma-decimals rule.
3. **Card prices can be stale.** `useCardPrice` caches the whole catalog in memory once per session and never refreshes it, so a price edited in the admin keeps showing the old value until a full reload. The product page refreshes on admin changes.
4. **Hard-coded prices override the admin.** On "All products" a special rule forces the "5000" product to `13.99 / 28` USD regardless of the admin values, and products without a matching admin row fall back to the fixed prices in the static catalog file.
5. **The crossed-out "before" price is always USD.** Cards render `$<originalPrice>` raw, so next to a local amount (for example `210,00 kr`) the visitor sees a mixed pair.

## What will be done

- Extend the card price helper so it reads the same admin data as the product page: the four USD tiers, `price_pen` and `local_prices`, and applies the manual per-currency amount when one exists.
- Format every card amount with the same central formatter used on the product page and the checkout (`formatCurrencyAmount`), including Peru.
- Make the card catalog refresh on admin edits (same catalog-sync/refresh mechanism the product page already uses) instead of caching forever.
- Remove the hard-coded price exception for the "5000" product and use the admin values; static catalog prices stay only as a last-resort fallback when a product has no admin row.
- Show the crossed-out "before" price in the same currency as the main price, derived from the same amount, instead of a raw USD figure.

## Technical notes

- `src/hooks/useCardPrice.ts`: add `local_prices` to the select, apply overrides per detected currency, replace `formatPrice`/`toFixed` labels with `formatCurrencyAmount`, and replace the permanent module cache with a refreshable load subscribed to `subscribeCatalogUpdates`.
- `src/pages/Products.tsx`: drop the `priceFor` special case; use the admin-driven formatter and a localized "before" price.
- `src/components/Languages.tsx`: localize the crossed-out original price the same way.
- No database or checkout changes; the tier logic (PE / Tienda VE-CU-NI / LATAM / Global) stays exactly as it is.

## Validation

Load the homepage, `/products` and one product page in the same session and confirm the card amount, currency badge and the product-page hero/sticky bar all print the identical value; then change a price in the admin and confirm the cards pick it up without a hard reload.
