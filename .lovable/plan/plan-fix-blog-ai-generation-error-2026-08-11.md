# Plan: Fix Blog AI Generation Error

The user reported an "Edge Function returned a non-2xx status code" error when pressing "Generar y publicar" (Generate and Publish). This error is likely caused by one of three things:
1.  **2FA Session Expired**: The admin 2fa session token is missing or expired, but the UI isn't prompting for a new one correctly (or the error message is too generic).
2.  **Apimart Gateway Failure**: The AI gateway (Apimart) is returning an error (e.g., rate limit, out of credits, or SSE parsing failure) that is being bubbled up as a 500/502/403.
3.  **CSRF/Origin mismatch**: The `x-admin-csrf` header or origin validation is failing due to recent changes or environment differences.

## Proposed Changes

### 1. Enhanced AI Response Handling
- Refine the `parseAiResponse` in `supabase/functions/_shared/blogGenerator.ts` to be even more resilient to Apimart's SSE/JSON hybrid responses.
- Specifically handle the case where Apimart returns a "data: [DONE]" or fragmented JSON more gracefully to avoid `Unexpected token 'd'` or `Unexpected end of JSON input`.

### 2. UI Error Feedback
- Update `src/lib/adminInvoke.ts` to better capture and display the specific error message from the Edge Function body.
- Update `src/pages/AdminSEO.tsx` and `src/components/admin/BlogScheduleCard.tsx` to explicitly check for the `TWO_FA_REQUIRED` code and trigger the 2FA modal if the session is lost, instead of showing a generic "Edge Function returned a non-2xx" toast.

### 3. Image Generation Fallback
- In `supabase/functions/_shared/blogGenerator.ts`, ensure `generateImage` failure doesn't crash the entire post generation (it should return a placeholder or null if the image API fails but the text is fine).

## Verification Plan

### Manual Verification
- Attempt to generate a blog post via the SEO admin panel.
- Check browser console for detailed `adminInvoke` error logs if it fails.
- Verify that if the 2FA token is manually deleted from `sessionStorage`, the app prompts for a new OTP instead of just failing.

### Automated Verification
- Run `bunx vitest` (if applicable) or a simple script to test the `parseAiResponse` utility with problematic SSE payloads.
