# Plan: Fix dLocal Go Downtime and Error Logging Issues

The user reported a "crash" or downtime (HTTP 502) in the dLocal Go integration. My analysis of the database logs confirms that several `PaymentError` events with `error_reason: HTTP 502` occurred on 2026-08-09, primarily affecting users in Argentina (AR) and Nicaragua (NI). 

While I previously added a retry mechanism and better error extraction to the `dlocal-create-payment` Edge Function, there are still missing pieces in the overall error tracking and recovery flow.

## Proposed Changes

### 1. Edge Function: `dlocal-create-payment`
- Ensure that every failed attempt in the fallback chain (Local -> Minimal -> USD) is correctly logged to the console so we can see which specific step failed during downtime.
- Explicitly return the `provider_status: 502` to the frontend when dLocal is down, so the frontend can display a provider-specific downtime message.

### 2. Frontend: `PaymentMethodsGroup.tsx`
- Add a specific check for `is_provider_down` in the error response.
- If a provider is detected as down, show a clear message: "We are currently experiencing technical difficulties with this payment method. Please try another one." instead of a generic error.

### 3. Frontend: `AdminPaymentErrors.tsx`
- Ensure that `Network error` and `HTTP 502` are properly mapped to user-friendly labels in all parts of the admin dashboard.

### 4. Shared: `_shared/dlocal.ts`
- Add a utility function to check if the dLocal API base is reachable (ping-like) before attempting a full payment creation if we suspect downtime.

## Verification Plan

### Automated Verification
- I will run a script to simulate a 502 error and verify that the frontend correctly interprets the `is_provider_down` flag.
- I will verify that the `funnel_events` table contains the expected details after a simulated failure.

### Manual Verification
- Review the `/admin/payment-errors` dashboard to ensure the historical 502 errors are correctly labeled.
