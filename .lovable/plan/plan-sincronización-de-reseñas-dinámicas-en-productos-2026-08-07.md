# Plan: Sincronización de Reseñas Dinámicas en Productos

El usuario indica que las reseñas no se están actualizando correctamente a "0" a pesar de haber realizado cambios en el administrador. He detectado que aunque la base de datos y los componentes principales ya fueron preparados, la función `manage-products` (Edge Function) no está procesando ni guardando los campos `rating` y `review_count` en la operación de `upsert`, lo que causa que los cambios en el administrador se pierdan al guardar.

## Cambios Propuestos

### 1. Backend (Edge Function)
- Modificar `supabase/functions/manage-products/index.ts` para extraer `rating` y `review_count` del payload y persistirlos en la tabla `digital_products`.

### 2. Frontend (Consistencia Visual)
- Asegurar que `StickyBuyBar.tsx` maneje correctamente el valor `0` para mostrar `0.00` y `(0 reseñas)` de forma consistente con `VerifiedReviews.tsx`.
- Verificar si hay valores estáticos remanentes en otros componentes de productos específicos.

## Pasos de Ejecución

1. **Actualizar la Edge Function**: Añadir `rating` y `review_count` al objeto `row` en la acción `upsert`.
2. **Refinar StickyBuyBar**: Ajustar la lógica de renderizado de estrellas y texto para que `0` no se reemplace por valores por defecto (como 4.65/800).
3. **Despliegue y Verificación**: Desplegar la función y verificar en el administrador que al guardar un "0", este se mantenga y se refleje en la página del producto.

Aviso: Usaré `supabase--deploy_edge_functions` para aplicar los cambios en el backend.