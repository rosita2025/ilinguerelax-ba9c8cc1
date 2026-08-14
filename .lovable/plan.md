# Plan - Fix Shipping Country Selection

The user is reporting that shipping countries like Peru, Colombia, and Mexico are missing from the country selector on the checkout page for physical products, despite these being regions where shipping costs and rules were previously configured. The image also shows that the selector is limited to USA, Canada, UK, Australia, and New Zealand.

## Proposed Changes

### Internationalization (i18n)
- Update `src/i18n/checkoutUI.ts` to include common LATAM countries in the `selectCountry` options for all supported languages.

### Frontend
- Modify `src/components/checkout/BuyerInfoForm.tsx` to expand the `<select>` element for shipping countries to include Peru, Colombia, Mexico, Argentina, and Chile.

## Technical Details

- The current implementation of `BuyerInfoForm.tsx` has a hardcoded list of countries in the `<select>` tag (lines 358-362).
- I will add the following countries to the selector:
  - Peru (PE)
  - Colombia (CO)
  - Mexico (MX)
  - Argentina (AR)
  - Chile (CL)
- The `isLatam` logic in `OrderSummary.tsx` already covers these country codes for calculating the $9 USD shipping cost.

## Verification Plan

- **Manual Verification**: I will check the checkout page for a physical product (e.g., `/products/5-000-palabras-libro-fisico`) and verify that the country selector now includes the missing LATAM countries.
- **Validation Check**: Verify that selecting one of these countries correctly triggers the $9 USD shipping cost in the order summary.
