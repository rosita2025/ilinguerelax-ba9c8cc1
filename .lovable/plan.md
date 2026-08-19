# Plan - Corrección Error SDK PayPal (Desglose Dinámico)

El usuario reporta un error de SDK en PayPal al procesar el pago de $52.00 USD ($44.00 producto + $8.00 envío). Este error suele ocurrir cuando el desglose matemático (`breakdown`) en la orden de PayPal no suma exactamente el valor total de la unidad de compra, o cuando hay discrepancias entre lo que el cliente intenta pagar y lo que el servidor crea.

## Problema Identificado
1.  **Cálculo Proporcional en el Desglose**: El código actual en `paypal-create-order/index.ts` intenta calcular el `item_total` y el `shipping` como una proporción del total final para manejar monedas locales, pero la fórmula puede generar errores de redondeo o inconsistencias cuando hay cupones aplicados.
2.  **Sincronización de Totales**: Aunque el frontend (`PaymentMethodsGroup.tsx`) ya envía el total correcto, el servidor recalcula el envío. Si hay una discrepancia mínima en el redondeo del `item_total` después del descuento del cupón, PayPal rechaza la transacción con `AMOUNT_MISMATCH`.

## Cambios Propuestos

### Backend (Edge Functions)
- **Actualizar `paypal-create-order/index.ts`**:
    - Simplificar el cálculo del `breakdown`. En lugar de proporciones complejas sobre el total final, calcularemos el `item_total` como la resta simple de `amount - shipping`.
    - Asegurar que `amount.value` sea exactamente igual a `item_total.value + shipping.value`.
    - Mejorar el logging para diagnosticar discrepancias de centavos en producción.

### Frontend
- **Verificar `PayPalButtons.tsx`**:
    - Confirmar que el `amount` pasado a la función `createOrder` es el valor final calculado por el hook de totales, asegurando consistencia absoluta entre la UI y la API.

## Detalles Técnicos
- La regla de negocio es: $44.00 (producto) + $8.00 (envío) = $52.00 total.
- Si hay un cupón (ej. 10%): ($44.00 * 0.9) + $8.00 = $39.60 + $8.00 = $47.60.
- El breakdown de PayPal debe ser: `item_total: 39.60`, `shipping: 8.00`, `total: 47.60`.

## Validación
- Realizar una prueba de pago con el SKU del sistema maestro de español.
- Verificar que el botón de PayPal cargue correctamente sin errores de SDK.
- Confirmar en los logs del servidor que el JSON enviado a PayPal sume correctamente.
