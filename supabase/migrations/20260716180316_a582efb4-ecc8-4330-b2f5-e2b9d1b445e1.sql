
CREATE TABLE IF NOT EXISTS public.cart_reminder_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  send_hour SMALLINT NOT NULL DEFAULT 10 CHECK (send_hour BETWEEN 0 AND 23),
  timezone TEXT NOT NULL DEFAULT 'America/Lima',
  enabled_steps SMALLINT[] NOT NULL DEFAULT ARRAY[1,7,15,30]::SMALLINT[],
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cart_reminder_config_singleton CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE ON public.cart_reminder_config TO authenticated;
GRANT ALL ON public.cart_reminder_config TO service_role;

ALTER TABLE public.cart_reminder_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages reminder config"
ON public.cart_reminder_config FOR ALL
TO service_role
USING (true) WITH CHECK (true);

INSERT INTO public.cart_reminder_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.touch_cart_reminder_config()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_touch_cart_reminder_config ON public.cart_reminder_config;
CREATE TRIGGER trg_touch_cart_reminder_config
BEFORE UPDATE ON public.cart_reminder_config
FOR EACH ROW EXECUTE FUNCTION public.touch_cart_reminder_config();
