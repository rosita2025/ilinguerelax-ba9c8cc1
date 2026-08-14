# Plan de Acción: Corrección de Mensajes y Secuencias de Marketing (Drips)

Se ha detectado que las secuencias de marketing (abandonos, newsletter y post-compra) no están enviando mensajes correctamente. Este plan corregirá las fuentes de datos, los procesos de envío y la visibilidad en el panel de administración.

## Exploración y Diagnóstico
- Los carritos abandonados ahora se gestionan a través de `persistent_carts` en lugar de la antigua tabla `abandoned_carts`, pero algunos componentes de administración y funciones siguen buscando en la fuente anterior.
- La función `send-marketing-drip` busca compradores en `email_contacts` con `source='store_purchase'`, pero es posible que las compras nuevas no estén registrando esta fuente correctamente.
- El panel de administración en `/admin/marketing-drips` y `/admin/brevo-abandoned` necesita actualizarse para reflejar los estados reales y las nuevas fuentes de datos.

## Pasos a Realizar

### 1. Backend: Consolidación de fuentes de datos
- **Corrección de `email_contacts`**: Asegurar que todos los webhooks de pago (Stripe, PayPal, Mercado Pago, dLocal) y la verificación manual inserten o actualicen el contacto con `source='store_purchase'` al completar una venta.
- **Sincronización de Abandonos**: Verificar que `track-abandoned-checkout` esté alimentando correctamente tanto `persistent_carts` como `email_contacts` con `source='abandoned_cart'`.

### 2. Edge Functions: Reparación de procesos de envío
- **`send-cart-reminders`**: Ajustar para que use consistentemente `persistent_carts` y asegurar que el cron esté activo.
- **`send-marketing-drip`**: Validar la lógica de inferencia de categorías para que los pasos de 7, 15 y 25 días se activen correctamente tras la compra.
- **`send-newsletter-drip`**: Asegurar que el filtro de "abandoned cart hold" (72h) no bloquee indefinidamente los envíos si el carrito ya no está activo.

### 3. Frontend: Actualización de Paneles Admin
- **`AdminMarketingDrips.tsx`**: Añadir indicadores de error y logs de ejecución más detallados para diagnosticar por qué las secuencias están vacías.
- **`AdminBrevoAbandoned.tsx`**: Actualizar para que muestre datos de `persistent_carts` en lugar de la tabla obsoleta, permitiendo ver qué correos están "en cola" para recordatorios.

## Detalles Técnicos
- Se revisará la tabla `brevo_sync_logs` para identificar si los fallos son de red, de API (Brevo) o de lógica interna.
- Se implementará un botón de "Forzar Procesamiento" en el admin para activar manualmente las colas y validar los cambios en tiempo real.

## Verificación
- Simular un abandono de carrito y verificar su aparición en el log de administración.
- Realizar una compra de prueba y validar la inscripción en la secuencia de marketing post-compra.
- Comprobar los logs de las Edge Functions para confirmar ejecuciones exitosas.
