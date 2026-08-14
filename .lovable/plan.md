# Plan: PayPal Checkout Resilience and Logging

The user is experiencing recurring PayPal errors. Previous fixes introduced `invokeWithRetry` and `directFetchFallback` to bypass network blocks, but "failed to send" or "edge function" errors persist. This plan focuses on hardening the connection between the client and the backend functions, improving CORS handling, and adding granular observability to identify if the failures are due to client-side blocks, authentication issues, or backend exceptions.

## User Review Required

> [!IMPORTANT]
> The fixes include internal technical adjustments to how the browser communicates with the database functions. No changes to the visual checkout flow are required from your side.

- **Wait for confirmation**: After applying these changes, please test a PayPal purchase. If it fails again, the new "Audit ID" shown in the error box will allow us to find the exact reason in the admin logs.

## Technical Details

### 1. Client-Side Resilience (`src/lib/invokeWithRetry.ts`)
- **Header Normalization**: Ensure `x-correlation-id` and `apikey` are consistently passed in both the standard SDK path and the `directFetchFallback` path.
- **Improved Error Classification**: Update `isNetworkFailure` to catch more browser-specific error strings (e.g., "Load failed", "Failed to fetch") that indicate a block by ad-blockers or corporate firewalls.

### 2. PayPal Component Hardening (`src/components/checkout/PayPalButtons.tsx`)
- **SDK Loading Logic**: Wrap the PayPal SDK loader in the same retry logic used for API calls. If the PayPal script fails to load (common with aggressive ad-blockers), the system will retry up to 3 times before showing a friendly "Connection issue" message.
- **Audit ID Visibility**: Ensure the `correlationId` is clearly visible in the error state so the user can report it for debugging.

### 3. Edge Function CORS & Security (Supabase Functions)
- **CORS Header Consistency**: Update `paypal-config`, `paypal-create-order`, and `paypal-capture-order` to explicitly allow `x-correlation-id` and `apikey` in preflight requests.
- **Direct Auth Fallback**: Ensure functions handle requests coming from `fetch` (which might have different header capitalization) identically to the Supabase SDK.

### 4. Observability
- **Log Enrichment**: Add `traceId` and `correlationId` to all error responses in the edge functions to allow cross-referencing between client logs and server logs.
- **Audit Table**: Verify that `order_events` captures "paypal_connection_attempt" even before a payment is initiated to detect silent failures.

## Action Plan

1. **Update `src/lib/invokeWithRetry.ts`**: Harden the network failure detection and header handling.
2. **Update `src/components/checkout/PayPalButtons.tsx`**: Add retry logic to the SDK loader and improve error reporting.
3. **Update Edge Functions**:
    - `supabase/functions/paypal-config/index.ts`
    - `supabase/functions/paypal-create-order/index.ts`
    - `supabase/functions/paypal-capture-order/index.ts`
    - (Standardize CORS headers and add trace logging).
4. **Validation**: Use a Playwright script to simulate network timeouts and verify the fallback mechanism triggers correctly.
