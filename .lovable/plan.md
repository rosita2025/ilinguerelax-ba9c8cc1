---
name: stripe-regional-resilience
description: Disable Stripe Adaptive Pricing for problematic regions (AR, HN) and improve admin error visibility.
type: feature
---
# Stripe Regional Resilience Plan

The user reported failed Stripe checkout attempts in Argentina (AR) and Honduras (HN) with generic "non-2xx" error codes. This plan addresses the root cause (likely Adaptive Pricing conflicts in these regions) and improves error transparency for the administrator.

## Proposed Changes

### 1. Edge Function: `create-checkout-prueba`
- **File**: `supabase/functions/create-checkout-prueba/index.ts`
- **Logic**: 
    - Add a list of countries where Stripe Adaptive Pricing is known to be problematic or should be disabled (starting with `AR`, `HN`).
    - Conditional `adaptive_pricing` based on the buyer's country.
    - Enhanced error responses: Ensure the `reason` field contains the specific Stripe error type/code (e.g., `invalid_request_error:currency_not_supported`).

### 2. Frontend: Error Extraction
- **File**: `src/lib/edgeError.ts`
- **Logic**: Update `extractEdgeErrorMessage` to prioritize the `reason` field from the Edge Function response. This ensures that technical errors (like Stripe API failures) are logged correctly in the admin panel instead of showing the generic "Edge Function returned a non-2xx status code".

### 3. Frontend: Checkout Component
- **File**: `src/components/checkout/PaymentMethodsGroup.tsx`
- **Logic**: Fix the `fetchClientSecret` catch block to utilize the `edgeDetail` property attached by `invokeWithRetry`. This prevents the original error context from being lost when re-throwing the error for the UI.

### 4. Admin UI: Payment Errors
- **File**: `src/pages/AdminPaymentErrors.tsx`
- **Logic**: Update `REASON_LABEL` to include common Stripe technical reasons if they appear in the logs, making the dashboard easier to read.

## Verification Plan
1. **Edge Function Deploy**: Verify that `AR` and `HN` now result in checkout sessions without `adaptive_pricing`.
2. **Simulate Error**: Trigger a deliberate 502 in the function (e.g., via a test SKU) and verify the admin panel shows the specific `reason` instead of the generic message.
3. **Admin Dashboard**: Check that new `PaymentError` events have descriptive reasons.
