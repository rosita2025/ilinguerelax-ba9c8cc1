# Plan: Move Blog Text Generation to Apimart

The Lovable AI Gateway has exhausted its credits for text generation. We will migrate the text generation logic to use the user's provided **Apimart** token and infrastructure, similar to how we integrated image generation.

## Proposed Changes

### 1. Backend: Shared Blog Generator
- Update `supabase/functions/_shared/blogGenerator.ts` to use `APIMART_TOKEN` instead of `LOVABLE_API_KEY`.
- Change the `AI_URL` to Apimart's chat completions endpoint: `https://api.apimart.ai/v1/chat/completions`.
- Update the model to `google/gemini-2.0-flash-exp` (or a similar high-performance model available on Apimart).
- Adjust the `fetch` call headers and body to match Apimart's requirements.
- Refine error handling for credit exhaustion (402) to work with Apimart's response codes.

## Verification Plan

### Manual Verification
- Trigger a blog generation via the admin SEO panel or by manually calling the `process-blog-queue` Edge Function.
- Check the Supabase Edge Function logs to verify that the request is successfully sent to `api.apimart.ai` and a valid JSON response is received.
- Confirm that new entries appear in the `generated_blog_posts` table with both generated text and images.
