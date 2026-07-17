
CREATE TABLE public.checkout_rate_hits (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  ua TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_checkout_rate_hits_ip_time ON public.checkout_rate_hits(ip, created_at DESC);
GRANT ALL ON public.checkout_rate_hits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.checkout_rate_hits_id_seq TO service_role;
ALTER TABLE public.checkout_rate_hits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role manages hits" ON public.checkout_rate_hits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.checkout_ip_bans (
  ip TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT 'rate_limit',
  banned_until TIMESTAMPTZ NOT NULL,
  ua TEXT,
  hits INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_checkout_ip_bans_until ON public.checkout_ip_bans(banned_until DESC);
GRANT ALL ON public.checkout_ip_bans TO service_role;
ALTER TABLE public.checkout_ip_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role manages bans" ON public.checkout_ip_bans FOR ALL TO service_role USING (true) WITH CHECK (true);
