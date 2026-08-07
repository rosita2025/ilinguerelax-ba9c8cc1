# Plan - Fix AI Gateway and Digital Product Admin

The user is reporting that the AI content generator in `admin/productos/:sku` is failing with "error con la IA, no se pudo generador". My analysis of the logs shows that the `ai-gateway` Edge Function is returning a `500` error during `POST` requests, even though the `OPTIONS` preflight is succeeding with `204`. This usually points to an issue during the execution of the function handler, likely related to the `fetch` call to the Lovable AI Gateway or environment variable access.

## Proposed Changes

### 1. Edge Function `ai-gateway`
- Add detailed logging for the `fetch` request to the Lovable AI Gateway to identify the exact cause of the 500 error (e.g., missing API key, network error, or gateway rejection).
- Ensure the `LOVABLE_API_KEY` is being correctly retrieved from environment variables.
- Wrap the entire handler logic in a more descriptive error catcher.

### 2. Frontend `AdminProductEdit.tsx`
- Improve error reporting when `adminInvoke` fails, showing the actual error message from the AI Gateway to the user instead of a generic "error con la IA".
- Add a fallback mechanism or retry hint in the toast notification.

## Verification Plan

### 1. Automated Tests
- Trigger a test call to the `ai-gateway` function using `supabase--test_edge_functions` to verify it can successfully communicate with the Lovable AI Gateway.

### 2. Manual Verification
- Review the Edge Function logs after the fix to ensure `handler.done` returns `200` for `POST` requests.
- Verify in the browser preview (via admin panel) that clicking "Generar con IA" successfully populates the product fields.
