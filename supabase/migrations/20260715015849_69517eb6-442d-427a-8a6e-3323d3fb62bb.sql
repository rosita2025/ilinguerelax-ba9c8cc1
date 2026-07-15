
CREATE TABLE public.checkout_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  flag text,
  currency text NOT NULL,
  gateway text,
  description text,
  country_codes text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.checkout_regions TO anon, authenticated;
GRANT ALL ON public.checkout_regions TO service_role;
ALTER TABLE public.checkout_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read enabled regions" ON public.checkout_regions FOR SELECT USING (true);

CREATE TABLE public.checkout_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code text NOT NULL REFERENCES public.checkout_regions(code) ON DELETE CASCADE,
  method_key text NOT NULL,
  label text NOT NULL,
  note text,
  icon text NOT NULL DEFAULT 'CreditCard',
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (region_code, method_key)
);
GRANT SELECT ON public.checkout_payment_methods TO anon, authenticated;
GRANT ALL ON public.checkout_payment_methods TO service_role;
ALTER TABLE public.checkout_payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read methods" ON public.checkout_payment_methods FOR SELECT USING (true);

CREATE TRIGGER trg_checkout_regions_updated BEFORE UPDATE ON public.checkout_regions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_checkout_methods_updated BEFORE UPDATE ON public.checkout_payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.checkout_regions (code, name, flag, currency, gateway, description, country_codes, sort_order) VALUES
('PE', 'Perú', '🇵🇪', 'PEN (S/)', 'Mercado Pago + Manual', 'Compradores con IP peruana. Métodos locales en soles.', ARRAY['PE'], 1),
('US', 'Estados Unidos', '🇺🇸', 'USD ($)', 'Stripe + PayPal', 'Compradores con IP en USA. Stripe con múltiples métodos + PayPal.', ARRAY['US'], 2),
('GLOBAL', 'Global (resto del mundo)', '🌎', 'USD adaptive', 'Stripe + PayPal', 'Fallback. Stripe convierte a moneda local automáticamente.', ARRAY['*'], 3);

INSERT INTO public.checkout_payment_methods (region_code, method_key, label, note, icon, sort_order) VALUES
('PE','yape','Yape','Manual, confirmamos nosotros','Smartphone',1),
('PE','plin','Plin','Manual, confirmamos nosotros','Smartphone',2),
('PE','mercadopago','Mercado Pago','Tarjeta / PagoEfectivo / PagoFácil','CreditCard',3),
('PE','transferencia','Transferencia BCP / Interbank','Manual','Banknote',4),
('US','stripe_card','Tarjeta crédito/débito','Visa, Mastercard, Amex, Discover','CreditCard',1),
('US','stripe_cashapp','Cash App Pay','Solo USA con USD','Wallet',2),
('US','stripe_ach','Transferencia ACH','Stripe genera cuenta virtual','Banknote',3),
('US','stripe_link','Link (Stripe)','One-click guardado','Wallet',4),
('US','paypal','PayPal','Botón separado','Wallet',5),
('GLOBAL','stripe_card','Tarjeta crédito/débito','Global · adaptive pricing','CreditCard',1),
('GLOBAL','stripe_customer_balance','Transferencia internacional','Cuenta virtual por pago','Banknote',2),
('GLOBAL','stripe_link','Link (Stripe)','One-click guardado','Wallet',3),
('GLOBAL','paypal','PayPal','Botón separado','Wallet',4);
