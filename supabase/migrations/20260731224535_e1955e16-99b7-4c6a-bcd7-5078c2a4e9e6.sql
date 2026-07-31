REVOKE EXECUTE ON FUNCTION public.log_digital_product_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_digital_product_change() TO service_role;