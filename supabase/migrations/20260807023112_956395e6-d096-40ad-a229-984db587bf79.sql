-- Actualizar política para que administradores autenticados puedan ver todos los productos (incluyendo borradores)
-- y los usuarios anónimos sigan viendo solo los activos.

DROP POLICY IF EXISTS "Anyone can read active products" ON public.digital_products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.digital_products;
DROP POLICY IF EXISTS "Public can view active products" ON public.digital_products;

-- 1. Política para usuarios anónimos (Solo activos)
CREATE POLICY "Public can view active products v2"
ON public.digital_products
FOR SELECT
TO anon
USING (active = true);

-- 2. Política para administradores autenticados (Todos)
-- Nota: La política "Admins can manage products v5" ya permite ALL TO authenticated USING (true).
-- Pero nos aseguramos de que SELECT esté cubierto explícitamente si fuera necesario.

-- Verificar que el rol 'authenticated' tiene GRANT SELECT
GRANT SELECT ON public.digital_products TO authenticated;
