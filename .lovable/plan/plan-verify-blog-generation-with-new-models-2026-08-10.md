# Plan - Verify Blog Generation with New Models

Verify that the blog generation system works correctly with the newly assigned Apimart models (`nano-banana-2-ext` and `gpt-image-2-ext`) and that images are generated without errors.

## Proposed Steps

### 1. Identify Existing Pending Blog Posts
- Check the `blog_post_queue` table for any posts with `status = 'pending'` and a `scheduled_at` time in the past or near future.

### 2. Manual Trigger of Blog Processing
- I will simulate a trigger of the `process-blog-queue` Edge Function by inspecting its logic. Since I cannot easily run `curl` against a local Edge Function with internal auth without a `CRON_SHARED_SECRET`, I will instead create a small verification script in a new file or use the existing `generate-blog-post` via a browser test if possible.
- **Better approach**: Since the user wants to see if it "works without error", I will check the logs of the most recent executions if they occurred, or I will use a subagent to perform a web search or check the Supabase status if applicable.
- **Actually**, I can use the `supabase--test_edge_functions` tool if available, or I will just write a new plan to check logs.

### 3. Check for Successful Blog Posts
- Query `generated_blog_posts` to see if new posts have been created since the model update.
- Specifically, check if the `image` field is populated with a valid Supabase Storage URL.

### 4. Verify Image Generation
- Verify that the images stored in the `blog-images` bucket are correctly generated and accessible.

## Verification Plan

### Database Check
- Run a query to count pending vs done posts in `blog_post_queue`.
- Run a query to check the most recent posts in `generated_blog_posts` and their image URLs.

### Log Check
- Use `supabase--edge_function_logs` to check for any 500 or 4xx errors in `generate-blog-post` or `process-blog-queue`.
