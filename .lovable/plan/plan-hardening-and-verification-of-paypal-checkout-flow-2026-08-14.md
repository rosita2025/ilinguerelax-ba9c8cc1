# Plan: Hardening and Verification of PayPal Checkout Flow

The user is verifying the PayPal purchase flow in sandbox mode to confirm the "failed to send" error is resolved. The system recently received hardening for PayPal (SDK retries, native fetch fallback, correlation IDs). This plan aims to further stabilize the flow and verify its robustness against network-level blocks.

## Proposed Changes

### 1. Robustness & Visibility
- **Update SDK Loading**: Enhance `loadPayPalSdk` in `PayPalButtons.tsx` to handle aggressive script blocking by ensuring previous failed script tags are completely cleaned up and providing more specific error messaging if a global `paypal` object is hijacked.
- **Improve Native Fallback**: Refine `directFetchFallback` in `invokeWithRetry.ts` to include standardized headers that help bypass generic WAF/Ad-blocker rules (e.g., `X-Requested-With`).
- **Standardize Headers**: Ensure all PayPal-related Edge Functions (`paypal-config`, `paypal-create-order`, `paypal-capture-order`) consistently use the same CORS and correlation headers to prevent preflight failures.

### 2. User Experience
- **Specific Error Feedback**: Map common technical errors (e.g., `403 Forbidden`, `401 Unauthorized`) to buyer-friendly Spanish/English messages in `PayPalButtons.tsx` instead of showing raw technical codes.
- **Loading State Refinement**: Ensure the "Cargando PayPal..." skeleton or loader is persistent enough to prevent layout shifts if the SDK takes a few seconds to initialize.

### 3. Verification (Internal Testing)
- **Edge Case Simulation**: Use Playwright to simulate a blocked domain scenario for `opyitzdvvurdyyyzkwwv.supabase.co` and verify the `directFetchFallback` path is triggered and successful.
- **Correlation ID Tracking**: Confirm that the `x-correlation-id` is correctly propagated from the client to the `order_events` table for a test transaction.

## Technical Details

- **Files affected**:
    - `src/components/checkout/PayPalButtons.tsx`: Error mapping and SDK loading logic.
    - `src/lib/invokeWithRetry.ts`: Fallback header refinement.
    - `supabase/functions/paypal-config/index.ts`: CORS consistency.
    - `supabase/functions/paypal-create-order/index.ts`: Logging refinement.
- **Security**: The `x-correlation-id` and `x-trace-id` are used for debugging without exposing PII. Native `fetch` fallback uses the public `anon` key, matching the SDK's behavior.
- **Performance**: Retries use exponential backoff (400ms -> 800ms -> 1600ms) to avoid hammering the API during transient outages.
