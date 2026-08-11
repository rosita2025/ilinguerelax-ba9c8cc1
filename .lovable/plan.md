# Plan de optimización y corrección de imágenes IA en el Blog

El usuario reporta que no está seguro de si el sistema de IA está funcionando correctamente ("estas segura necesito un aimagen") y los datos muestran que los últimos posts publicados usan una imagen por defecto (`og-image.png`) y el bucket `blog-images` está vacío, lo que indica que la generación o subida de imágenes de Apimart está fallando silenciosamente o no se está activando correctamente.

## Objetivos
1.  **Corregir la generación de imágenes**: Asegurar que `gpt-image-2-ext` en Apimart devuelva una URL válida y se guarde en Supabase Storage.
2.  **Validar la integración**: Realizar una prueba manual para confirmar que la imagen aparece en el post generado.
3.  **Monitoreo**: Mejorar los logs en `_shared/blogGenerator.ts` para detectar por qué las imágenes fallan.

## Acciones técnicas

### 1. Refuerzo de `generateImage` en `supabase/functions/_shared/blogGenerator.ts`
- Revisar el mapeo de la respuesta de Apimart. El log anterior indicaba "Respuesta de imagen no es JSON directo", lo que sugiere que Apimart podría estar enviando texto plano o una estructura distinta.
- Ajustar el prompt de la imagen para que sea más específico y evitar que el modelo de imagen intente devolver texto o metadatos innecesarios.
- Asegurar que el bucket `blog-images` tenga las políticas de RLS correctas para permitir `INSERT` desde el `service_role` (las funciones usan esta clave).

### 2. Verificación de permisos de Storage
- Comprobar y recrear si es necesario las políticas de RLS para el bucket `blog-images`.

### 3. Prueba de generación
- Ejecutar un post de prueba desde el admin para verificar el flujo completo.

## Validación
- Se confirmará el éxito si el nuevo post en `generated_blog_posts` tiene una URL que apunta al bucket `blog-images` y no a `og-image.png`.
- Se verificará visualmente en el preview del admin.
