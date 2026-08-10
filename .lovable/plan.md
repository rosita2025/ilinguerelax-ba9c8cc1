# Plan - Apimart AI Models and Parameters Update for Blog Generation

Update the blog generation system to use the specific Apimart.ai models and parameters requested by the user for both text and images.

## User Requirements
- **Text Model**: `nano-banana-2-ext` (via Apimart)
- **Image Model**: `gpt-image-2-ext` (via Apimart)
- **Image Parameters**: 1k resolution (1024x1024), 1:1 aspect ratio, 1 image per post.
- **Scheduling**: Maintain the "one post per day" (or scheduled queue) functionality.

## Proposed Changes

### 1. Update `supabase/functions/_shared/blogGenerator.ts`
- Modify the `generateImage` function:
    - Set `model` to `"gpt-image-2-ext"`.
    - Ensure `size` is `"1024x1024"`.
    - Confirm `n` is `1`.
- Modify the `generateAndStorePost` function:
    - Set the text `model` to `"nano-banana-2-ext"`.

## Verification Plan

### Automated Tests
- No specific automated tests exist for these Edge Functions in the current context, but I can trigger a manual generation from the Admin panel once the changes are applied.

### Manual Verification
- Deploy the updated Edge Function code.
- Trigger `generate-blog-post` via the Admin panel or a `curl` command to verify that the Apimart API is called with the new models.
- Check Supabase logs for `generate-blog-post` or `process-blog-queue` to confirm successful execution and model usage.
