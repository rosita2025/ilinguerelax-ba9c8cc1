# Plan: Update Korean Product Pricing to $12 USD

The user wants to change the price of the Korean product ("1,000 Palabras Esenciales para Aprender Coreano") from $18 to $12. This involves updating both the static catalog configuration and the database entry to ensure consistency across the landing page, sticky bar, and checkout.

## Proposed Changes

### Configuration Update
- **`src/config/checkoutCatalog.ts`**: Verify and ensure the `price` for `coreano-100-mapas` is set to `12`. (It appears to be 12 already in the file, but the user claims it's 18, likely coming from the database).

### Database Update
- Update `public.digital_products` table via SQL to set `price_usd = 12.00` for the SKU `100-mapas-mentales-para-aprender-coreano-hangul-c1`.

### Frontend Components (Double-check)
- **`src/pages/ProductCoreanoRelax.tsx`**: Ensure the SEO component and any hardcoded values (if any) reflect $12.
- **`src/components/coreano/CoreanoHeroRedesign.tsx`**: Verify if the "before" price or savings text needs adjustment if the final price changed.

## Technical Details
- The site uses a multi-tier pricing system (`useCountryTierRouting`). The base price comes from the database (via `useAdminPricing`).
- The user specifically mentioned "no es 18 usd es el precio 12 usd", which confirms the current live price being served (likely from DB) is incorrect.

## Verification Plan
- **Database Check**: Run `psql` to verify the price update.
- **Preview Verification**: Open the product page and check the Hero section and Sticky Buy Bar for the $12 price.
- **Checkout Verification**: Click "Comprar" and verify the item price in the checkout/cart is $12.
