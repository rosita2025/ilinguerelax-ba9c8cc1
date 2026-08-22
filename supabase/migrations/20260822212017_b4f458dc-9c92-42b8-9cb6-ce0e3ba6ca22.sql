-- 1) Pin search_path on functions flagged as mutable
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.handle_exchange_rate_update() SET search_path = public;

-- 2) has_role must not be callable by anonymous users. It stays executable
-- by `authenticated` because admin RLS policies evaluate it as that role.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 3) digital_products: real admin check on writes
DROP POLICY IF EXISTS "Admins can manage products v5" ON public.digital_products;
CREATE POLICY "Admins can manage products v5" ON public.digital_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) digital_products: column-level privileges — hide delivery secrets
-- (drive_url, access_key, bonus_*, mp_preference_template, stripe ids) from
-- anon/authenticated; public catalog keeps name/prices/images/ratings.
REVOKE SELECT ON public.digital_products FROM anon, authenticated;
GRANT SELECT (
  id, sku, name, description, learner_language, target_language,
  price_usd, price_usd_latam, price_usd_tienda, price_pen,
  compare_at_price_usd, compare_at_price_usd_latam, compare_at_price_usd_tienda, compare_at_price_pen,
  local_prices, local_usd_prices, local_compare_at_prices,
  cover_image_url, gallery_images, gallery_metadata,
  is_upsell, is_physical, active, sort_order, sku_aliases,
  hotmart_url, hotmart_urls_by_country, hotmart_prices_by_country,
  store_enabled, excluded_countries, store_excluded_countries, hotmart_excluded_countries,
  rating, review_count, bonus_titles, created_at, updated_at
) ON public.digital_products TO anon, authenticated;

-- 5) digital_product_changes: admin-only via has_role
DROP POLICY IF EXISTS "Admins can do everything on changes" ON public.digital_product_changes;
DROP POLICY IF EXISTS "Admins can view digital_product_changes" ON public.digital_product_changes;
CREATE POLICY "Admins can manage digital_product_changes" ON public.digital_product_changes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6) product_upsells: drop policies granting ALL to any authenticated user
-- (the "Admins can manage upsells" has_role policy remains).
DROP POLICY IF EXISTS "Admins can do everything on upsells" ON public.product_upsells;
DROP POLICY IF EXISTS "Admins can manage product_upsells" ON public.product_upsells;

-- 7) storage: product-images becomes read-only for the public.
DROP POLICY IF EXISTS "product_images_v8_objects_all" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');