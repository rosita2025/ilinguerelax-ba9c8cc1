-- 1) Ocultar enlaces de descarga y claves del catálogo público
REVOKE ALL ON public.digital_products FROM anon, authenticated;

ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS bonus_titles jsonb
  GENERATED ALWAYS AS (
    CASE WHEN jsonb_typeof(bonuses) = 'array'
      THEN jsonb_path_query_array(bonuses, '$[*].name')
      ELSE '[]'::jsonb END
  ) STORED;

GRANT SELECT (
  id, sku, name, description, learner_language, target_language,
  price_usd, price_pen, price_usd_latam, price_usd_tienda,
  cover_image_url, is_upsell, is_physical, active, sort_order,
  created_at, updated_at, hotmart_url, store_enabled,
  excluded_countries, store_excluded_countries, hotmart_excluded_countries,
  sku_aliases, local_prices, hotmart_urls_by_country, hotmart_prices_by_country,
  stripe_product_id, stripe_price_id, bonus_titles
) ON public.digital_products TO anon, authenticated;

GRANT ALL ON public.digital_products TO service_role;

-- 2) Realtime enviaba la fila completa (incluyendo drive_url) a cualquier navegador
ALTER PUBLICATION supabase_realtime DROP TABLE public.digital_products;

-- 3) La auditoría de entregas (correos de clientes y enlaces) ya no es legible por clientes
DROP POLICY IF EXISTS "authenticated read audit" ON public.digital_delivery_audit;
REVOKE ALL ON public.digital_delivery_audit FROM anon, authenticated;
GRANT ALL ON public.digital_delivery_audit TO service_role;