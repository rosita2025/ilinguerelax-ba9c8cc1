-- 1. Permisos para tablas de productos
GRANT ALL ON public.digital_products TO authenticated;
GRANT ALL ON public.product_upsells TO authenticated;
GRANT ALL ON public.digital_product_changes TO authenticated;

GRANT ALL ON public.digital_products TO service_role;
GRANT ALL ON public.product_upsells TO service_role;
GRANT ALL ON public.digital_product_changes TO service_role;

-- 2. Asegurar RLS en las tablas
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_upsells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_changes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para administradores (authenticated)
DROP POLICY IF EXISTS "Admins can do everything on products" ON public.digital_products;
CREATE POLICY "Admins can do everything on products"
ON public.digital_products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can do everything on upsells" ON public.product_upsells;
CREATE POLICY "Admins can do everything on upsells"
ON public.product_upsells
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can do everything on changes" ON public.digital_product_changes;
CREATE POLICY "Admins can do everything on changes"
ON public.digital_product_changes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Permisos para lectura pública (necesario para la tienda)
DROP POLICY IF EXISTS "Anyone can read active products" ON public.digital_products;
CREATE POLICY "Anyone can read active products"
ON public.digital_products
FOR SELECT
TO anon
USING (active = true);

GRANT SELECT ON public.digital_products TO anon;
GRANT SELECT ON public.product_upsells TO anon;

-- 5. Almacenamiento (Políticas del bucket product-images)
-- Nota: El bucket se crea mediante la herramienta dedicada, aquí solo definimos las políticas.

-- Política para que cualquiera pueda ver las imágenes
DROP POLICY IF EXISTS "Public access to product images" ON storage.objects;
CREATE POLICY "Public access to product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Política para que admins puedan subir imágenes
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
