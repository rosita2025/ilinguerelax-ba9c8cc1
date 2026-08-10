# Plan: Verificación de Checkout y Seguridad de Pagos

El usuario solicita una revisión exhaustiva del checkout para asegurar que no haya errores y que las compras se procesen correctamente sin pérdida de dinero.

## Análisis Técnico
Tras revisar las Edge Functions y el catálogo compartido:
1.  **Seguridad de Precios**: El sistema utiliza `resolveServerPricing` en el backend, lo que significa que los precios se validan contra la base de datos de "Lovable Cloud" ignorando cualquier intento de manipulación desde el navegador.
2.  **Unificación de Moneda (USD)**:
    -   **Stripe**: `adaptive_pricing` está desactivado para forzar USD, evitando errores en países con restricciones (como Argentina u Honduras).
    -   **dLocal Go**: Se fuerza `startCurrency: "USD"`. Esto asegura que el comercio reciba el valor exacto y dLocal maneje la conversión para el cliente.
3.  **Resiliencia**:
    -   Se implementaron reintentos (3 intentos con retraso incremental) en la creación de pagos de dLocal para manejar errores 502/503.
    -   Existe un sistema de "fallback" (contingencia) que intenta métodos simplificados si el principal falla.
4.  **Auditoría**: Cada intento de creación de orden se registra en `order_events` para visibilidad del administrador.

## Acciones de Verificación
- Validar que los cálculos de redondeo en `catalogPricing.ts` (centavos) coincidan exactamente con lo que esperan Stripe (unit_amount) y dLocal (amount).
- Asegurar que no haya fugas de centavos en la aplicación de cupones.

## Respuesta al Usuario
Confirmaré que el sistema está blindado contra manipulación de precios desde el cliente y que la estrategia de USD garantiza que no se pierdan ventas por problemas de divisas locales.
