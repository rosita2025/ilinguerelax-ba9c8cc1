# Plan: Sincronización de Pasarelas de Pago con Nueva Estructura Regional 3-Tier

Asegurar que todas las pasarelas de pago utilicen la nueva lógica de 3 Tiers Regionales (LATAM, Anglosphere/Europa, Resto del Mundo) y que el precio mostrado en el `OrderSummary` coincida exactamente con lo cobrado.

## Cambios propuestos

### Lógica de Enrutamiento y Pasarelas (`src/lib/paymentGatewayRouter.ts`)
- Refactorizar `getPaymentPayload` para que no dependa de cálculos locales propios, sino que acepte y priorice el objeto `countryPricing` calculado por el hook `useCountryTierRouting`.
- **Stripe**: Ajustar para usar el `priceUsd` regional como base si no hay sobreescritura local manual, aplicando la tasa de cambio dinámicamente. Asegurar multiplicación por 100 para centavos (excepto monedas zero-decimal).
- **dLocal Go**: Forzar el uso del tier `Base USD - LATAM` para países de la región, convirtiendo a moneda local redondeada.
- **PayPal**: Implementar el fallback inteligente. Si la moneda no es soportada (PEN, COP), reconvertir el monto local al tier `Base USD - LATAM` original en USD para evitar errores de API.
- **Mercado Pago**: Sincronizar con el tier LATAM convertido a PEN/MXN según el país.
- **Pagos Manuales**: Garantizar que Yape/Plin usen el valor redondeado calculado desde el tier LATAM.

### Componentes de Checkout (`src/components/checkout/`)
- **`PaymentMethodsGroup.tsx`**:
  - Inyectar el hook `useCountryTierRouting` (o pasar sus datos) para alimentar `getPaymentPayload`.
  - Eliminar lógicas de cálculo de precios "espejo" que causen discrepancias con el hook principal.
- **`OrderSummary.tsx`**:
  - Unificar la visualización para que el "USD Reference" mostrado al usuario sea exactamente el `priceUsd` del tier asignado (Latam vs Global vs Tienda).
  - Asegurar que `sumItemsLocal` use los mismos anclas regionales que el hook principal.

## Verificación técnica
- Validar mediante logs en consola que el payload enviado a cada pasarela coincide con el `finalPriceAmount` del hook `useCountryTierRouting`.
- Probar el cambio de país simulado (o por IP) y verificar que el `OrderSummary` actualiza los tiers y las pasarelas reaccionan al cambio de ancla USD.
- Confirmar que PayPal no falla en Perú/Colombia enviando USD (Latam) en lugar de moneda local no soportada.

## Notas de Seguridad
- Se mantiene la integridad de los datos sin exponer `service_role` ni claves privadas.
- Las conversiones se realizan en el cliente basándose en las tasas sincronizadas, pero se validan en el servidor mediante webhooks (ya implementado).
