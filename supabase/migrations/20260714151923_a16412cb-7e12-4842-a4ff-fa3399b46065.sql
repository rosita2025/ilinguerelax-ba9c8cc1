
-- Config table for automatic digital delivery retries
CREATE TABLE IF NOT EXISTS public.digital_delivery_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_minutes INT NOT NULL DEFAULT 10,
  max_attempts INT NOT NULL DEFAULT 5,
  scan_window_hours INT NOT NULL DEFAULT 24,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.digital_delivery_config TO authenticated;
GRANT ALL ON public.digital_delivery_config TO service_role;
ALTER TABLE public.digital_delivery_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read digital delivery config" ON public.digital_delivery_config;
CREATE POLICY "read digital delivery config" ON public.digital_delivery_config FOR SELECT TO authenticated USING (true);
INSERT INTO public.digital_delivery_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Alerts for orders that need manual attention (missing SKUs, exhausted retries)
CREATE TABLE IF NOT EXISTS public.digital_delivery_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_ref TEXT,
  customer_email TEXT,
  reason TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source, source_ref, reason)
);
GRANT ALL ON public.digital_delivery_alerts TO service_role;
ALTER TABLE public.digital_delivery_alerts ENABLE ROW LEVEL SECURITY;
-- Only service_role (edge functions) can read/write. Admin panel reaches this via an edge function.

-- Track attempts on the send log so we know when to give up
ALTER TABLE public.digital_email_sends
  ADD COLUMN IF NOT EXISTS retry_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.touch_digital_delivery_config()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_touch_digital_delivery_config ON public.digital_delivery_config;
CREATE TRIGGER trg_touch_digital_delivery_config
  BEFORE UPDATE ON public.digital_delivery_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_digital_delivery_config();

DROP TRIGGER IF EXISTS trg_touch_digital_delivery_alerts ON public.digital_delivery_alerts;
CREATE TRIGGER trg_touch_digital_delivery_alerts
  BEFORE UPDATE ON public.digital_delivery_alerts
  FOR EACH ROW EXECUTE FUNCTION public.touch_digital_delivery_config();
