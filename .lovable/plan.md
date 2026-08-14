# Plan: Reparación y Automatización de Secuencias de Marketing (Marketing Drips)

El usuario reporta que las secuencias de marketing (post-compra, newsletter, abandonos y reseñas) no se están enviando automáticamente o no están actualizadas. El análisis revela que, aunque se han implementado mejoras en las funciones, la automatización periódica (cron) podría estar fallando o los filtros de exclusión son demasiado estrictos.

## 1. Diagnóstico de Automatización (Edge Functions)
- **`send-cart-reminders`**: Verifica abandonos en `persistent_carts`.
- **`send-marketing-drip`**: Procesa secuencias post-compra basadas en `email_contacts`.
- **`send-newsletter-drip`**: Procesa la secuencia de bienvenida.
- **`process-review-invitations`**: Maneja las invitaciones a dejar reseñas.

## 2. Acciones Técnicas

### Backend (Edge Functions)
- **Unificación de Origen de Datos**: Asegurar que `send-marketing-drip` y `send-newsletter-drip` consulten tanto `email_contacts` como `persistent_carts` para no perder clientes nuevos.
- **Ajuste de Filtros de Frecuencia**: Revisar el throttle de 24h y 72h. Si un cliente abandona y luego compra, el sistema debe ser capaz de pivotar rápidamente de "recordatorio de abandono" a "agradecimiento/drip post-compra".
- **Logs de Ejecución**: Aumentar el logging en las funciones para que el administrador pueda ver *por qué* se saltó un correo específico (ej. "Skipped: active abandoned cart hold").

### Admin UI
- **`AdminMarketingDrips.tsx`**: 
    - Añadir una sección de "Estado del Sistema" que muestre cuándo fue la última ejecución exitosa de cada cron.
    - Asegurar que los botones "Procesar Ahora" disparen todas las colas relevantes.
- **`AdminBrevoAbandoned.tsx`**: 
    - Corregir la visualización de fechas para asegurar que se muestren los abandonos de "ayer y hoy" correctamente, incluso si no se han enviado los correos aún.

### Base de Datos (SQL)
- Verificar que `pg_cron` esté programado correctamente para ejecutar estas funciones cada 15-60 minutos.

## 3. Verificación
- Simular un abandono y forzar el procesamiento manual.
- Simular una compra y verificar que el drip post-compra se encole correctamente.
- Revisar `brevo_sync_logs` para confirmar que los payloads hacia la plataforma de marketing son correctos.
