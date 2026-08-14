# Plan: Fix PayPal "Ocurrió un error con PayPal" and Rendering Issues

The user reported that PayPal is failing ("el paypla no se puede compra"). The screenshot shows an error message "Ocurrió un error con PayPal. Intenta de nuevo" and a correlation ID. Based on the code analysis, this usually happens when the PayPal SDK fails to load (often due to ad-blockers) or when the `paypal-create-order` Edge Function fails.

## Proposed Changes

### 1. Hardening `paypal-create-order`
- **Fix Amount Logic**: Ensure the server-side amount calculation in `paypal-create-order` correctly handles both USD and supported local currencies.
- **Add Logging**: Increase visibility into why an order might fail to create (e.g., credential issues or PayPal API errors).

### 2. Improving `PayPalButtons.tsx` Resilience
- **Script Cleanup**: Ensure old PayPal scripts are fully removed before retrying to prevent "multiple SDK versions" errors.
- **Enhanced Error Mapping**: Provide even more specific guidance to the user when a network error or block occurs.
- **SDK Load Optimization**: Use a more robust strategy for loading the SDK script.

### 3. Backend Configuration Check
- Verify that `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET` are correctly set in the environment variables (via `paypal-config` logs or manual check if possible).

## Technical Details
- Update `supabase/functions/paypal-create-order/index.ts` to log specific PayPal API error responses.
- Update `src/components/checkout/PayPalButtons.tsx` to handle the `onInit` and `onClick` actions to validate the form state before triggering PayPal.

## Verification Plan
- **Manual Test**: Attempt to render the PayPal buttons in the checkout using a test product.
- **Edge Function Logs**: Check the logs for `paypal-create-order` to see if the PayPal API is returning specific errors (like `UNPROCESSABLE_ENTITY`).
