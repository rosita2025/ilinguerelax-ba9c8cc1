# Plan: Blog SEO Content Optimization

We will optimize the blog generation system to produce high-quality, SEO-optimized articles (targeting ~1800 words) with proper heading structures, natural keyword integration, and educational imagery.

## User Requirements
- **Content Length**: ~1800 words (Deep coverage without fluff).
- **Structure**: ONE H1, multiple H2s, H3s, and subheadings.
- **SEO**: Primary keyword integration in headers and first paragraph.
- **Media**: One high-quality educational image per post (Flux Schnell).
- **Integrations**: Natural inclusion of `[PRODUCT_CARD:slug]` shortcodes.
- **Agenda**: 10 posts/day (50 over 5 days) at specific slots (8, 9, 11, 13, 20 Peru time).

## Proposed Changes

### 1. Edge Functions (`supabase/functions/_shared/blogGenerator.ts`)
- Refine the `system` prompt to target the 1500-1800 word range.
- Enhance the structure requirements: H1, H2, H3, FAQ, and Conclusion.
- Stricter keyword density and placement instructions.
- Ensure the `flux-schnell` image prompt is optimized for educational contexts.

### 2. Admin UI (`src/components/admin/BlogScheduleCard.tsx`)
- (Already updated in previous turns to show 10 posts/day, but I will double-check the labels).

### 3. Edge Functions (`supabase/functions/manage-blog-queue/index.ts`)
- (Already configured for 10 posts/day, will ensure the `KEYWORDS` and `ANGLES` are diverse enough).

## Validation Plan
1. **Manual Trigger**: Generate a single post from the admin panel and verify the content length and structure.
2. **Image Check**: Verify the generated image is stored in Supabase Storage and accessible.
3. **Queue Check**: Verify the `blog_post_queue` is seeded correctly for the 5-day agenda.
