
CREATE TABLE IF NOT EXISTS public.binance_pay_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_code TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  qr_url TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'Binance Pay (Pay ID)',
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.binance_pay_configs TO anon, authenticated;
GRANT ALL ON public.binance_pay_configs TO service_role;

ALTER TABLE public.binance_pay_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active binance configs"
  ON public.binance_pay_configs FOR SELECT
  USING (active = TRUE);

CREATE TRIGGER binance_pay_configs_touch
  BEFORE UPDATE ON public.binance_pay_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.binance_pay_configs (region_code, address, holder_name, qr_url, network, active)
VALUES (
  'DEFAULT',
  'TPAwV7vFhuoYbwzEzmDuN229DwFUBCKH TF',
  'iLingue Relax',
  'https://cdn.phototourl.com/free/2026-07-17-19c64084-faa9-41f1-a1cb-5010d297c0be.jpg',
  'Binance Pay (Pay ID)',
  TRUE
) ON CONFLICT (region_code) DO NOTHING;
