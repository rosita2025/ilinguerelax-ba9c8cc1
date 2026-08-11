
-- Cleanup migration for Hotmart related auditing tables and objects
DROP TABLE IF EXISTS public.hotmart_purchases CASCADE;
DROP TABLE IF EXISTS public.abandoned_carts CASCADE;
