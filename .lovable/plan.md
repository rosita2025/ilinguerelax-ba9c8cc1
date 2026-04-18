
Objetivo: dejar el producto `/products/5-000-spanish-words-with-english-pronunciation` totalmente consistente en **$27.99 USD** con **48% de descuento**.

Lo que averigüé:
- El pantallazo que subiste coincide con un precio viejo en la barra fija inferior.
- En `src/pages/ProductSpanish5000.tsx` todavía hay un valor visible desactualizado:
  - `StickyBuyBar price="$22"` al final del archivo.
- Además encontré valores viejos en tracking/analytics del mismo producto:
  - `value: 22` en `pixelParams`
  - `value: 22` en `trackHotmartEvent("InitiateCheckout", ...)`
- También hay valores viejos en páginas de compra exitosa:
  - `src/pages/PaymentSuccess.tsx` usa `value: 17`
  - `src/pages/HotmartSuccess.tsx` usa `value = 12` cuando el producto es Spanish

Plan de implementación:
1. Actualizar `src/pages/ProductSpanish5000.tsx`
   - Cambiar `StickyBuyBar price="$22"` a `price="$27.99"`.
   - Mantener `originalPrice="$54"` para que el descuento siga siendo 48%.
   - Cambiar los dos valores de tracking (`value: 22`) a `27.99`.

2. Actualizar tracking de compra exitosa
   - En `src/pages/PaymentSuccess.tsx`, cambiar `value: 17` a `27.99`.
   - En `src/pages/HotmartSuccess.tsx`, cambiar el caso de `spanish` de `value = 12` a `27.99`.

3. Verificación visual y funcional
   - Revisar en móvil la barra fija inferior para confirmar que ya muestre:
     - `$27.99`
     - `$54`
     - el producto correcto
   - Confirmar que hero, countdown, CTA intermedio y sticky bar queden alineados con el mismo precio.
   - Verificar que no queden rastros de `$22` visibles para ese producto.

Detalles técnicos:
- Archivo principal afectado: `src/pages/ProductSpanish5000.tsx`
- Archivos secundarios: `src/pages/PaymentSuccess.tsx`, `src/pages/HotmartSuccess.tsx`
- No hace falta cambiar `src/data/products.ts` porque ahí ya está correcto: `price: 27.99`, `discount: 48`.
- El problema visible actual viene del `StickyBuyBar`, no del catálogo.

Resultado esperado:
- El usuario verá **$27.99 USD** en toda la página del producto Spanish Relax.
- El descuento seguirá coherente contra **$54**.
- El tracking de vista, checkout y compra quedará alineado con el nuevo precio.
