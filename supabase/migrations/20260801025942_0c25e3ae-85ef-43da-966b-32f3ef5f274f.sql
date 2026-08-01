CREATE TABLE public.product_launch_notices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text NOT NULL,
  launch_key text NOT NULL,
  email text NOT NULL,
  audience text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.product_launch_notices TO service_role;

ALTER TABLE public.product_launch_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages launch notices"
ON public.product_launch_notices
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE UNIQUE INDEX product_launch_notices_unique
  ON public.product_launch_notices (sku, launch_key, lower(email));

CREATE INDEX product_launch_notices_sku_idx
  ON public.product_launch_notices (sku, created_at DESC);