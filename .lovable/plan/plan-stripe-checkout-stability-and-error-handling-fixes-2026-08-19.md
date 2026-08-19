# Plan: Stripe Checkout Stability and Error Handling Fixes

The user reported issues with Stripe ("we couldn't connect to Stripe"). This plan focuses on improving the resilience of the Stripe integration, providing better diagnostics, and ensuring the checkout flow is robust against connection issues or regional currency restrictions.

## Proposed Changes

### 1. Frontend: Enhance PaymentMethodsGroup.tsx
- Improve connection resilience by adding a listener for the `online` event to auto-retry Stripe if a network error occurred.
- Refine the error display logic to ensure `stripeError` details (from `mapStripeError`) are clearly presented.
- Ensure the "Retry" button correctly invalidates the current session and fetches a fresh `clientSecret`.
- Explicitly handle the "restricted currency" case (e.g., Argentina) by offering a toggle to pay in USD when the local currency payment fails.

### 2. Backend: Enhance `create-checkout-prueba` Edge Function
- Add more granular error logging to capture specific Stripe failure codes (like `currency_not_supported` or `invalid_request_error`).
- Ensure the error response body includes a clear `reason` and `stripe_code` so the frontend can map it to a friendly message.
- Validate that all required metadata (SKUs, shipping, customer info) is correctly attached to the session.

### 3. Shared: Update Catalog/Pricing Logic
- Verify that `isRestrictedCurrency` correctly identifies countries where local processing is likely to fail, ensuring the backend supports the `isRestrictedRetry` flag from the frontend.

## Technical Details

### Frontend (src/components/checkout/PaymentMethodsGroup.tsx)
- Add `useEffect` to listen for `window.addEventListener("online")`.
- Modify `retryStripe` to clear `clientSecret` in `useCheckoutPruebaStore`.
- Update `handleBuyNow` to scroll to the Stripe anchor when retrying.

### Backend (supabase/functions/create-checkout-prueba/index.ts)
- Wrap Stripe session creation in a detailed try/catch block.
- Extract `err.type`, `err.code`, and `err.param` from Stripe errors.
- Return a 502 status with a JSON body containing the error details instead of a generic 500.

## Verification Plan

### Automated Tests
- Run `vitest` (if applicable) for pricing logic.
- Perform a manual test flow:
  1. Select a Stripe method.
  2. Simulate a network disconnect (browser tools).
  3. Reconnect and verify auto-retry.
  4. Verify that "Try in USD" appears for restricted currencies if the local attempt fails.

### Manual Verification
- Check the console logs in the preview for Stripe initialization.
- Verify that the `clientSecret` is successfully retrieved and the Stripe iframe mounts.
