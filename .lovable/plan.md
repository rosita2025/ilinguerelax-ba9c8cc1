# Plan: Corrección de Sincronización de Abandonos y Compras

El usuario reporta que el correo `dogsballs111@yahoo.com` aparece como "Abandono al carrito" a pesar de haber realizado una compra exitosa (Orden `ILR-ST-0U1JY0K8`). Esto indica que el sistema de deduplicación no marcó correctamente el carrito como convertido o que los logs de marketing están mostrando información contradictoria.

## Objetivos
1. Asegurar que una compra exitosa marque inmediatamente el carrito como convertido en todas las tablas relevantes (`persistent_carts`, `abandoned_carts`).
2. Mejorar la lógica de filtrado en el **Marketing Hub** para que no se envíen (ni se listen como pendientes) abandonos si ya existe una compra exitosa para ese email.
3. Verificar que los webhooks de Stripe/Hotmart estén invocando correctamente `markAbandonedCartConverted`.

## Cambios propuestos

### Backend (Edge Functions)

#### 1. Robustez en `markAbandonedCartConverted`
- Reforzar `supabase/functions/_shared/thankYouEmail.ts` para que la limpieza de abandonos sea más agresiva y cubra posibles inconsistencias de mayúsculas/minúsculas.
- Asegurar que `converted: true` se aplique a todos los registros abiertos del email, no solo al último.

#### 2. Sincronización en `track-abandoned-checkout`
- Añadir una verificación inicial: si el email ya tiene una compra exitosa reciente, no crear un nuevo registro de abandono ni sincronizar a Brevo.

#### 3. Deduplicación en `send-cart-reminders`
- Mejorar el filtro `getPurchasedSkus` para que sea más exhaustivo, incluyendo búsquedas en `funnel_events` y `shopify_sales` para detectar compras que podrían haberse escapado de las tablas de envío digital.

### Frontend (Admin)

#### 1. Mejorar `AdminMarketingDrips.tsx`
- Añadir un indicador visual claro si un email que aparece en "Abandonos" ya tiene una compra asociada en el sistema.
- Mejorar la visualización del estado para evitar confusión entre logs históricos y recordatorios pendientes.

## Plan de Verificación
1. **Prueba de flujo**: Simular un abandono para un email de prueba y luego simular una compra para el mismo email. Verificar que el estado en `persistent_carts` pase a `converted: true`.
2. **Chequeo de Logs**: Revisar `brevo_sync_logs` para confirmar que tras la compra no se generen más eventos de tipo `tienda_abandoned`.
3. **Validación del Admin**: Entrar en `/admin/marketing-drips` y confirmar que el email del usuario ya no se muestra como un abandono activo (o que se muestra con su estado de compra actualizado).
