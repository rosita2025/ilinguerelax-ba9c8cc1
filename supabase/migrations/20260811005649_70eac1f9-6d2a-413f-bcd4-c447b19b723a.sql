-- Eliminar políticas antiguas si existen para evitar conflictos
DROP POLICY IF EXISTS "blog_images_service_all" ON storage.objects;
DROP POLICY IF EXISTS "blog_images_service_all_v2" ON storage.objects;

-- Crear política robusta para service_role (usado por Edge Functions)
CREATE POLICY "blog_images_service_all" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');

-- Otorgar permisos directos en el esquema storage
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;