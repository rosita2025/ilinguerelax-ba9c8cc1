# Plan de implementación: Cupón de Descuento "PRUEBA1USD"

Para facilitar las pruebas del flujo de pago completo con importes reales mínimos, implementaremos un sistema de cupones con total fijo.

## Cambios propuestos

### Lógica del Frontend (Checkout Store)
- Registrar el código `PRUEBA1USD` en el objeto `FIXED_TOTAL_COUPONS` dentro de `src/stores/checkoutStore.ts`.
- Esto permitirá que al aplicar el cupón en el resumen del pedido, el total se ajuste automáticamente a **$1.00 USD** (o su equivalente local) independientemente del precio original del producto.

### Lógica del Backend (Edge Functions)
- Registrar el mismo código `PRUEBA1USD` en `supabase/functions/_shared/catalogPricing.ts`.
- La función `resolveServerPricing` ya cuenta con lógica para manejar cupones de total fijo, garantizando que el servidor valide y cobre exactamente el monto de prueba configurado, evitando discrepancias entre lo que ve el cliente y lo que procesa la pasarela.

### UI de Checkout
- El componente `OrderSummary.tsx` ya tiene el campo de entrada para cupones y la lógica para aplicarlos, por lo que heredará esta funcionalidad automáticamente al actualizar el store.

## Detalles Técnicos

### 1. `src/stores/checkoutStore.ts`
Actualizar el objeto `FIXED_TOTAL_COUPONS`:
```typescript
const FIXED_TOTAL_COUPONS: Record<string, number> = {
  DLTEST1: 1,
  FIXED1: 1,
  PRUEBA1: 1,
  PRUEBA1USD: 1, // Nuevo código
  TEST1USD: 1,   // Alias sugerido
};
```

### 2. `supabase/functions/_shared/catalogPricing.ts`
Actualizar el objeto `FIXED_TOTAL_COUPONS` en el compartido del backend:
```typescript
export const FIXED_TOTAL_COUPONS: Record<string, number> = {
  DLTEST1: 1,
  FIXED1: 1,
  PRUEBA1: 1,
  PRUEBA1USD: 1, // Nuevo código
  TEST1USD: 1,   // Alias sugerido
};
```

## Verificación
1. Ir al checkout con cualquier producto.
2. Ingresar el cupón `PRUEBA1USD`.
3. Validar que el total a pagar cambie a **$1.00 USD** (o moneda local equivalente).
4. Realizar una compra de prueba con Stripe o dLocal para confirmar la recepción del pago de $1.
