
ALTER TABLE public.manual_payments ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.manual_payments ADD COLUMN IF NOT EXISTS shipping_provider TEXT;

ALTER TABLE public.shopify_sales ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.shopify_sales ADD COLUMN IF NOT EXISTS shipping_provider TEXT;

GRANT SELECT, UPDATE ON public.manual_payments TO authenticated;
GRANT SELECT, UPDATE ON public.shopify_sales TO authenticated;
GRANT ALL ON public.manual_payments TO service_role;
GRANT ALL ON public.shopify_sales TO service_role;
