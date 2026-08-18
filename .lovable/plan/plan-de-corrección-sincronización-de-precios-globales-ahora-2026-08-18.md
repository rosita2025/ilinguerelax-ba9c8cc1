# Plan de Corrección: Sincronización de Precios Globales (Ahora vs. Antes)

Se ha detectado una discrepancia donde el precio "Antes" (tachado) no se convierte correctamente a la moneda local en el frontend, mostrando el valor nominal en USD (ej. "COP 97") en lugar de aplicar la tasa de cambio o el valor manual.

## Cambios Realizados

### 1. Núcleo de Lógica (`src/hooks/useCountryTierRouting.ts`)
- **Unificación de Tasas**: Asegurar que tanto `price` como `compareAtPrice` usen la misma `exchangeRate` cuando no hay valores manuales.
- **Prioridad de Valores Manuales**: Respetar `manualCompareAt` (localCompareAtPrices) antes de intentar convertir el USD base.
- **Cálculo de Ahorro**: Implementar el cálculo de `discountPercentage` basado en los valores finales (locales) para asegurar precisión.

### 2. Páginas de Producto (`src/pages/ProductSpanish5000Digital.tsx` y `src/pages/ProductSpanish5000.tsx`)
- **Eliminación de Hardcoding**: Sustituir constantes manuales (como el multiplicador 2.5x o el fallback de 97) por los valores procesados que vienen del hook.
- **Sincronización de Etiquetas**: Usar `tier.priceLabel` y `tier.originalLabel` exclusivamente para garantizar que la moneda sea consistente (ej. ambos en COP o ambos en USD).
- **Badge de Descuento**: Actualizar los badges de "SAVE X%" para usar `tier.discountPercentage` dinámico en lugar de valores estáticos.

## Detalles Técnicos
- Se utilizará la tasa de cambio detectada en `displayCurrency` para realizar la conversión de `compareAtPriceUsd` si no existe un valor manual en `localCompareAtPrices`.
- Se validará que `finalCompareAt` sea siempre mayor que `finalPrice` antes de marcar un producto como `isOnSale`.
- Se eliminarán las lógicas de fallback específicas por SKU dentro de los componentes para centralizarlas en el hook de ruteo.

## Verificación
- Simulación de tráfico desde Colombia (COP) y México (MXN) para confirmar que los precios tachados reflejen montos convertidos (ej. ~$440.000 COP para un tachado de $97 USD).
- Verificación en el Admin para asegurar que al limpiar un precio manual "Antes", el frontend vuelva automáticamente al cálculo basado en el USD base.
