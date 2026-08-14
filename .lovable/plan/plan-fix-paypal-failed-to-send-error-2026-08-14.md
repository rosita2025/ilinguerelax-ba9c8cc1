# Plan - Fix PayPal "Failed to send" Error

Investigate and fix the issue where users are seeing a "Failed to send a request" error when trying to pay with PayPal, specifically focusing on ensuring the client-side recovery mechanism and edge function reliability.

## User Review Required

> [!IMPORTANT]
> The error "Failed to send a request" usually happens when the browser blocks the connection to the server (often due to aggressive ad-blockers or slow connections). I will implement a stronger fallback to ensure the payment always goes through.

## Proposed Changes

### Frontend Improvements

#### `src/components/checkout/PayPalButtons.tsx`
- Update the internal `invokeWithRetry` to explicitly use the `directFetchFallback` logic from our global utility if the initial SDK-based call fails.
- Enhance error messaging to be more descriptive and helpful.
- Ensure the `correlationId` is correctly passed to both the SDK and direct fetch fallbacks.

#### `src/lib/invokeWithRetry.ts`
- Verify the `directFetchFallback` correctly handles all headers required for PayPal functions (Auth, Content-Type, apikey).

### Edge Function Hardening

#### `supabase/functions/paypal-create-order/index.ts` and `paypal-capture-order/index.ts`
- Ensure CORS headers include all possible client-side headers to prevent preflight failures.
- Add additional logging to track "direct fetch" vs "SDK" calls to identify where the blockage is happening for users.

## Verification Plan

### Automated Testing
- Run a Playwright script to simulate a checkout flow using the PayPal component.
- Mock a network failure for the Supabase SDK to verify the `directFetchFallback` kicks in and successfully creates a PayPal order.
- Verify console logs show the retry logic working as expected.

### Manual Verification
- Test the PayPal button in the preview to ensure it loads and opens the PayPal popup correctly.
- Inspect network requests to confirm headers and CORS are correctly handled.
