# Plan - Global Currency and Region Expansion

The user wants to expand the multi-currency system to fully cover LATAM, Anglosphere, Europe, Asia, and add African countries. This involves updating the internal currency mapping, exchange rates, and the admin interface.

## User Review Required

> [!IMPORTANT]
> I will add support for major African currencies (ZAR, NGN, EGP, KES). Should I also include other specific countries you are targeting, or are these sufficient for now?

## Proposed Changes

### Internationalization & Pricing
- Update `src/i18n/index.ts` to include:
    - New `Currency` types: `ZAR` (South Africa), `NGN` (Nigeria), `EGP` (Egypt), `KES` (Kenya), and others like `KRW` (South Korea), `INR` (India).
    - Map corresponding countries to these currencies in `countryToCurrency`.
    - Define symbols, positions, and decimals in `currencyConfig`.
    - Set baseline `exchangeRates` for the new currencies.

### Admin Dashboard
- Modify `src/pages/AdminProductEdit.tsx` to include the new currencies in the manual pricing grid.
- Group the pricing inputs by region (LATAM, Anglosphere/Europe, Asia, Africa) for better organization.

### Metadata & Geolocation
- Ensure `src/lib/countryInfo.ts` has the correct flags and labels for the new African and Asian countries to be displayed in the UI.

## Technical Details
- All conversions will remain relative to the `price_usd` base.
- Manual overrides (`local_prices` in the database) will be available for every new currency added to the grid.
- Existing rounding logic for local currencies (e.g., no decimals for certain currencies) will be extended to the new additions.
