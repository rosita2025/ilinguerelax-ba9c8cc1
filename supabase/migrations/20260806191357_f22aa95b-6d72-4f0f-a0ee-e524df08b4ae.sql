GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_upsells TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_product_changes TO authenticated;

GRANT ALL ON public.digital_products TO service_role;
GRANT ALL ON public.product_upsells TO service_role;
GRANT ALL ON public.digital_product_changes TO service_role;

GRANT SELECT ON public.digital_products TO anon;
GRANT SELECT ON public.product_upsells TO anon;
