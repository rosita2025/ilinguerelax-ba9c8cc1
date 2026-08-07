-- Permitir que cualquier usuario (anon/public) pueda leer los productos.
-- Esto soluciona el 404 al previsualizar borradores.
-- La seguridad de los archivos (Drive) se mantiene mediante tokens en Edge Functions.

DROP POLICY IF EXISTS "Public can view active products v2" ON public.digital_products;
DROP POLICY IF EXISTS "Anyone can read active products" ON public.digital_products;

CREATE POLICY "Anyone can read products"
ON public.digital_products
FOR SELECT
TO public
USING (true);
