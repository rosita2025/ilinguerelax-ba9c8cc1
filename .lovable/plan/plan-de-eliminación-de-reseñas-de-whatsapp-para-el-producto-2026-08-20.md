# Plan de Eliminación de Reseñas de WhatsApp para el Producto CMB7

El usuario ha solicitado eliminar la sección de reseñas de WhatsApp ("wn wtspp de reseñas") específicamente de la ruta `products/5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7` (SKU: `5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7`).

## Tareas a realizar

1. **Modificar `src/pages/ProductDynamic.tsx`**:
   - Localizar la renderización condicional del componente `ResenasWhatsAppCoreano`.
   - Eliminar el SKU `5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7` de la condición para que la sección de reseñas de WhatsApp ya no se muestre en este producto.
   - Mantener el componente para los otros SKUs coreanos especificados (`coreano-100-mapas-mentales` y `npca`).

## Detalles técnicos
- La condición actual se encuentra cerca de la línea 547 de `src/pages/ProductDynamic.tsx`.
- Se removerá la comparación `product.sku === "5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7"` de la cláusula `OR`.

## Validación
- Verificar que el componente `ResenasWhatsAppCoreano` no se renderice cuando el SKU sea el del producto español (CMB7).
- Confirmar que sigue apareciendo para los productos de coreano.
