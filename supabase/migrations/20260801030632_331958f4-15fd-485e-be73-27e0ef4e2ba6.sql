ALTER VIEW public.digital_products_public SET (security_invoker = on);

CREATE POLICY "Public can view active products" ON public.digital_products
FOR SELECT USING (active = true);

GRANT SELECT (
  id, sku, name, description, learner_language, target_language,
  price_usd, price_pen, price_usd_latam, price_usd_tienda,
  cover_image_url, is_upsell, is_physical, active, sort_order,
  sku_aliases, local_prices,
  hotmart_url, hotmart_urls_by_country, hotmart_prices_by_country,
  store_enabled, excluded_countries, store_excluded_countries, hotmart_excluded_countries,
  bonus_name, bonus_titles, created_at, updated_at
) ON public.digital_products TO anon, authenticated;