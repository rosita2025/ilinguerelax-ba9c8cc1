# Plan: Optimización del Seguimiento de Compras y Abandonos

El usuario reporta que no puede ver las compras recientes (Stripe, Hotmart, etc.) ni los abandonos en el panel de administración, a pesar de que hay actividad real en la base de datos (se detectaron eventos de `Purchase`, `InitiateCheckout` y `BeginCheckout` en las últimas 24 horas).

## Problemas Identificados
1. **Desfase en la Sincronización**: La función `list-purchases-status` no está capturando correctamente los eventos de Shopify (`shopify_sales`) ni mapeando exhaustivamente todos los estados de los eventos del funnel.
2. **Visibilidad de Abandonos**: Aunque los eventos `InitiateCheckout` y `BeginCheckout` ocurren, no se están mostrando de forma clara en el dashboard principal de compras como "Abandonos", o el filtrado por fecha/límite está dejando fuera registros importantes.
3. **Mapeo de Shopify**: Las ventas físicas registradas en `shopify_sales` no están integradas en el flujo unificado de `list-purchases-status`.

## Tareas a Realizar

### Backend (Edge Functions)
1.  **Actualizar `list-purchases-status`**:
    *   Integrar la tabla `shopify_sales` para que las compras de libros físicos aparezcan en el listado.
    *   Mejorar el escaneo de `funnel_events` para incluir explícitamente `InitiateCheckout` y `BeginCheckout` como "Abandono de Carrito" cuando no hay un `Purchase` asociado.
    *   Refinar el mapeo de `Stripe` y `Hotmart` usando los datos encontrados en `referrer` y `event_data` (especialmente para `cs_live_...` y `pi_...`).
2.  **Optimizar `list-marketing-drips`**:
    *   Asegurar que los logs de `brevo_sync_logs` y `email_contacts` se filtren correctamente por la fecha de hoy para alimentar el "Newsletter Hoy" y "Abandonos Hoy".

### Frontend (Admin Panels)
1.  **Ajustes en `AdminPurchasesStatus.tsx`**:
    *   Asegurar que el estado "Abandonado" sea una opción de filtro visible.
    *   Mostrar el `customer_name` y `country` de Shopify cuando el proveedor sea Shopify/Physical.
2.  **Validación de Datos**:
    *   Verificar que el `adminKey` se pase correctamente en todas las llamadas para evitar fallos de "Unauthorized" que podrían estar ocultando los datos.

## Detalles Técnicos
*   **Tablas involucradas**: `funnel_events`, `shopify_sales`, `checkout_rate_hits`.
*   **Identificadores de transacción**: Mapeo de `session_id` (Stripe) y `shopify_order_id` (Shopify).
*   **Detección de País**: Priorizar `country` de la tabla `shopify_sales` o `funnel_events`.

El objetivo es que el administrador vea en tiempo real tanto el éxito de Michael Maynes (Stripe approved ayer) como los múltiples `InitiateCheckout` de hoy que aún no han convertido.
