# Plan: Implementación de Precios Dinámicos en Producto Físico 5000 Palabras

El usuario reporta que en la página del producto físico de 5,000 palabras, los precios en el botón principal y en la barra de compra fija (`StickyBuyBar`) se muestran estáticos en USD ($44.00), a pesar de que la cabecera muestra la moneda local (Soles en Perú).

## Cambios Propuestos

### Componente `StickyBuyBar.tsx`

- Actualizar el componente para aceptar `price` y `originalPrice` como `number` opcionalmente, o manejar la conversión interna si se pasan como strings estáticos en las páginas.
- Sin embargo, para mantener la compatibilidad con otros productos, es mejor usar la función `formatPrice` del hook `useI18n` dentro de las páginas que consumen el componente.

### Página `ProductSpanish5000.tsx`

- Utilizar el hook `useI18n` (que ya está importado y desestructurado) para formatear dinámicamente los precios de $44.00 y $59.00.
- Reemplazar las cadenas estáticas en:
    - El objeto `campaign`.
    - Las variables `stickyPriceLabel` y `stickyOriginalLabel`.
    - El texto del botón principal "BUY NOW · $44.00".
    - El bloque de "Digital-Only version" (si aplica).

## Detalles Técnicos

1.  **`src/pages/ProductSpanish5000.tsx`**:
    - Localizar el objeto `campaign` y cambiar `price: "$44.00"` por `price: formatPrice(44)`.
    - Localizar el botón principal y cambiar `BUY NOW · {campaign.price}` por `BUY NOW · {formatPrice(44)}`.
    - Asegurarse de que `StickyBuyBar` reciba `price={formatPrice(44)}` y `originalPrice={formatPrice(59)}`.

2.  **`src/components/StickyBuyBar.tsx`**:
    - Verificar si el componente necesita ajustes internos para manejar mejor el cambio de moneda, aunque si se le pasan las strings ya formateadas desde la página, debería funcionar correctamente.

## Verificación

- Simular navegación desde Perú (IP/Currency) y verificar que tanto el botón como la barra fija muestren "S/" en lugar de "$".
- Verificar que el precio de oferta y el precio tachado se actualicen correctamente.
