
-- 1. Añadir columnas de calificación y conteo de reseñas
ALTER TABLE public.digital_products 
ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 4.8;

ALTER TABLE public.digital_products 
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 120;

-- 2. Otorgar permisos sobre la tabla (requerido para Supabase Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;
GRANT SELECT ON public.digital_products TO anon;

-- 3. Asegurar que las políticas de RLS permitan la lectura pública
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'digital_products' 
        AND policyname = 'Anyone can read products'
    ) THEN
        CREATE POLICY "Anyone can read products" ON public.digital_products
        FOR SELECT USING (true);
    END IF;
END $$;
