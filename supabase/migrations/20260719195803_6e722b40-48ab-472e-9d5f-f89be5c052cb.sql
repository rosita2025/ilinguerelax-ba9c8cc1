ALTER TABLE public.generated_blog_posts
ADD COLUMN IF NOT EXISTS google_index_requested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS generated_blog_posts_google_index_requested_idx
ON public.generated_blog_posts (google_index_requested_at)
WHERE google_index_requested_at IS NOT NULL;