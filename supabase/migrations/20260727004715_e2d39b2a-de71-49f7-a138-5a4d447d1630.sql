ALTER TABLE public.checkout_rate_hits
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS checkout_rate_hits_ip_created_idx ON public.checkout_rate_hits (ip, created_at DESC);