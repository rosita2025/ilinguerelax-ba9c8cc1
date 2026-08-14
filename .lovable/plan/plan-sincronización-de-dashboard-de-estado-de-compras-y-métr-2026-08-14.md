# Plan: Sincronización de Dashboard de Estado de Compras y Métricas de Ventas

El usuario reporta que el dashboard en `/admin/purchases-status` no está sincronizando correctamente las compras recientes de Stripe, Hotmart y otras pasarelas, mostrando contadores en cero a pesar de haber ventas hoy. El análisis muestra que el panel depende de `funnel_events` y `paypal_webhook_events`, pero existen inconsistencias en cómo se extraen y mapean los datos, especialmente para Stripe y Hotmart.

## 1. Análisis de Causas
- **Stripe**: La función `list-purchases-status` busca eventos en `funnel_events` que contengan `provider: stripe` en `event_data`. Sin embargo, `stripe-webhook` guarda esta información dentro de un string JSON en `referrer` en lugar de una columna nativa o `event_data` estructurado en todos los casos.
- **Hotmart**: La búsqueda en `funnel_events` usa filtros complejos sobre `event_name` y `referrer`. Si el webhook `hotmart-purchase-pixel` no inserta datos exactamente como se espera (ej. `event_data` vs `referrer`), el dashboard no los ve.
- **Filtros de Dashboard**: El dashboard agrupa por `mapped_status`. Si un evento no tiene un status mapeado conocido (approved, refused, etc.), cae en "unknown" y no se cuenta en los KPIs principales.

## 2. Acciones Técnicas

### Backend (Edge Function: `list-purchases-status`)
- **Mejorar Extracción de Stripe**: Modificar la consulta para buscar tanto en `event_data` como en el campo `referrer` (usando `ilike` si es necesario) para capturar todos los eventos de Stripe.
- **Normalización de Hotmart**: Asegurar que los eventos con `referrer = 'hotmart-webhook'` o `event_data->>'provider' = 'hotmart'` se procesen correctamente, extrayendo el email y monto de todas las variantes del payload de Hotmart.
- **Soporte para Abandonos y Rechazos**: 
    - Incluir eventos de `InitiateCheckout` (Hotmart) y sesiones de Stripe incompletas como "Pendiente" o "Abandono".
    - Mapear explícitamente estados de Stripe (`requires_payment_method`, `canceled`) y Hotmart (`expired`, `canceled`) a los estados del dashboard.
- **KPIs Extendidos**: Asegurar que el objeto `summary` devuelto incluya contadores para todos los estados solicitados (rechazados, abandonos, bloqueados, chargebacks).

### Base de Datos
- **Consultas Robustas**: Optimizar las queries SQL para que el `or` sea más eficiente y cubra las nuevas variantes de nombres de eventos (ej. `Purchase` vs `purchase`).

### Frontend (AdminPurchasesStatus.tsx)
- **Visualización de Abandonos**: Añadir un KPI para "Abandonos" (basado en `InitiateCheckout` o sesiones Stripe pendientes) si es técnicamente viable desde los logs actuales.
- **Leyendas Claras**: Mejorar las etiquetas de los KPIs para que coincidan con la terminología del usuario.

## 3. Verificación
- Comparar los logs de `funnel_events` recientes con lo que muestra el dashboard.
- Verificar que las ventas de Stripe y Hotmart de "hoy" aparezcan en la lista.
