# Plan: Remove Apple Pay and Google Pay from Checkout

The user wants to remove Apple Pay and Google Pay from the checkout process for Peru and all other countries, relying on local payment methods instead. Based on the code analysis, these methods are currently hardcoded as default enabled methods in the `useCheckoutMethodsConfig` hook.

## User Review Required

> [!IMPORTANT]
> This change will disable Apple Pay and Google Pay globally across the entire store. If you only wanted this for specific products or specific regions (other than Peru which you mentioned), please let me know.

## Proposed Changes

### Checkout Hooks

#### [useCheckoutMethodsConfig.ts](src/hooks/useCheckoutMethodsConfig.ts)
- Remove `stripe_apple_pay` and `stripe_google_pay` from the default `enabledMethodKeys` arrays (lines 170 and 181).
- This ensures that by default, only the basic Stripe card payment is enabled, and any other methods must be explicitly enabled via the admin configuration in the database.

## Technical Details

- **File modified**: `src/hooks/useCheckoutMethodsConfig.ts`
- **Logic**: The hook currently initializes `enabledMethodKeys` with `["stripe_card", "stripe_apple_pay", "stripe_google_pay"]`. I will change this to just `["stripe_card"]`.
- **Impact**: Since Peru uses Yape/Plin and other local methods (managed via the `yape` family and local transfers), and the user explicitly asked to "borra" (delete/remove) Apple/Google Pay, this modification will hide those specific Stripe sub-methods while keeping the main credit card option and all local methods intact.

## Verification Plan

### Automated Tests
- I will check the `useCheckoutMethodsConfig` output for a few sample countries (PE, US) to ensure `enabledMethodKeys` no longer includes `stripe_apple_pay` or `stripe_google_pay`.

### Manual Verification
- Navigate to a checkout page (e.g., `/checkouts/some-sku`).
- Verify that under the "Tarjeta" or "Stripe" option, the Apple Pay and Google Pay icons/buttons are no longer visible.
- Ensure that local methods like Yape/Plin (for Peru) or SPEI (for Mexico) remain functional and visible.
