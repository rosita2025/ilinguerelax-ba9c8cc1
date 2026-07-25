CREATE TABLE IF NOT EXISTS public.meta_attribution (
  email TEXT PRIMARY KEY,
  fbc TEXT,
  fbp TEXT,
  country TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '28 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.meta_attribution TO service_role;

ALTER TABLE public.meta_attribution ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages meta attribution" ON public.meta_attribution;
CREATE POLICY "Service role manages meta attribution"
  ON public.meta_attribution FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_meta_attribution_expires ON public.meta_attribution(expires_at);