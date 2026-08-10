# Plan de Ajuste Agenda de Blog (Coreano)

El usuario solicita ajustar la prueba de la agenda de blog a **1 post al día** con una temática específica: **"palabras es como aprender a hablar coreano"**.

## Cambios realizados
1.  **Actualización de Tarea en Cola**: Se ha modificado el registro `03fd86d9-164e-4c69-9b65-9fc17f88b81e` en `public.blog_post_queue` para reflejar el nuevo tema ("Cómo aprender a hablar coreano: palabras esenciales") y reiniciar su estado a `pending` para ejecución inmediata con los nuevos modelos de Apimart.
2.  **Memoria del Proyecto**: Se ha creado `mem://features/blog-agenda-config.md` para asegurar que la frecuencia de 1 post/día y la temática de idiomas (especialmente coreano) se mantengan como preferencia del usuario.
3.  **Verificación de Modelos**: Confirmado que `blogGenerator.ts` ya utiliza los modelos `nano-banana-2-ext` y `gpt-image-2-ext` configurados en el turno anterior.

## Próximos pasos (automáticos)
- La función `process-blog-queue` (invocada por cron) recogerá la tarea actualizada y generará el contenido usando Apimart.
