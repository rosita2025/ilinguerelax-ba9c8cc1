ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS store_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS excluded_countries text[] NOT NULL DEFAULT '{}'::text[];