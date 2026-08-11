# Plan de Automatización de Reseñas Post-Compra

El usuario solicita implementar un sistema de invitación a reseñas para compradores reales de productos digitales. Si el cliente no responde a la primera invitación, se deben enviar recordatorios automáticos (día 15, día 20, día 27) hasta completar 5 reseñas/invitaciones. Al completar la reseña, se otorga un cupón del 15%.

## Tareas

### 1. Base de Datos
- Modificar la tabla `review_invitations` para soportar cupones.
- Asegurar que la tabla `reviews` tenga el campo `coupon_sent`.

### 2. Plantillas de Email (Marketing Drip)
- Añadir nuevas plantillas en `supabase/functions/_shared/marketingTemplates.ts`:
  - `review-invite-1`: Primera invitación (1 día después).
  - `review-invite-reminder`: Recordatorios con incentivo del 15% (días 15, 20, 27).
  - `review-coupon-delivery`: Entrega del código de cupón tras verificar la reseña.

### 3. Lógica de Negocio (Edge Functions)
- Actualizar `supabase/functions/process-review-invitations/index.ts`:
  - Ajustar los intervalos a: 1, 15, 20, 27 días.
  - Limitar a un máximo de 5 correos.
  - Integrar con el sistema de cupones.
- Crear/Actualizar un trigger o función que detecte cuando una reseña es aprobada para enviar el cupón automáticamente.

### 4. Panel de Administración (Hub de Marketing)
- Crear `src/pages/AdminReviewInvitations.tsx` para monitorizar el estado de las invitaciones.
- Integrar esta nueva vista como una pestaña adicional en `src/pages/AdminMarketingHub.tsx`.

## Detalles Técnicos
- **Intervalos:** 1 día (inicial), 15 días, 20 días, 27 días.
- **Deduplicación:** Se mantiene la lógica actual que evita enviar si el usuario ya ha reseñado o si se alcanzó el límite global de 24h.
- **Cupones:** Generación de un código único o uso de uno genérico (ej. `GRACIAS15`) enviado por email tras la reseña.

## Revisión del Usuario
- ¿El cupón del 15% debe ser un código único o puede ser un código estándar para todos?
- ¿Desea que las imágenes de los productos en los correos tengan marca de agua?
