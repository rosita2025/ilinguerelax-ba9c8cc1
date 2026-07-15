
CREATE TABLE public.brevo_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  source text,
  origin text,
  email text,
  product_name text,
  product_sku text,
  order_ref text,
  status text NOT NULL,
  http_status int,
  attributes jsonb,
  response text,
  error text
);
CREATE INDEX brevo_sync_logs_created_idx ON public.brevo_sync_logs(created_at DESC);
CREATE INDEX brevo_sync_logs_event_idx ON public.brevo_sync_logs(event_type);
CREATE INDEX brevo_sync_logs_email_idx ON public.brevo_sync_logs(email);
GRANT ALL ON public.brevo_sync_logs TO service_role;
ALTER TABLE public.brevo_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.brevo_sync_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
