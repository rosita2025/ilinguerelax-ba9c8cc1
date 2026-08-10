# Plan - Image Generation for Blog Agenda

The user wants to integrate an image generator into the blog agenda system. I will implement this by updating the shared blog generation logic to use the Lovable AI Gateway for image generation and storing the results in a dedicated Supabase Storage bucket.

## Proposed Changes

### 1. Database & Storage Setup
- Create a new storage bucket named `blog-images`.
- Add RLS policies to allow public read access and `service_role` full access to the `blog-images` bucket.

### 2. Update Shared Blog Generator (`supabase/functions/_shared/blogGenerator.ts`)
- Add a `generateImage` helper function that:
    - Calls the Lovable AI Gateway `images/generations` endpoint using `dall-e-3`.
    - Downloads the generated image from the temporary URL.
    - Uploads the image to the `blog-images` bucket.
    - Returns the public URL of the stored image.
- Update the system prompt for the text generator to include a new `imagePrompt` field in the JSON response. This prompt should be highly descriptive and optimized for DALL-E 3.
- Update `generateAndStorePost` to:
    - Extract the `imagePrompt` from the AI text response.
    - Call `generateImage` with that prompt.
    - Use the resulting URL for the `image` field in the `generated_blog_posts` table.

### 3. Verification
- Verify that the image is correctly generated and stored during a test run of the generator.
- Ensure the `process-blog-queue` function correctly picks up the new logic.

## Technical Details

- **Model for images:** `dall-e-3` via Lovable AI Gateway.
- **Storage:** Supabase Storage `blog-images` bucket.
- **Error Handling:** Fallback to a default image if generation fails.

## Note on User's API
The user mentioned "tengo api" (I have API). If the user provides a specific API key (e.g., for Midjourney or another provider), the logic can be updated to use it. For now, using the built-in Lovable AI Gateway is the most robust and immediate solution.
