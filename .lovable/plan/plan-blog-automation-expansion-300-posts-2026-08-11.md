# Plan - Blog Automation Expansion (300 Posts)

The user wants to expand the current blog automation system from 50 posts to **300 posts** (10 posts/day for 30 days) and wants them to be **published automatically** without requiring manual approval or preview.

## Proposed Changes

### 1. Backend: Update Agenda Configuration
- **Modify `manage-blog-queue/index.ts`**:
    - Increase `DAYS` from 5 to 30.
    - Update the `buildSchedule` logic to handle the larger volume (re-cycling keywords and angles effectively).
    - Ensure keywords are varied enough to avoid duplicates in a 300-post run.
- **Modify `process-blog-queue/index.ts`**:
    - Change `publish: false` to `publish: true` in the `generateAndStorePost` call so that posts go live immediately upon generation.

### 2. Backend: Enhance Generation Resilience
- **Modify `_shared/blogGenerator.ts`**:
    - Add a `retry` mechanism for the main text generation if the AI returns a "JSON irreparable" error, as 300 posts will increase the chance of hitting edge cases.
    - Ensure the prompt encourages unique perspectives when the same keyword is reused.

### 3. Admin UI (Optional but helpful)
- **Modify `src/components/admin/BlogScheduleCard.tsx`**:
    - Update labels to reflect "300 posts / 30 days".
    - Update the "Programar 300" button logic.

## Verification Plan

### Automated Tests
- Run `manage-blog-queue` with `action: "seed"` and verify the `blog_post_queue` table contains 300 entries spanning 30 days.
- Run `process-blog-queue` manually once to verify the post is created with `published: true`.

### Manual Verification
- Check the `generated_blog_posts` table to ensure the new post is public.
- Verify the scheduled times in the admin panel.
