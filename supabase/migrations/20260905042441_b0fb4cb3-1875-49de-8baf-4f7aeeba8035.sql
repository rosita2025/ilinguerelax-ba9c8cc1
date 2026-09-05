
DROP VIEW IF EXISTS public.recent_sales_public;

CREATE VIEW public.recent_sales_public
WITH (security_invoker = off)
AS
WITH digital AS (
  SELECT
    d.created_at AS sold_at,
    d.customer_name AS raw_name,
    d.customer_country AS country,
    d.skus[1] AS sku,
    CASE split_part(d.order_id, '-', 2)
      WHEN 'ST' THEN 'stripe'
      WHEN 'DL' THEN 'dlocalgo'
      WHEN 'MP' THEN 'mercadopago'
      WHEN 'MX' THEN 'mercadopago'
      WHEN 'YP' THEN 'hotmart'
      WHEN 'BN' THEN 'binance'
      WHEN 'MANUAL' THEN 'manual'
      ELSE 'other'
    END AS provider
  FROM public.digital_email_sends d
  WHERE d.customer_name IS NOT NULL
    AND coalesce(d.status, 'sent') IN ('sent', 'delivered', 'opened', 'clicked')
    AND d.order_id IS NOT NULL
    AND split_part(d.order_id, '-', 2) IN ('ST','DL','MP','MX','YP','BN','MANUAL')
    AND array_length(d.skus, 1) > 0
),
manual AS (
  SELECT
    m.created_at AS sold_at,
    m.buyer_name AS raw_name,
    m.buyer_country AS country,
    (m.items -> 0 ->> 'sku') AS sku,
    'manual'::text AS provider
  FROM public.manual_payments m
  WHERE m.status = 'approved' AND m.buyer_name IS NOT NULL
),
physical AS (
  SELECT
    s.order_created_at AS sold_at,
    s.customer_name AS raw_name,
    s.country,
    s.product_key AS sku,
    'shopify'::text AS provider
  FROM public.shopify_sales s
),
unioned AS (
  SELECT * FROM digital
  UNION ALL SELECT * FROM manual
  UNION ALL SELECT * FROM physical
)
SELECT
  -- Privacy: first name + initial of the surname only
  trim(split_part(trim(u.raw_name), ' ', 1)) ||
    CASE
      WHEN nullif(trim(split_part(trim(u.raw_name), ' ', 2)), '') IS NOT NULL
        THEN ' ' || left(trim(split_part(trim(u.raw_name), ' ', 2)), 1) || '.'
      ELSE ''
    END AS buyer_name,
  upper(coalesce(u.country, '')) AS country,
  u.sku,
  coalesce(p.name, u.sku) AS product_name,
  u.provider,
  u.sold_at
FROM unioned u
LEFT JOIN public.digital_products p
  ON p.sku = u.sku OR u.sku = ANY (p.sku_aliases)
WHERE u.sold_at > now() - interval '180 days'
ORDER BY u.sold_at DESC;

GRANT SELECT ON public.recent_sales_public TO anon, authenticated;
