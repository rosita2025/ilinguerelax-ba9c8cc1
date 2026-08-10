# Plan: dLocal Go 502 Error Handling & Resilience

The user reported that the dLocal Go integration experienced HTTP 502 errors yesterday, as shown in the `/admin/payment-errors` dashboard. This usually indicates temporary downtime or instability in the dLocal Go API. We will improve the Edge Function to handle these cases more gracefully and provide better diagnostic information.

## Proposed Changes

### 1. Edge Function: `dlocal-create-payment`
- **Internal Retries**: Add a small retry mechanism with exponential backoff specifically for `5xx` errors from dLocal Go (502, 503, 504).
- **Better Error Extraction**: If dLocal returns a non-JSON error (like an HTML 502 page), catch it and return a standardized JSON error message: `{ "error": "dLocal Go API returned a Bad Gateway (502). The service might be temporarily down.", "is_provider_down": true }`.
- **Enhanced Logging**: Log the exact attempt that failed with status code to the console for better debugging in Supabase logs.

### 2. Shared Library: `_shared/dlocal.ts`
- Add a helper to check if a status code indicates a temporary provider failure.

### 3. Frontend: `AdminPaymentErrors.tsx` & `CheckoutRecommendations.tsx`
- **Resilience Info**: If a provider is detected as having a high rate of 502s, add a visual hint in the recommendations to "Consider disabling this provider temporarily or checking its status page".
- **Better Labels**: Map `HTTP 502` to a more human-readable "Error de Servidor (dLocal)" in the UI.

### 4. Frontend: `PaymentMethodsGroup.tsx`
- If the `dlocal-create-payment` function returns a `502` status but with a valid JSON body indicating a provider downtime, show a specific user-friendly message: "Estamos experimentando dificultades técnicas con dLocal. Por favor, intenta con otro método de pago."

## Verification Plan

### Automated Tests
- Mock a 502 response from dLocal in a test script and verify that `dlocal-create-payment` retries and eventually returns a clean JSON error.
- Verify that `trackPaymentError` still logs the event correctly.

### Manual Verification
- Check the `/admin/payment-errors` page to ensure that current (simulated or real) errors are displayed correctly.
- Review the logs in the admin panel to see if "HTTP 502" is now more descriptive if it happens again.
