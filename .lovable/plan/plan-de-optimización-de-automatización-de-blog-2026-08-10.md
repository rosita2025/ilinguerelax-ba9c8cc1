# Plan de Optimización de Automatización de Blog

El usuario solicita eliminar la necesidad de aprobación manual ("vista previa") para los artículos del blog programados. Actualmente, el sistema genera borradores que deben ser aprobados uno por uno. El objetivo es que la generación y publicación sean 100% automáticas según la agenda programada.

## Cambios Propuestos

### 1. Modificar `process-blog-queue` Edge Function
- Cambiar el parámetro `publish: false` a `publish: true` en la llamada a `generateAndStorePost`.
- Esto hará que cada artículo generado por la cola se publique inmediatamente sin intervención humana.

### 2. Actualizar `manage-blog-queue` Edge Function
- Actualizar la acción `seed` para reflejar que el flujo ahora es automático.
- Asegurar que `generate-one` (usado para adelantar artículos) también publique directamente si se desea coherencia total, aunque este suele usarse para revisión. Mantendré la opción de revisión en disparos manuales individuales pero automatizaré el lote programado.

### 3. Actualizar la UI en `BlogScheduleCard.tsx`
- Cambiar los mensajes informativos para indicar que los artículos se publican automáticamente.
- Eliminar la mención de "espera aprobado" o "vista previa necesaria" en el flujo programado.

## Verificación
- Simular una ejecución de la cola (`run-now`) y verificar que el `status` del post generado sea `published: true`.
- Comprobar que los pings de SEO (Sitemap, Google Indexing, Pinterest) se disparen correctamente al publicar automáticamente.
