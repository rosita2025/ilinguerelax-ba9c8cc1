# Plan: Restore Stripe Card Payments Visibility

The user reports that Stripe (credit/debit cards) is missing or disabled in Latin America. My investigation confirms that while Stripe is intended to be the primary method globally, there are filters in `PaymentMethodsGroup.tsx` and `useCheckoutMethodsConfig.ts` that might be unintentionally hiding it in certain regions or configurations.

## Proposed Changes

### 1. Unified Method Mapping
- Ensure all `stripe_` prefixed keys (e.g., `stripe_card`, `stripe_oxxo`) are correctly mapped to the `stripe` family in `src/hooks/useCheckoutMethodsConfig.ts`.

### 2. Global Visibility for Stripe Cards
- Modify the filtering logic in `src/components/checkout/PaymentMethodsGroup.tsx` to ensure that if the "GLOBAL" region (or any active region) has cards enabled, they appear for all users regardless of their IP, while still allowing for region-specific method ordering.
- Specifically, ensure `dlocal_card` being disabled (as seen in the code) does not prevent the primary Stripe `card` option from showing.

### 3. Localization Support
- Ensure the card subtitles and price badges correctly reflect local currency where possible (PE, MX, ES) while falling back to USD for Stripe transactions in other LatAm countries to prevent conversion errors at the gateway level.

## Technical Details

- **`src/hooks/useCheckoutMethodsConfig.ts`**: Verify `keyToFamily` correctly groups all `stripe_*` keys into the `stripe` family to prevent configuration mismatches.
- **`src/components/checkout/PaymentMethodsGroup.tsx`**:
    - Update the `allMethods` array to ensure the "card" (Stripe) option is always present if enabled in the config.
    - Review the `filteredByAdmin` logic to prevent accidental exclusion of Stripe in LatAm.
    - Ensure `isRestricted` logic doesn't hide the method but rather adjusts the display currency.

## Validation Plan

1. **Regional Simulation**: Run Playwright tests simulating users from Mexico (MX), Colombia (CO), and Argentina (AR).
2. **Visibility Check**: Verify the "Tarjeta de débito / crédito" option appears at the top (or near the top) of the list.
3. **Gateway Verification**: Trigger the `fetchClientSecret` call for a card payment in these regions to ensure the backend correctly returns a Stripe session.
