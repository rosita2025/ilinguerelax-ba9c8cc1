DROP POLICY IF EXISTS "Public can read shopify sales" ON public.shopify_sales;

CREATE OR REPLACE VIEW public.shopify_sales_public
WITH (security_invoker = true) AS
SELECT customer_name, country, product_name, product_key, order_created_at
FROM public.shopify_sales;

CREATE POLICY "Public can read safe shopify sales columns"
ON public.shopify_sales
FOR SELECT
USING (true);

REVOKE SELECT ON public.shopify_sales FROM anon, authenticated;
GRANT SELECT (customer_name, country, product_name, product_key, order_created_at)
  ON public.shopify_sales TO anon, authenticated;

GRANT SELECT ON public.shopify_sales_public TO anon, authenticated;