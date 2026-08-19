# Plan: Unificación Global de Precios, Envíos y Anti-Flicker

Este plan automatiza y estandariza la lógica de precios regionales, la gestión de envíos (físico vs digital) y la experiencia de usuario (Skeletons) en todo el catálogo de iLingue Relax, asegurando coherencia total entre el frontend y las pasarelas de pago.

## Cambios Realizados

### 1. Estandarización de Precios Regionales y Anti-Flicker
- **`ProductDynamic.tsx`**: Se asegura que el Skeleton Loader cubra el precio principal, los badges de región y el resumen de bonos hasta que `region.loading` y `loading` del producto se resuelvan. Se unifica la lógica para leer `local_prices` y `local_usd_prices` desde la base de datos para cualquier SKU.
- **`ProductSpanish5000.tsx`**: Se migra completamente al uso de `useAdminPricing` y `useCountryTierRouting` (actualmente usa algunos fallbacks estáticos) para garantizar que los precios de los libros físicos se sincronicen con el panel de administración. Se añaden Skeletons en el Hero y Sticky Bar.
- **`StickyBuyBar.tsx`**: Se refuerza la propiedad `isLoading` para bloquear el parpadeo de precios y banderas. Se añade el paso de `localUsdPrices` al tracking de Meta Pixel para reportar valores precisos en USD según la región.
- **`ProductCrossSell.tsx`**: Se actualiza para usar `useCardPrice` con Skeletons consistentes, evitando que los productos sugeridos muestren precios base incorrectos durante la carga.

### 2. Lógica Unificada de Envíos (Físico vs Digital)
- **`useCheckoutTotal.ts`**:
    - **Productos Digitales**: Envío siempre $0.00 USD.
    - **Productos Físicos**: 
        - Venta normal: $8.00 USD (Global) o $9.00 USD (LATAM).
        - Con Upsell: Envío GRATIS ($0.00 USD) automático al detectar más de un producto en el carrito.
- **`OrderSummary.tsx`**: Se ajustan las etiquetas para mostrar claramente "Envío Gratis (Upsell)" o "Entrega Digital Gratuita" según el tipo de producto, eliminando ambigüedad en el desglose final.

### 3. Sincronización Exacta con Pasarelas
- **Stripe y dLocal Go**: Se garantiza que el `totalUsd` calculado por `useCheckoutTotal.ts` sea el único valor enviado a las Edge Functions.
- Se elimina cualquier dependencia de precios hardcodeados en los componentes de checkout, delegando la responsabilidad al store centralizado y sus hooks de cálculo.

## Detalles Técnicos
- **Hooks**: Se prioriza `useCountryTierRouting` como el motor de decisión para determinar si un usuario va a Hotmart o a la Tienda Interna según su país e intereses.
- **Loading States**: Uso intensivo de `Skeleton` de Shadcn para mantener la estructura visual mientras se resuelve la geolocalización por IP.
- **Pasarelas**: Validación cruzada de montos antes de llamar a `stripe-create-intent` y `dlocal-create-payment`.

---
**¿Deseas que proceda con la implementación de estas reglas globales en todos los componentes mencionados?**
