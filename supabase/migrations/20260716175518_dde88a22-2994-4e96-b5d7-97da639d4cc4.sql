
CREATE TABLE IF NOT EXISTS public.cart_reminder_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('hotmart','tienda')),
  step INT NOT NULL CHECK (step IN (1,7,15,30)),
  cart_url TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  UNIQUE (email, product_sku, step)
);

GRANT SELECT ON public.cart_reminder_sends TO authenticated;
GRANT ALL ON public.cart_reminder_sends TO service_role;
ALTER TABLE public.cart_reminder_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_service_role_only" ON public.cart_reminder_sends FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS cart_reminder_sends_sent_at_idx ON public.cart_reminder_sends (sent_at DESC);
