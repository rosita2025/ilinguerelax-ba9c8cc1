# Plan - Sincronización de Órdenes y Recuperación de Carritos

El usuario reporta que no se están sincronizando las órdenes (Stripe, Hotmart, dLocal) ni los abandonos de carrito en el panel de administración. Específicamente menciona la transacción de Hotmart `HP1413567978` del día de hoy que no aparece.

## Problemas Identificados
1.  **Hotmart Sync**: La función `list-purchases-status` utiliza filtros `OR` en `funnel_events` que pueden ser demasiado restrictivos o no coincidir con los metadatos reales guardados por el webhook. La transacción `HP1413567978` no fue encontrada en las consultas recientes.
2.  **Sincronización de Abandonos**: Los abandonos se guardan en `persistent_carts` y `email_contacts`, pero `list-purchases-status` solo consulta `shopify_sales`, `funnel_events` y `paypal_webhook_events`. Los abandonos de carritos internos no se están agregando a la lista unificada.
3.  **dLocal Sync**: No hay una sección explícita para dLocal en `list-purchases-status`, aunque dLocal inserta eventos en `funnel_events`.
4.  **Meta CAPI / Hotmart**: El mapeo de productos de Hotmart podría estar fallando si el nombre del producto no coincide exactamente con los patrones hardcoded.

## Propuesta de Cambios

### Backend (Funciones de Supabase)

1.  **`list-purchases-status`**:
    *   Optimizar la consulta de Hotmart en `funnel_events` para buscar en `session_id` (donde se guarda el código de transacción de Hotmart) además del `referrer`.
    *   Agregar una nueva sección para consultar la tabla `persistent_carts` e incluir los carritos abandonados (`converted = false`) en la lista unificada.
    *   Asegurar que los eventos de `dlocalgo` de `funnel_events` se mapeen correctamente.
    *   Mejorar la detección de correos electrónicos en los payloads JSON de `funnel_events.referrer`.

2.  **`hotmart-purchase-pixel`**:
    *   Asegurar que el `provider` se guarde siempre como 'hotmart' en `funnel_events`.
    *   Guardar el código de transacción en `session_id` para facilitar la búsqueda.

3.  **`dlocal-webhook`**:
    *   Asegurar que las inserciones en `funnel_events` incluyan el `provider: 'dlocalgo'` de forma consistente.

### Frontend

1.  **`AdminPurchasesStatus.tsx`**:
    *   Actualizar los filtros para incluir "Abandonos de Carrito" como una opción de "Pasarela" o estado.
    *   Mejorar la visualización del `failed_step` para carritos persistentes.

## Detalles Técnicos
*   Se modificará `supabase/functions/list-purchases-status/index.ts` para unificar los orígenes de datos.
*   Se revisará la política de RLS de `funnel_events` y `persistent_carts` para asegurar que la Service Role Key tenga acceso total (ya debería tenerlo, pero se verificará).
*   Se añadirá lógica de "Union" manual en la función edge para mezclar los carritos abandonados con las transacciones de pasarelas.

## Paso a Paso
1. Modificar `list-purchases-status` para incluir carritos persistentes y mejorar filtros de Hotmart/dLocal.
2. Actualizar el componente `AdminPurchasesStatus` para manejar estos nuevos tipos de filas.
3. Verificar la sincronización con una consulta de prueba.
