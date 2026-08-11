# Plan: Blog Automation Consolidation

The user wants to maintain the 300-post (30-day) agenda but ensure it is fully autonomous, with AI generating both text and images and publishing immediately without manual intervention.

## Proposed Changes

### 1. Edge Function: `process-blog-queue`
- Confirm `publish: true` is always passed to `generateAndStorePost`.
- This ensures that when the scheduled time arrives, the post is created and immediately set to `published: true` in the database.

### 2. Edge Function: `_shared/blogGenerator.ts`
- Verify that image generation via Apimart is triggered for every post.
- Ensure the AI prompt for 300 posts generates unique content to avoid repetition across the 30-day cycle.

### 3. Admin UI: `BlogScheduleCard.tsx`
- Update descriptions and badges to reflect that the system is in "Auto-Publish" mode.
- Remove or deprioritize "Approve" buttons if they are no longer necessary for the automated flow.

## Verification Plan

### Automated Verification
- Manual trigger of the queue processor to verify a post is generated, an image is created, and it appears on the blog without manual approval.
- Check the `blog_post_queue` status updates to `done` and the post appears in `generated_blog_posts` with `published: true`.
