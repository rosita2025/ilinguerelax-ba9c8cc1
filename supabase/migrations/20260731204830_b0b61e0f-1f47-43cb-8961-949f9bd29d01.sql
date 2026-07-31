CREATE TABLE public.blog_post_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  keyword text NOT NULL,
  language text NOT NULL DEFAULT 'es',
  category text NOT NULL DEFAULT 'Aprendizaje',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  error text,
  post_id uuid,
  post_slug text,
  batch text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_post_queue_due_idx ON public.blog_post_queue (status, scheduled_at);

GRANT ALL ON public.blog_post_queue TO service_role;

ALTER TABLE public.blog_post_queue ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER blog_post_queue_touch
BEFORE UPDATE ON public.blog_post_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();