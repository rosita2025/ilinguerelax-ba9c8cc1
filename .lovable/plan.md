# Plan: Increase Blog Post Capacity and Streamline Automation

The user wants to increase the blog post agenda capacity from 300 to 1,000 posts (spanning ~100 days at 10 posts/day) and ensure the system operates fully autonomously (AI generates text and images, and publishes immediately without manual approval).

## Proposed Changes

### 1. Edge Function: `manage-blog-queue`
- Update `DAYS` constant from 30 to 100 to support up to 1,000 posts (5 slots/day * 2 posts/slot = 10 posts/day * 100 days = 1,000 posts).
- Verify the `seed` action correctly handles the increased volume.

### 2. Edge Function: `process-blog-queue`
- Ensure `publish: true` remains active (already set, but verify).
- Confirm image generation via Apimart is triggered for every post in the queue.

### 3. Edge Function: `_shared/blogGenerator.ts`
- Double-check that `publish: true` results in immediate visibility on the site (syncing with `generated_blog_posts` table).
- Ensure image generation errors don't block the post creation (fallback to null or placeholder if needed, though the goal is 100% success).

### 4. Admin UI: `BlogScheduleCard.tsx`
- Update UI labels and limits to reflect the 1,000-post / 100-day agenda.

## Verification Plan

### Automated Tests
- Run `manage-blog-queue` with `action: "seed"` via a test script to verify 1,000 entries are created in `blog_post_queue`.
- Trigger a manual `run-now` to ensure one post is generated and published successfully.

### Manual Verification
- Check the `/admin/seo` (or Blog & Generador IA) dashboard to see the updated agenda length.
- Inspect the `blog_post_queue` table via Supabase to confirm scheduling spans ~3 months.
