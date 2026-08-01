CREATE TABLE IF NOT EXISTS public.pinterest_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'blog',
  title text,
  image_url text,
  pin_id text,
  status text NOT NULL DEFAULT 'skipped',
  detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.pinterest_publications TO service_role;
ALTER TABLE public.pinterest_publications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS pinterest_publications_created_idx ON public.pinterest_publications (created_at DESC);

DROP TRIGGER IF EXISTS touch_pinterest_publications ON public.pinterest_publications;
CREATE TRIGGER touch_pinterest_publications
BEFORE UPDATE ON public.pinterest_publications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();