# Plan: Fix Apimart SSE JSON Parsing and Blog Generation Content

The user is experiencing a `JSON.parse` error (`Unexpected token 'd', "data: {"id"... is not valid JSON`) during blog generation. This happens because Apimart sometimes returns Server-Sent Events (SSE) format (prefixed with `data: `) even when a standard JSON response is expected. Additionally, the user wants the generated articles to be around 1200 words and include a product card, image, and "generate preview" button without requiring immediate publication.

## Proposed Changes

### 1. `supabase/functions/_shared/blogGenerator.ts`
- **Improve `parseAiResponse`**: The current implementation attempts to handle SSE but might be failing if the response starts with `data: ` but doesn't follow the expected structure perfectly or if `res.json()` is called before `parseAiResponse`.
- **Refine Prompt**: Update the system prompt to explicitly request ~1200 words and ensure the JSON structure is strictly followed.
- **Image Handling**: Ensure the image generation prompt and logic are robust.

### 2. `supabase/functions/generate-blog-post/index.ts` & `supabase/functions/process-blog-queue/index.ts`
- **Avoid early `res.json()`**: Ensure we use `res.text()` first and then pass it to `parseAiResponse` instead of calling `.json()` which crashes on SSE.
- **Preview vs Publish**: Ensure the `publish` flag is handled correctly so articles can be generated as drafts for preview.

### 3. `src/pages/BlogPost.tsx`
- **Render Content**: Ensure the markdown parser correctly handles the 1200+ word content and product cards.

## Validation Plan
1. **Manual Check**: Verify `blogGenerator.ts` logic for `parseAiResponse`.
2. **Edge Function Test**: (Simulated) Check that `generate-blog-post` correctly parses a mock SSE response.
3. **UI Check**: Verify that the blog post page renders long content correctly.
