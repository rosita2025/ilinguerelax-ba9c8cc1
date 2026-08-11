# Plan - Restore AI Blog Image Generation and Scheduling

The user wants to ensure the "Generador de post SEO" (SEO blog post generator) produces images and follows the scheduled agenda (10 posts per day). My investigation shows that previous generated posts defaulted to the OG image because the image generation step was failing or not properly integrated.

## Proposed Changes

### 1. Database & Edge Functions
- **Verify Storage Bucket**: Ensure `blog-images` exists and has proper public read access.
- **Enhance `blogGenerator.ts`**:
    - Ensure the `generateImage` function correctly handles Apimart's `gpt-image-2-ext` response.
    - Add more detailed logging to diagnose why images were failing to save.
    - Ensure the `image` field in `generated_blog_posts` is updated with the new URL.

### 2. Blog Schedule & Queue
- **Agenda Verification**: The user mentioned "10 posts al dia". The current configuration in `manage-blog-queue` uses 5 slots per day with 2 posts each = 10 posts/day.
- **Seed/Refresh**: If the queue is empty, I will re-seed it with the correct keywords to ensure content keeps flowing.

### 3. Verification
- **Test Generation**: Manually trigger one generation via the admin interface (simulated or real call) to verify the image URL is no longer the default.
- **Check Scheduled Times**: Ensure the `scheduled_at` times align with the user's requested Peruvian time slots.

## User Review Required

> [!IMPORTANT]
> The image generator was defaulting to the site logo because the previous model was failing. I have updated the system to use a more stable image model. 
> Should I re-generate images for the posts created in the last 24 hours that are currently missing them?

---

*Note: The user request mentioned a visual text edit about changing `\u2063` (invisible separator). This is likely a transport artifact and doesn't require a functional change, but I will ensure it doesn't break the UI.*
