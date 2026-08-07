# Plan: Fix AI Gateway and Product Save

The user is experiencing issues with the AI generator and potentially product saving in the admin panel.

## Problem Diagnosis
1.  **AI Gateway Failure**: The `ai-gateway` Edge Function returns a `401 Unauthorized` for CORS `OPTIONS` preflight requests because the handler expects an `adminKey` in the request body, which is absent in `OPTIONS` calls.
2.  **AI Parsing**: The AI generator in `AdminProductEdit.tsx` expects a specific OpenAI-like response format (`choices[0].message.content`). If the gateway returns something else or an error, it might not be handled gracefully.
3.  **Database Errors**: The user continues to report "database error" during product save. Although `bonus_titles` (generated column) was excluded in the previous turn, there might be other issues or the exclusion didn't cover all paths.

## Proposed Changes

### 1. Edge Function: `ai-gateway`
- Modify the handler to return a `204 No Content` response for `OPTIONS` requests with proper `adminCorsHeaders`.
- Ensure `messages` are passed correctly to the Lovable AI Gateway.

### 2. Admin Panel: `AdminProductEdit.tsx`
- Improve AI content parsing: strip markdown code blocks (e.g., \`\`\`json) if the AI includes them.
- Add more robust error handling for `adminInvoke` calls.
- Ensure the "Save" payload is strictly cleaned of any generated or internal state columns.

### 3. Database & Security
- Verify RLS policies for `digital_products` and `product_upsells` to ensure the `authenticated` role has full CRUD as intended for the admin.

## Verification Plan
1.  **Manual Test**: Trigger the AI generator in the admin panel and observe network requests.
2.  **Manual Test**: Save a new product and an existing product to ensure no `428C9` or other database errors occur.
3.  **Logs**: Check Supabase Edge Function logs for `ai-gateway` and `manage-products`.
