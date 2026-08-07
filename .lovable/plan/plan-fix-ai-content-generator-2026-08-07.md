# Plan - Fix AI Content Generator

The user is reporting that the AI Content Generator in `AdminProductEdit.tsx` is still failing after 4 hours of work. I previously implemented an `ai-gateway` Edge Function to proxy requests to the Lovable AI Gateway, but it seems there might be a bug or a missing detail causing it to fail for the user.

## Problem Analysis
1. **Frontend Call**: `AdminProductEdit.tsx` uses `supabase.functions.invoke("ai-gateway", ...)` directly.
2. **Missing Headers**: Standard `invoke` might miss the custom headers (`x-admin-csrf`, `x-admin-2fa`) that the `ai-gateway` function requires via `assertAdminCsrf`.
3. **Better Utility**: We have `adminInvoke` in `src/lib/adminInvoke.ts` which handles these headers and improves error reporting.
4. **Edge Function Resiliency**: The `ai-gateway` function might benefit from more detailed error logging or a simpler response structure if it's failing to parse.

## Proposed Changes

### Frontend
- Switch from `supabase.functions.invoke` to `adminInvoke` in `src/pages/AdminProductEdit.tsx`.
- This ensures `x-admin-csrf` and `x-admin-2fa` are sent, which `assertAdminCsrf` in the Edge Function expects.
- Improve the prompt to be more robust and perhaps request a slightly simpler JSON format if parsing is an issue.

### Backend (Edge Function)
- Update `supabase/functions/ai-gateway/index.ts` to use `withAdminLogging` for better debugging in the logs.
- Ensure the CORS headers and `assertAdminCsrf` are perfectly aligned with what the frontend sends.

## Verification Plan
1. **Build Check**: Ensure no TypeScript errors are introduced.
2. **Logs**: Check Edge Function logs after a failed attempt to see the specific error (Unauthorized, CSRF missing, etc.).
3. **Manual Test**: Simulate the call via a shell script if possible, or advise the user to try again once headers are fixed.
