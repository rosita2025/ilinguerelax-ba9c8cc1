
-- 1. digital_products: column-level grants to hide sensitive fields from public
REVOKE SELECT ON public.digital_products FROM anon, authenticated;
GRANT SELECT (
  id, sku, name, description, learner_language, target_language,
  price_usd, price_usd_latam, price_usd_tienda, price_pen,
  cover_image_url, is_upsell, stripe_product_id, stripe_price_id,
  mp_preference_template, active, sort_order, created_at, updated_at,
  bonus_name, bonuses, hotmart_url, store_enabled,
  excluded_countries, store_excluded_countries, hotmart_excluded_countries,
  is_physical
) ON public.digital_products TO anon, authenticated;

-- 2. Storage: restrict product-images writes to service_role only
DROP POLICY IF EXISTS "product-images anon upload" ON storage.objects;
DROP POLICY IF EXISTS "product-images anon update" ON storage.objects;
DROP POLICY IF EXISTS "product-images anon delete" ON storage.objects;
DROP POLICY IF EXISTS "product-images public read" ON storage.objects;

CREATE POLICY "product-images service write"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product-images service update"
ON storage.objects FOR UPDATE TO service_role
USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product-images service delete"
ON storage.objects FOR DELETE TO service_role
USING (bucket_id = 'product-images');

-- 3. Storage: review-photos - remove broad SELECT to block listing;
-- direct public URLs still resolve via CDN because bucket remains public.
DROP POLICY IF EXISTS "Anyone can view review photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload review photos" ON storage.objects;

CREATE POLICY "review-photos anon upload constrained"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'review-photos'
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp','gif'])
  AND octet_length(COALESCE(name,'')) < 200
);

-- 4. SECURITY DEFINER helpers: pin search_path + revoke public execute
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_review_email() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;

-- 5. Tighten always-true INSERT policies with minimal non-empty checks
DROP POLICY IF EXISTS "Anyone can insert funnel events" ON public.funnel_events;
CREATE POLICY "Anyone can insert funnel events"
ON public.funnel_events FOR INSERT TO anon, authenticated
WITH CHECK (event_name IS NOT NULL AND length(event_name) BETWEEN 1 AND 100);

DROP POLICY IF EXISTS "Anyone can create manual payment" ON public.manual_payments;
CREATE POLICY "Anyone can create manual payment"
ON public.manual_payments FOR INSERT TO anon, authenticated
WITH CHECK (
  buyer_email IS NOT NULL AND length(buyer_email) BETWEEN 3 AND 320
  AND buyer_name IS NOT NULL AND length(buyer_name) BETWEEN 1 AND 200
  AND amount_usd IS NOT NULL AND amount_usd >= 0
);

DROP POLICY IF EXISTS "anyone can insert client errors" ON public.client_error_logs;
CREATE POLICY "anyone can insert client errors"
ON public.client_error_logs FOR INSERT TO anon, authenticated
WITH CHECK (source IS NOT NULL AND length(source) BETWEEN 1 AND 100);
