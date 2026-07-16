
CREATE TABLE IF NOT EXISTS public.digital_delivery_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  order_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  requested_skus TEXT[] NOT NULL DEFAULT '{}',
  normalized_skus TEXT[] NOT NULL DEFAULT '{}',
  resolved_skus TEXT[] NOT NULL DEFAULT '{}',
  missing_skus TEXT[] NOT NULL DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  error TEXT,
  message_id TEXT,
  provider TEXT,
  lang TEXT,
  country TEXT,
  source TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_delivery_audit TO authenticated;
GRANT ALL ON public.digital_delivery_audit TO service_role;
ALTER TABLE public.digital_delivery_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages audit" ON public.digital_delivery_audit
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated read audit" ON public.digital_delivery_audit
  FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS digital_delivery_audit_email_idx ON public.digital_delivery_audit (customer_email, created_at DESC);
CREATE INDEX IF NOT EXISTS digital_delivery_audit_order_idx ON public.digital_delivery_audit (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS digital_delivery_audit_status_idx ON public.digital_delivery_audit (status, created_at DESC);
