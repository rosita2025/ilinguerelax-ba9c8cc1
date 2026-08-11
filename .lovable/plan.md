# Plan - Fix StripeInvalidRequestError and Enable Restricted Currency Payments

The user is reporting a `StripeInvalidRequestError` preventing purchases. Analysis of the logs (from the provided image) shows multiple `StripeInvalidRequestError` entries, specifically related to `MX MX` (Mexico) and `EC EC` (Ecuador). In previous turns, we forced USD for all Stripe transactions to avoid regional banking restrictions (like in Argentina or Honduras). However, it seems this is causing issues in some cases or the implementation in `create-checkout-prueba` might be triggering a Stripe validation error (likely due to `payment_method_types` or `ui_mode: "embedded"` constraints).

## Proposed Changes

### 1. Edge Functions

#### `create-checkout-prueba`
- Modify the Stripe session creation logic.
- Ensure `payment_method_types` is compatible with `ui_mode: "embedded"`.
- If a user is in a restricted country (AR, HN), we already force USD, but for other countries, we might want to allow Stripe's automatic currency handling if safe, OR ensure the USD-only mode doesn't pass incompatible parameters.
- Add more granular error logging to capture the *exact* Stripe error code (e.g., `parameter_invalid_empty`, `amount_too_small`).
- Specifically, check if `body.stripePaymentMethod` (e.g., "card") is always valid for the provided currency and country.

### 2. Frontend

#### `src/pages/Checkout.tsx`
- Improve error visibility when a payment fails.
- If Stripe returns an error, show a clearer message to the user instead of just a generic toast.

## Technical Details
- **Stripe Error Mapping**: The error `StripeInvalidRequestError` is a broad category. I will check the `admin-payment-errors` logs to see if there's a specific `detail` field with more info (like "Currency not supported" or "Invalid payment method").
- **Currency Enforcement**: In `_shared/catalogPricing.ts`, `isRestrictedCurrency` marks AR and HN. I will verify if adding MX or others to this list is necessary, or if the "Force USD" logic in `create-checkout-prueba` needs to be more robust.
- **Embedded Mode**: `ui_mode: "embedded"` requires a `return_url` and certain payment methods. I'll ensure these are strictly followed.

## Verification Plan

### Manual Verification
- I will check the `/admin/payment-errors` page (via Playwright if possible, or by inspecting the DB state via `read_query`) to identify the specific error messages associated with the failed MX/EC attempts.
- I will verify the Edge Function logs to see the raw error object from Stripe.

### Automated Verification
- I will use Playwright to simulate a checkout flow (up to the payment step) to ensure no frontend crashes occur and that the payload sent to `create-checkout-prueba` is well-formed.
