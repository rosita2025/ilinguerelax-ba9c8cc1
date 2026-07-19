UPDATE public.generated_blog_posts
SET google_index_requested_at = COALESCE(google_index_requested_at, updated_at, created_at)
WHERE published = true
  AND google_index_requested_at IS NULL;