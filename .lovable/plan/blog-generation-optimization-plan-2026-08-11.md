---
name: blog-generation-optimization-2026-08-11
description: Optimize blog generator to ensure high-quality content (2100 words), single image per post, and scheduled agenda (10 posts/day).
type: feature
---
# Blog Generation Optimization Plan

The user wants to ensure the blog generator works correctly: 1 image per post, 2100+ words of text, automated SEO, and product cards included. The agenda should handle 10 posts per day at specific times (Peru Time).

## Proposed Changes

### 1. Edge Function Shared Logic: `blogGenerator.ts`
- **File**: `supabase/functions/_shared/blogGenerator.ts`
- **Optimization**:
    - Refine the system prompt to strictly enforce the **2100+ word count**.
    - Ensure the image generation prompt for `flux-schnell` is optimized for language learning topics and always returns exactly one image.
    - Improve product card integration logic to ensure `[PRODUCT_CARD:slug]` is placed naturally within the content.
    - Ensure `generateImage` robustly handles Apimart SSE responses.

### 2. Edge Function: `manage-blog-queue`
- **File**: `supabase/functions/manage-blog-queue/index.ts`
- **Logic**:
    - Verify `SLOTS_PERU` matches the requested times: 8 AM, 9 AM, 11 AM, 1 PM (13:00), and 8 PM (20:00).
    - Ensure the `seed` action generates exactly 10 posts per day (2 per slot) to reach the 50-post goal over 5 days.
    - Validate that the keywords and angles variety prevents duplicate-looking content.

### 3. Frontend: Blog Post Rendering
- **File**: `src/pages/BlogPost.tsx`
- **Logic**:
    - Ensure the component correctly parses and renders the `[PRODUCT_CARD:slug]` shortcode with the brand's teal/coral styling.

### 4. Admin UI: Blog Schedule
- **File**: `src/components/admin/BlogScheduleCard.tsx`
- **UI**:
    - Update the descriptive text to reflect the 10 posts/day agenda.
    - Ensure the "Procesar ahora" button provides clear feedback when manual generation is triggered.

## Verification Plan
1. **Manual Generation**: Trigger a single post generation from `/admin/seo` and verify word count and image existence.
2. **Queue Seed**: Run the "Programar 100" action and check the generated schedule in the `blog_post_queue` table (via Admin UI).
3. **Internal Processing**: Invoke `process-blog-queue` manually to verify it correctly picks up and generates the scheduled posts.
