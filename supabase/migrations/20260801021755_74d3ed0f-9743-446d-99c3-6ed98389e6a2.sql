CREATE TABLE public.product_version_notices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text NOT NULL,
  notice_key text NOT NULL,
  email text NOT NULL,
  order_number text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX product_version_notices_unique
  ON public.product_version_notices (sku, notice_key, lower(email));
CREATE INDEX product_version_notices_sku_idx
  ON public.product_version_notices (sku, created_at DESC);

GRANT ALL ON public.product_version_notices TO service_role;

ALTER TABLE public.product_version_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages version notices"
  ON public.product_version_notices FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');