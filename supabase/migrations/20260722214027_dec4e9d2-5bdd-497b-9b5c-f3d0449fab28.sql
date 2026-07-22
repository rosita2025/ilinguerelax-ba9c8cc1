ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS hotmart_urls_by_country jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hotmart_prices_by_country jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.digital_products.hotmart_urls_by_country IS 'Map ISO country code -> Hotmart checkout URL. Fallback to hotmart_url when key missing.';
COMMENT ON COLUMN public.digital_products.hotmart_prices_by_country IS 'Map ISO country code -> { amount:number, currency:string, label?:string } shown on the Hotmart 1-click method (e.g. { "MX": { "amount": 180, "currency": "MXN" } }).';