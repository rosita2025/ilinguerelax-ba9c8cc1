# Blog Automation Optimization Plan

The goal is to ensure the blog automation system is fully autonomous, auto-publishes content, and includes product cards as requested.

## 1. Edge Function Updates

### 1.1 `process-blog-queue`
- **Action**: Fetch active products from the database and pass them to the generator.
- **Why**: Currently, the automated queue doesn't pass product context, leading to missing or hallucinated product cards in AI-generated articles.
- **Implementation**: Query `digital_products` for active items and map them to the `productCards` format.

### 1.2 `manage-blog-queue`
- **Action**: Verify the 300-post seeding logic.
- **Result**: Confirmed `DAYS = 30` and `POSTS_PER_SLOT = 2` with 5 slots daily (total 300).

## 2. AI Generator Updates (`_shared/blogGenerator.ts`)

- **Action**: Refine the prompt to ensure product cards are integrated even more naturally in the automated flow.
- **Action**: Double-check the image generation model and fallbacks to ensure every post gets a high-quality image without manual intervention.

## 3. UI Refinement (`BlogScheduleCard.tsx`)

- **Action**: Ensure the dashboard reflects the "Auto-Publish" state clearly to reassure the user. (Already mostly complete, will perform a final review).

## Verification
- Run a test generation of a single queue item to confirm products are included in the AI prompt and the resulting content contains `[PRODUCT_CARD:slug]`.
- Confirm `publish: true` is respected in the queue processing.
