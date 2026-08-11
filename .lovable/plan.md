# Plan de Verificación: Stripe Checkout y ClientSecret

El objetivo es confirmar que la integración de Stripe (especialmente en modo `embedded_page`) funciona correctamente, evitando errores como `StripeInvalidRequestError` y asegurando que el `clientSecret` se recupere sin fallos.

## Tareas a realizar

### 1. Pruebas de Funcionamiento (Frontend & Edge Function)
- **Simulación de compra**: Probar el flujo completo en el componente `PaymentMethodsGroup.tsx` seleccionando "Tarjeta" (Stripe).
- **Verificación de `clientSecret`**: Confirmar que la función `create-checkout-prueba` devuelve el token necesario para montar el formulario de Stripe.
- **Validación de `ui_mode`**: Asegurar que `embedded_page` está configurado correctamente en el servidor y manejado en el cliente.

### 2. Diagnóstico y Monitoreo (Admin)
- **Revisión de `admin_payment_errors`**: Verificar que no se estén registrando nuevos errores de Stripe con códigos `unknown` o de restricción de moneda.
- **Auditoría de Logs**: Inspeccionar los logs de la Edge Function para detectar cualquier desajuste en los parámetros enviados (`currency`, `payment_method_types`, etc.).

### 3. Ajustes de Resiliencia (si fuera necesario)
- Si persiste el error de "moneda no soportada" en ciertos países, forzar el fallback a USD antes de que Stripe devuelva el error.
- Refinar el mapeo de errores en `src/lib/stripeErrorMap.ts` para que el usuario reciba mensajes claros en español.

## Detalles Técnicos
- **Edge Function**: `supabase/functions/create-checkout-prueba/index.ts`
- **Componente Principal**: `src/components/checkout/PaymentMethodsGroup.tsx`
- **Modo Stripe**: `ui_mode: "embedded_page"` (Checkout embebido).
- **Moneda**: Forzado a `usd` para evitar bloqueos regionales en pasarelas globales.

## Criterios de Aceptación
- La llamada a `create-checkout-prueba` devuelve un HTTP 200 con un `clientSecret` válido.
- El iframe de Stripe se monta correctamente sin parpadeos ni errores de "No pudimos abrir el pago".
- Los intentos de pago fallidos se registran con el detalle técnico exacto en el panel de administración.
