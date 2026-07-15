
CREATE TABLE public.brevo_product_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type text NOT NULL CHECK (match_type IN ('hotmart_product_id','hotmart_product_code','tienda_sku','category','any_sku')),
  match_value text NOT NULL,
  event_kind text NOT NULL DEFAULT 'any' CHECK (event_kind IN ('any','compra','abandonado')),
  list_id integer NOT NULL,
  tag text,
  label text,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_type, match_value, event_kind, list_id)
);

CREATE INDEX brevo_product_audiences_lookup_idx
  ON public.brevo_product_audiences (active, match_type, match_value);

GRANT ALL ON public.brevo_product_audiences TO service_role;

ALTER TABLE public.brevo_product_audiences ENABLE ROW LEVEL SECURITY;

-- No public/authenticated policies: only service_role (edge functions) reads/writes.
-- Admin UI goes through edge functions guarded by admin CSRF + 2FA.

CREATE OR REPLACE FUNCTION public.brevo_product_audiences_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER brevo_product_audiences_touch
BEFORE UPDATE ON public.brevo_product_audiences
FOR EACH ROW EXECUTE FUNCTION public.brevo_product_audiences_touch();
