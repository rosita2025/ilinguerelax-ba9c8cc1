
CREATE TABLE public.shopify_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_order_id text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  country text,
  product_name text NOT NULL,
  product_key text NOT NULL DEFAULT 'spanish5000',
  order_created_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_shopify_sales_product_created
  ON public.shopify_sales (product_key, order_created_at DESC);

ALTER TABLE public.shopify_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read shopify sales"
  ON public.shopify_sales
  FOR SELECT
  USING (true);
