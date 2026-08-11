# Plan - Pinterest Auto-Publish & RSS Feeds

The user wants to ensure that content (products and blog posts) is automatically published to Pinterest via RSS feeds. 

## Proposed Changes

### 1. Backend: Blog RSS Feed Enhancement
- **File**: `supabase/functions/blog-feed/index.ts`
- **Action**: Already updated to include the `image` field in the query and add the `media:content` and `enclosure` tags to the RSS output. This allows Pinterest to correctly "see" the images for each blog post when importing via RSS.

### 2. Admin UI: Pinterest RSS Management
- **File**: `src/components/admin/PinterestRSSCard.tsx` (New)
- **Action**: Create a new component to display the public RSS URLs for both products and blog posts. This makes it easy for the admin to copy these links into Pinterest Business Settings.
- **File**: `src/pages/AdminSEO.tsx`
- **Action**: Integrate the `PinterestRSSCard` into the SEO dashboard.

### 3. Database: Pinterest Publications Tracking
- **Action**: Ensure the `pinterest_publications` table is healthy and logs are accessible. (Table already exists, verified via `psql`).

## Verification Plan

### Automated Tests
- **Blog Feed**: Verify the RSS output by calling the Edge Function locally (if possible) or checking the XML structure in the code.
- **Admin UI**: Check that the `PinterestRSSCard` renders correctly in the SEO panel.

### Manual Verification
1. Navigate to `/admin/seo`.
2. Locate the "Pinterest Feeds & RSS" card.
3. Verify that the URLs are correct (e.g., `https://.../functions/v1/blog-feed?format=rss`).
4. Click "Ver XML" to ensure the feed generates without errors.
