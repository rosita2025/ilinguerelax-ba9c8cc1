# Plan de Depuración Multi-Región USD y Paridad de Pasarelas

El objetivo es asegurar que los precios USD regionales definidos en el administrador se reflejen sin errores en todas las pasarelas (Stripe, PayPal, dLocal Go) y que el Meta Pixel reciba siempre el valor USD exacto con 2 decimales, independientemente de la moneda local del comprador.

## Cambios propuestos

### 1. Backend: Paridad de Precios USD Regionales
- **supabase/functions/_shared/catalogPricing.ts**: Modificar `resolveServerPricing` para que la lógica de resolución de precios respete estrictamente los overrides de `local_usd_prices`. Actualmente, el servidor usa `pickTierPrice` (Latam/Global/Tienda) pero debemos asegurar que si hay un USD específico para la moneda solicitada, ese sea el precio base para el cálculo de pasarelas.
- **supabase/functions/dlocal-create-payment/index.ts**: Asegurar que al crear el pago en USD (fallback) o moneda local, el cálculo del `amount` se base en el USD regional resuelto.
- **supabase/functions/paypal-create-order/index.ts**: Sincronizar la lógica de moneda local para que, si PayPal soporta la moneda del usuario, use el USD regional específico para esa conversión.

### 2. Meta Pixel: Refuerzo de Depuración y Precisión
- **src/hooks/useMetaPixel.ts**:
    - Ajustar `trackHotmartEvent` y `useHotmartPixel` para que el `value` se normalice a USD usando el USD regional del producto en lugar de una conversión genérica por IP cuando sea posible.
    - Asegurar que el valor enviado tenga siempre 2 decimales usando `.toFixed(2)` antes de convertir a número.
- **src/components/PixelDebugger.tsx**: 
    - Añadir una columna o indicador que muestre el "Precio USD Base" vs "Precio Cobrado" para detectar discrepancias regionales.
    - Resaltar en rojo si el valor recibido no tiene exactamente 2 decimales.

### 3. UI: Consistencia de Precios
- **src/components/checkout/PaymentMethodsGroup.tsx**: Asegurar que el `usdSuffix` (`≈ USD $XX.XX`) refleje el USD regional exacto que se enviará a la pasarela, evitando confusiones donde el cliente ve un USD y se le cobra otro.

## Detalles técnicos
- Se utilizará la columna `local_usd_prices` (jsonb) de la tabla `digital_products` como fuente de verdad para el USD regional.
- La función `localTotalFromPricing` en `catalogPricing.ts` se actualizará para usar `activeUsd` (regional) en todos los flujos de pasarelas.

## Verificación
- Abrir el Debugger de Pixel con `?pixel_debug=1`.
- Simular compras desde diferentes países (usando el simulador de IP o parámetros) y verificar que el `value` en el debugger coincida con el USD regional configurado en `/admin/productos/:sku`.
- Validar que Stripe y PayPal reciban montos que sumen el USD regional esperado.
