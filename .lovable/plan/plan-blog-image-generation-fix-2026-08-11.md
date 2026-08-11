# Plan - Blog Image Generation Fix

The user reported that blog posts are being published but are missing the custom AI-generated images. Investigation revealed that the `flux-schnell` model used in Apimart is returning a `model_not_found` error. I will switch to the `gpt-image-2-ext` model previously mentioned by the user and improve the resilience of the image generation logic.

## Proposed Changes

### Backend (Edge Functions)

#### `supabase/functions/_shared/blogGenerator.ts`
- Change the image generation model from `flux-schnell` to `gpt-image-2-ext` in `generateImage`.
- Update the `generateImage` function to handle different response formats from Apimart more robustly (JSON vs SSE).
- Refine the system prompt to ensure the LLM always provides a high-quality `imagePrompt` in the JSON response.
- Ensure that if image generation fails, a more descriptive error is logged, but the post generation continues with a relevant fallback (or a retry mechanism).

### Validation Plan
- Trigger a manual blog generation from the `/admin/seo` panel in the preview.
- Check the Edge Function logs to verify that `gpt-image-2-ext` is being called and returning a valid image URL.
- Verify in the database (`generated_blog_posts` table) that the new post has a unique image URL instead of the default fallback.
- Preview the post in the blog to ensure the image is displayed correctly.
