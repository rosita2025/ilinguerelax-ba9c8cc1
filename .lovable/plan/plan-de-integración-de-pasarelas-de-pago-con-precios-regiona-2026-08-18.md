# Plan de Integración de Pasarelas de Pago con Precios Regionales

Integrar la lógica de precios localizados de `useCountryTierRouting.ts` con los payloads de las pasarelas de pago (Stripe, dLocal Go, PayPal, Mercado Pago, Binance Pay y Pagos Manuales) para asegurar que el cobro coincida exactamente con lo que ve el usuario.

## Cambios propuestos

### Lógica de Negocio y Helpers

- **Crear `src/lib/paymentGatewayRouter.ts`**:
    - Centralizar la función `getPaymentPayload` para mapear los precios de `useCountryTierRouting` a los requisitos técnicos de cada pasarela.
    - Manejar decimales para Stripe (centavos vs enteros).
    - Implementar fallback a USD para PayPal en monedas no soportadas (PEN, COP).
    - Asegurar montos locales para dLocal Go y Mercado Pago.
    - Manejar conversión a USDT para Binance Pay.

- **Actualizar `src/hooks/useCountryTierRouting.ts`**:
    - Exponer `finalPriceAmount` (el valor numérico sin formatear) y `exchangeRate` en el retorno del hook para facilitar el uso en las pasarelas sin recalcular.

### Componentes de Checkout

- **Refactorizar `src/components/checkout/PaymentMethodsGroup.tsx`**:
    - Importar `getPaymentPayload`.
    - Integrar el helper en las llamadas a las funciones de cobro (Stripe, PayPal, etc.).
    - Asegurar que el `usdReference` y los montos locales se pasen correctamente al backend.

- **Actualizar `src/components/checkout/OrderSummary.tsx`**:
    - Sincronizar la visualización de totales para que use las mismas propiedades expuestas por el hook actualizado.

## Detalles técnicos

- **Stripe**: Multiplicar por 100 para monedas estándar; mantener entero para CLP/PYG.
- **PayPal**: Usar moneda local para `['USD', 'EUR', 'MXN', 'GBP', 'CAD', 'AUD']`, de lo contrario convertir a USD.
- **Binance**: Siempre convertir `finalPriceAmount / exchangeRate` para obtener el valor en USDT.
- **dLocal**: Usar `Math.round(finalPriceAmount)` para evitar errores de coma flotante en monedas de LatAm.

## Memoria del proyecto
Se ha creado `mem://features/payment-gateway-routing.md` con las reglas de negocio detalladas para futuras referencias.
