# Plan - Harden PayPal Checkout Against Persistent Network Failures

The user is reporting a persistent "failed to send" error in the PayPal checkout flow. Despite previous hardening (retries, correlation IDs, and a `directFetchFallback` in `invokeWithRetry`), some users (likely due to aggressive ad-blockers, corporate firewalls, or browser privacy settings) are still unable to reach the Edge Functions.

## User Review Required

> [!IMPORTANT]
> Some browser extensions or corporate networks block requests to "supabase.co" URLs entirely. If the proposed technical fixes don't solve it for specific users, they may need to disable ad-blockers (like uBlock Origin or Brave Shield) or try a different network.

## Proposed Changes

### 1. Frontend: Enhance `invokeWithRetry` Resilience
- Improve `isNetworkFailure` to detect `Load failed` (Safari/iOS) and `Failed to fetch` variations more accurately.
- Add a tiny random delay before the `directFetchFallback` to allow browser network buffers to clear.
- Log the specific browser environment (User Agent) when a fallback is triggered to identify if it's a device-specific pattern.

### 2. Frontend: PayPal Component Hardening
- **Script Loading:** Add a retry loop for the PayPal SDK script loading itself. If the script fails to load, wait 2 seconds and try again (up to 3 times).
- **Graceful Error Recovery:** If `paypal-config` fails even after fallbacks, provide a specific instruction to the user: "Check your connection or disable ad-blockers."

### 3. Backend: PayPal Config & Create Orders
- **Header Normalization:** Ensure all PayPal-related Edge Functions have consistent `Access-Control-Expose-Headers` for `x-correlation-id` and `x-trace-id`.
- **Health Check:** Add a lightweight "ping" logic to `paypal-config` that checks if the Supabase database is reachable before returning the client ID.

## Technical Details

### `src/lib/invokeWithRetry.ts`
- Refine `isNetworkFailure` to include `TypeError: load failed` (common in Safari).
- In `directFetchFallback`, add `credentials: 'include'` or `mode: 'cors'` explicitly to ensure browser security contexts don't block the native fetch.

### `src/components/checkout/PayPalButtons.tsx`
- Wrap the `loadPayPalSdk` logic in a retry utility.
- Add a specific check for `window.paypal` after the script claims to be loaded (sometimes scripts "load" but are empty due to blockers).

## Verification Plan

### Automated Tests
- Simulate network failures in the sandbox to ensure `directFetchFallback` is invoked.
- Verify that `isNetworkFailure` correctly identifies typical browser error strings.

### Manual Verification
- Test the PayPal button rendering in the preview.
- Inspect network logs to confirm headers are correctly passed.
