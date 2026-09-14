CREATE TABLE IF NOT EXISTS public.abandoned_sync_claims (
  email text NOT NULL,
  sync_day date NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (email, sync_day)
);

GRANT ALL ON public.abandoned_sync_claims TO service_role;

ALTER TABLE public.abandoned_sync_claims ENABLE ROW LEVEL SECURITY;