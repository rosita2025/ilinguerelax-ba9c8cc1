CREATE TABLE IF NOT EXISTS public.postpurchase_upsell_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  source_sku TEXT NOT NULL,
  offered_skus TEXT[] NOT NULL DEFAULT '{}',
  day INT NOT NULL,
  source_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'claimed',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  UNIQUE (customer_email, source_sku, day)
);
GRANT ALL ON public.postpurchase_upsell_sends TO service_role;
ALTER TABLE public.postpurchase_upsell_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.postpurchase_upsell_sends
  FOR ALL TO service_role USING (true) WITH CHECK (true);