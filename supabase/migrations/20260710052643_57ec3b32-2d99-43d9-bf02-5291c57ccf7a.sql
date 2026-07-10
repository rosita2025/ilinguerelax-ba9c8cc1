
CREATE TABLE IF NOT EXISTS public.webhook_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error',
  reason TEXT NOT NULL,
  data_id TEXT,
  event_type TEXT,
  http_status INT,
  payload JSONB,
  error_message TEXT,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_alerts_created_at ON public.webhook_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_alerts_provider ON public.webhook_alerts (provider, created_at DESC);

GRANT ALL ON public.webhook_alerts TO service_role;

ALTER TABLE public.webhook_alerts ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (edge functions) can access.
