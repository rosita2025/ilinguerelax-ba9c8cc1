CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  event_key TEXT NOT NULL,
  order_number TEXT,
  reference TEXT,
  status TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_webhook_events_unique
  ON public.payment_webhook_events (provider, event_key);
CREATE INDEX IF NOT EXISTS payment_webhook_events_order_idx
  ON public.payment_webhook_events (order_number);

GRANT ALL ON public.payment_webhook_events TO service_role;

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;