CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.hotmart_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  transaction_code text NOT NULL UNIQUE,
  product_code text,
  product_id text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  refund_deadline timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','refunded','cancelled','chargeback')),
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hotmart_purchases_email ON public.hotmart_purchases (email);
CREATE INDEX idx_hotmart_purchases_status ON public.hotmart_purchases (status);

GRANT ALL ON public.hotmart_purchases TO service_role;

ALTER TABLE public.hotmart_purchases ENABLE ROW LEVEL SECURITY;

-- No public access; all validation goes through edge functions with service role.
CREATE POLICY "No client access to hotmart_purchases"
  ON public.hotmart_purchases
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.set_updated_at_hotmart()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_hotmart_purchases_updated
  BEFORE UPDATE ON public.hotmart_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_hotmart();