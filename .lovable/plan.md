# Plan de Corrección: Carga Blanca y Sincronización de Precios

El usuario informa que la tienda se queda en blanco, carga lento y parece caída (basado en la captura de pantalla de un error de "Carga segura"). Además, reitera que los precios en la Homepage y Catálogo no coinciden con el Admin (ej. 37 soles vs 20 soles).

## Diagnóstico Técnico
1. **Error de "Carga segura"**: Este componente suele activarse cuando hay un bucle de redirección o una excepción no controlada en una ruta crítica.
2. **Causa Probable del Pantallazo Blanco**: La sincronización de precios locales (`useCardPrice`) podría estar fallando al intentar acceder a propiedades de objetos nulos (`local_prices` o `local_usd_prices`) si la base de datos devuelve resultados inesperados o si el cache no se ha inicializado.
3. **Discrepancia de Precios**: Confirmé que `useCardPrice` y `useDigitalProducts` están implementados, pero es posible que el mapeo entre el SKU de la base de datos y los datos estáticos de `src/data/products.ts` esté usando el `id` estático en lugar del `sku` real de la DB en algunos componentes.

## Acciones Proponidas

### 1. Robustez en el Acceso a Datos
- Modificar `src/hooks/useCardPrice.ts` para añadir comprobaciones de nulidad defensivas en cada paso del formateo.
- Asegurar que si un producto no existe en el cache de la DB, se use el precio estático como fallback seguro sin romper el renderizado.

### 2. Sincronización Homepage y Catálogo
- Revisar `src/components/Languages.tsx` e `src/pages/Products.tsx` para garantizar que el `sku` pasado a `cardPrice.format(sku, fallback)` sea siempre el SKU de la base de datos.
- Verificar que el `originalPrice` también se sincronice usando `cardPrice.formatOriginal` para evitar que se muestren descuentos falsos o incoherentes.

### 3. Prevención de Bucle de Errores
- Revisar el `ErrorBoundary` o componente de "Carga segura" para identificar qué disparó el bloqueo mostrado en la imagen.

He actualizado la memoria del proyecto para priorizar la estabilidad de la carga sobre cualquier otra funcionalidad.
