# Plan - Sincronización de Precios Locales

El usuario reporta que los precios en la Homepage y en la lista de productos no coinciden con los configurados en el Admin (ej. 37 soles vs 20 soles). Aunque ya se realizaron cambios previos, el usuario insiste en que no están actualizados.

## Análisis
1. **Source of Truth**: La tabla `digital_products` en Supabase contiene los precios reales (`price_usd`, `price_pen`, `local_prices`).
2. **Hook de Precios**: `useCardPrice` es el encargado de formatear estos precios para las tarjetas.
3. **Fuga de Datos Estáticos**: Es posible que `src/data/products.ts` (datos estáticos) esté sobreescribiendo o siendo usado en lugar de los datos de la base de datos en algunos componentes.
4. **Caché/Sincronización**: Verificar que `useDigitalProducts` y `useCardPrice` estén refrescando los datos correctamente cuando hay cambios en el Admin.

## Acciones Proponidas

### 1. Verificación de Componentes
- Asegurar que `src/pages/Products.tsx` use los datos de `useDigitalProducts` (DB) y no el array estático de `src/data/products.ts` para el renderizado final.
- Revisar `src/components/Languages.tsx` (Homepage) para confirmar que usa el hook `useCardPrice` con los SKUs correctos de la DB.

### 2. Refuerzo de `useCardPrice`
- Validar que el hook priorice `price_pen` cuando el país es `PE`.
- Asegurar que `local_prices` se use correctamente para conversiones manuales.

### 3. Limpieza de Datos Estáticos
- Los precios en `src/data/products.ts` deben ser considerados solo como fallbacks de último recurso.

## Detalles Técnicos
- **Archivo**: `src/hooks/useCardPrice.ts` -> Asegurar que `format(sku, fallbackUsd)` use el SKU para buscar en el caché de la DB.
- **Archivo**: `src/pages/Products.tsx` -> Confirmar que `items` de `useDigitalProducts` mapeen correctamente a los componentes de tarjeta.

He actualizado la memoria del proyecto para reflejar la importancia de esta sincronización.
