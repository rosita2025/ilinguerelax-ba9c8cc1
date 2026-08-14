# Plan: Unificación de Monedas en Checkout (Local + USD)

El usuario solicita mostrar la moneda local en el checkout (Stripe, dLocal, PayPal) y al mismo tiempo mantener una referencia o integración clara en USD, mejorando la visualización y consistencia entre estas plataformas. Actualmente, el sistema ya maneja conversiones locales, pero parece que el usuario desea una visualización dual o más robusta cuando se usan pasarelas globales.

## Cambios propuestos

### Frontend: UI de Checkout y Resumen
- **OrderSummary.tsx**: Modificar la visualización del total para mostrar SIEMPRE el equivalente en USD cuando se está mostrando una moneda local, proporcionando claridad sobre el cobro real en pasarelas que procesan USD.
- **PaymentMethodsGroup.tsx**: Ajustar las etiquetas de los botones de pago para que reflejen la moneda que realmente se cobrará (por ejemplo, "Pagar $13.00 USD" vs "Pagar MXN $250.00").
- **checkoutStore.ts**: Asegurar que el estado del carrito mantenga la referencia de ambos montos (USD base y Local calculado) para evitar saltos visuales durante la selección de métodos.

### Backend: Consistencia en Pasarelas
- **catalogPricing.ts**: Reforzar la lógica de `localTotalFromPricing` para asegurar que las tasas de cambio y los overrides manuales coincidan exactamente entre lo que el cliente ve y lo que la función de borde procesa.
- **paypal-create-order**: Asegurar que si el cliente está en un país con moneda soportada por PayPal (BRL, MXN), se intente cobrar en esa moneda, pero manteniendo el fallback a USD con una notificación clara en la UI si la moneda local falla.

## Detalles técnicos
- Implementar un componente `DualCurrencyDisplay` en `OrderSummary` que muestre: `Monto Local (Aprox. $XX USD)`.
- Sincronizar la constante `FX_USD_TO_LOCAL` en el backend con `exchangeRates` en el frontend para evitar discrepancias de céntimos.
- Añadir un toggle visual en el admin (o persistir preferencia) para "Forzar USD en Checkout Global" si el usuario prefiere evitar la volatilidad de la moneda local en Stripe/PayPal.

## Pasos de verificación
1. Simular compras desde México y Argentina usando la preview.
2. Verificar que en el resumen del pedido aparezcan ambos valores (Local + USD).
3. Confirmar que al seleccionar PayPal o Stripe, el botón de acción indique claramente la moneda de procesamiento final.
