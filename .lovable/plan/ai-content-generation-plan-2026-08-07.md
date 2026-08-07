---
name: AI Content Generation Fix
description: Fix for "ai-gateway" Edge Function error in AdminProductEdit by creating the missing function or updating the call.
type: feature
---

# AI Content Generation Plan

The user reported an error with AI content generation ("pero eroor con la Ia, dijo nos epudo generada el contebido"). 
Analysis shows `AdminProductEdit.tsx` attempts to invoke an Edge Function named `ai-gateway`, which does not exist in the project's `supabase/functions` directory.

## Current State
- `src/pages/AdminProductEdit.tsx` calls `supabase.functions.invoke("ai-gateway", ...)` at line 443.
- The `ai-gateway` function is missing from the codebase.
- Other functions (like `generate-content-brief`) use `https://ai.gateway.lovable.dev/v1/chat/completions` directly.

## Proposed Changes
1. Create a new Edge Function `supabase/functions/ai-gateway/index.ts` that acts as a generic proxy to the Lovable AI Gateway.
2. Ensure it handles the `chat` action requested by `AdminProductEdit.tsx`.
3. Secure it using `ADMIN_REVIEW_KEY` (or similar existing patterns in the project).

## Implementation Details
- The function will use `LOVABLE_API_KEY` from environment variables.
- It will support the `google/gemini-2.0-flash` model (or similar) as used in other parts of the project.
- It will include CORS headers to allow browser-side invocation from the admin panel.

## Verification
- Once created, I will verify that the "Escribir con IA" button in the Product Admin works without throwing the "Error con la IA" toast.
