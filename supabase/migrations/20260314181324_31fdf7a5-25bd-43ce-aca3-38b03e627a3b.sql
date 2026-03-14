
CREATE TABLE public.store_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  product_type text NOT NULL DEFAULT 'english',
  store_name text NOT NULL DEFAULT '',
  announcement_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(email, product_type)
);

ALTER TABLE public.store_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON public.store_subscribers FOR ALL USING (false);
