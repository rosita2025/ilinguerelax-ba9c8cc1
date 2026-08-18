-- 1. Actualizar la tabla digital_products para incluir los campos de "compare at"
ALTER TABLE public.digital_products 
ADD COLUMN IF NOT EXISTS compare_at_price_usd NUMERIC,
ADD COLUMN IF NOT EXISTS compare_at_price_usd_latam NUMERIC,
ADD COLUMN IF NOT EXISTS compare_at_price_usd_tienda NUMERIC,
ADD COLUMN IF NOT EXISTS compare_at_price_pen NUMERIC,
ADD COLUMN IF NOT EXISTS local_compare_at_prices JSONB DEFAULT '{}'::jsonb;

-- 2. Asegurar que los permisos estén correctamente otorgados (exigido por las reglas de Supabase/Lovable Cloud)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;
