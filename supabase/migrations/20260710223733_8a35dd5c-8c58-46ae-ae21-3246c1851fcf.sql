
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.manual_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  buyer_country TEXT,
  amount_usd NUMERIC(10,2) NOT NULL,
  amount_local NUMERIC(10,2),
  currency_local TEXT,
  method TEXT NOT NULL DEFAULT 'yape_plin',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.manual_payments TO anon, authenticated;
GRANT ALL ON public.manual_payments TO service_role;

ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create manual payment"
ON public.manual_payments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE INDEX idx_manual_payments_status ON public.manual_payments(status);
CREATE INDEX idx_manual_payments_created ON public.manual_payments(created_at DESC);

CREATE TRIGGER update_manual_payments_updated_at
BEFORE UPDATE ON public.manual_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
