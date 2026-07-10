ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS store_excluded_countries text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS hotmart_excluded_countries text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.digital_products
SET store_excluded_countries = excluded_countries,
    hotmart_excluded_countries = excluded_countries
WHERE array_length(excluded_countries, 1) > 0
  AND array_length(store_excluded_countries, 1) IS NULL
  AND array_length(hotmart_excluded_countries, 1) IS NULL;