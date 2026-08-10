# Plan: Resilience and Error Analysis for dLocal Go (HTTP 502 confirmed)

The user confirmed that the error is **HTTP 502** (Bad Gateway) from dLocal Go. This indicates temporary downtime or instability on the provider's side. We have already implemented retries, but we will now harden the error reporting and visibility.

## Analysis
- **Current State**: `dlocal-create-payment` edge function already has a retry loop (3 attempts) for 5xx errors and fallbacks to "Minimal payload" and "USD fallback".
- **Reported Error**: "https505" could refer to `HTTP 505 Version Not Supported` (rare in modern web) or more likely `HTTP 502/503` (Bad Gateway/Service Unavailable) which the user previously reported as "se cayo que te paso".
- **Gap**: While we have retries, we might need to improve the user-facing messaging and the admin visibility for these specific failures to prevent "505" confusion.

## Proposed Changes

### 1. Edge Function Hardening
- Increase retry delay in `dlocal-create-payment` and `dlocal-webhook`.
- Add explicit logging for the specific HTTP status code returned by dLocal to `order_events` to help debug "505" vs "502".

### 2. Admin Analytics & Error Tracking
- Update `AdminPaymentErrors.tsx` to explicitly group "505" errors if they appear.
- Enhance the `dlocal_downtime` detection to be more sensitive to specific status codes.

### 3. User Experience
- Update `dlocalErrorMap.ts` to include a specific message for "System Busy / Maintenance" that covers these gateway errors.

## Verification Plan
- **Automated**: Use `supabase functions serve` (simulated) to verify retry logic.
- **Manual**: Trigger a simulated 502/505 response in a temporary test block within the edge function and verify the UI handles it gracefully by showing the fallback or a clear maintenance message.
