
-- Restrict public SELECT on reviews and expose a safe view without customer_email
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;

CREATE POLICY "No direct public read of reviews"
ON public.reviews FOR SELECT
USING (false);

CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker=on) AS
SELECT id, product_type, customer_name, rating, review_text, photo_urls, status, created_at, updated_at
FROM public.reviews
WHERE status = 'approved';

GRANT SELECT ON public.reviews_public TO anon, authenticated;
