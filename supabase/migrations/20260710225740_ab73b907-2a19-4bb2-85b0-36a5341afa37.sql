
CREATE TABLE public.digital_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  learner_language TEXT NOT NULL DEFAULT 'es',
  target_language TEXT NOT NULL DEFAULT 'en',
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_pen NUMERIC(10,2),
  drive_url TEXT,
  access_key TEXT,
  cover_image_url TEXT,
  is_upsell BOOLEAN NOT NULL DEFAULT false,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  mp_preference_template JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.digital_products TO anon;
GRANT SELECT ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products"
  ON public.digital_products FOR SELECT
  USING (active = true);

CREATE POLICY "Service role manages products"
  ON public.digital_products FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_digital_products_active ON public.digital_products(active, sort_order);
CREATE INDEX idx_digital_products_langs ON public.digital_products(learner_language, target_language);

CREATE TRIGGER update_digital_products_updated_at
  BEFORE UPDATE ON public.digital_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Upsells N:N
CREATE TABLE public.product_upsells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_sku TEXT NOT NULL REFERENCES public.digital_products(sku) ON DELETE CASCADE,
  upsell_sku TEXT NOT NULL REFERENCES public.digital_products(sku) ON DELETE CASCADE,
  discount_pct INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_sku, upsell_sku),
  CHECK (product_sku <> upsell_sku)
);

GRANT SELECT ON public.product_upsells TO anon;
GRANT SELECT ON public.product_upsells TO authenticated;
GRANT ALL ON public.product_upsells TO service_role;

ALTER TABLE public.product_upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view upsells"
  ON public.product_upsells FOR SELECT
  USING (true);

CREATE POLICY "Service role manages upsells"
  ON public.product_upsells FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_product_upsells_product ON public.product_upsells(product_sku, sort_order);

-- Seed productos actuales (drive_url vacío por ahora — el usuario lo llenará desde /admin/productos)
INSERT INTO public.digital_products
  (sku, name, description, learner_language, target_language, price_usd, price_pen, drive_url, access_key, cover_image_url, is_upsell, active, sort_order)
VALUES
  ('patrones-especiales',
   'Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés',
   'Método visual para dominar la pronunciación del inglés desde cero.',
   'es', 'en', 8.00, 29.90,
   'https://ilinguerelax.com/descarga/patrones-ingles', '123A',
   NULL, false, true, 10),
  ('coreano-100-mapas',
   '100 Mapas Mentales para Aprender Coreano (Hangul → C1)',
   'Guía completa con 100 mapas mentales para dominar el coreano de forma visual.',
   'es', 'ko', 27.00, 99.00,
   'https://ilinguerelax.com/descarga/coreano-100-mapas', NULL,
   NULL, false, true, 20),
  ('1000-verbos-ingles',
   '1.000 Verbos Esenciales en Inglés (Presente, Pasado, Futuro)',
   'Los 1000 verbos más usados en inglés con pronunciación y ejemplos.',
   'es', 'en', 9.00, 33.00,
   NULL, NULL, NULL, true, true, 30),
  ('500-preguntas-ingles',
   '500 Preguntas en Inglés con Pronunciación',
   'Domina las 500 preguntas más frecuentes del inglés conversacional.',
   'es', 'en', 9.00, 33.00,
   NULL, NULL, NULL, true, true, 40),
  ('5000-spanish-words',
   '5,000 Spanish Words with English Pronunciation',
   'The 5000 most common Spanish words with pronunciation guides for English speakers.',
   'en', 'es', 22.00, NULL,
   NULL, NULL, NULL, false, true, 50);

-- Seed upsells iniciales (cada producto sugiere los otros de su misma categoría de idiomas)
INSERT INTO public.product_upsells (product_sku, upsell_sku, discount_pct, sort_order) VALUES
  ('patrones-especiales', '1000-verbos-ingles', 30, 1),
  ('patrones-especiales', '500-preguntas-ingles', 30, 2),
  ('1000-verbos-ingles', 'patrones-especiales', 30, 1),
  ('1000-verbos-ingles', '500-preguntas-ingles', 30, 2),
  ('500-preguntas-ingles', 'patrones-especiales', 30, 1),
  ('500-preguntas-ingles', '1000-verbos-ingles', 30, 2),
  ('coreano-100-mapas', 'patrones-especiales', 20, 1);
