# Plan - Fix Currency Conversion Errors

The user reported that 20 USD was incorrectly converting to 1,511.52 Bs.S (Venezuela) and 8.5 PEN (Peru), creating confusion and making products appear too cheap or too expensive. We need to update the exchange rates to reflect the current market (approx 1 USD = 75.57 VES and 1 USD = 20 MXN for "psychological" pricing/rounding used in the hooks).

## Proposed Changes

### 1. Update i18n constants
- Update `exchangeRates` in `src/i18n/index.ts` to use more realistic values.
- Specifically:
    - `VES`: Change from 100 to `75.57` (matches user's expectation of 20 USD -> ~1511 Bs).
    - `MXN`: Change from 18.50 to `20.00`.
    - `COP`: Change from 3400 to `4200`.

### 2. Update Campaign Hooks
- Update `RATES` in `src/hooks/useCampaignPrice.ts` to match the new rates.
- This ensures consistency between the "campaign" (marketing) prices and the checkout system.

## Verification Plan
- Check the currency conversion for a 20 USD product to verify it results in ~1511.40 Bs.S.
- Verify that other currencies like MXN and COP also use the updated rates for their automatic suggestions in the admin panel.
