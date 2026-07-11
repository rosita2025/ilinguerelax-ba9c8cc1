-- Lock down public read access on shopify_sales.
-- Only a masked view (first name + last-initial) is exposed publicly.
-- Base table is only readable by service_role (edge functions).

DROP POLICY IF EXISTS "Public can read safe shopify sales columns" ON public.shopify_sales;
DROP POLICY IF EXISTS "Public can read shopify sales" ON public.shopify_sales;

REVOKE SELECT ON public.shopify_sales FROM anon, authenticated;

DROP VIEW IF EXISTS public.shopify_sales_public;

CREATE VIEW public.shopify_sales_public
WITH (security_invoker = true) AS
SELECT
  CASE
    WHEN customer_name IS NULL OR btrim(customer_name) = '' THEN NULL
    ELSE
      split_part(btrim(customer_name), ' ', 1)
      || CASE
           WHEN position(' ' IN btrim(customer_name)) > 0
             THEN ' ' || upper(left(split_part(btrim(customer_name), ' ', 2), 1)) || '.'
           ELSE ''
         END
  END AS customer_name,
  country,
  product_name,
  product_key,
  order_created_at
FROM public.shopify_sales;

GRANT SELECT ON public.shopify_sales_public TO anon, authenticated;
GRANT ALL ON public.shopify_sales TO service_role;