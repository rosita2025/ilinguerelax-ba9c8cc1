CREATE TABLE IF NOT EXISTS public.digital_email_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  order_id TEXT,
  customer_email TEXT NOT NULL,
  skus TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.digital_email_sends TO service_role;
ALTER TABLE public.digital_email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.digital_email_sends FOR ALL TO service_role USING (true) WITH CHECK (true);