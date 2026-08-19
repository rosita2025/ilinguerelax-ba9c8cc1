# Plan de Corrección de UX Móvil y Diseño Responsivo

Se detectaron problemas de desbordamiento horizontal y superposición de elementos flotantes en dispositivos móviles, especialmente en las páginas del sistema Spanish Mastery (5,000 palabras). Este plan detalla las acciones técnicas para estabilizar la interfaz y mejorar la fluidez de la compra.

## Objetivos
- Eliminar el desbordamiento horizontal (`overflow-x`) en móviles.
- Resolver la competencia visual entre elementos fijos (Sticky Bar, WhatsApp, Carrito, Scroll-to-Top).
- Asegurar que la barra de compra (`StickyBuyBar`) sea coherente con el producto visualizado (Físico vs Digital).

## Acciones Técnicas

### 1. Estabilización de Contenedores y Tipografía (Responsivo)
- **Páginas Afectadas:** `src/pages/ProductSpanish5000.tsx` y `src/pages/ProductSpanish5000Digital.tsx`.
- Aplicar `w-full max-w-full overflow-x-hidden px-4` al contenedor principal del Hero.
- Ajustar títulos `h1` con `text-xl sm:text-2xl` y `break-words` para evitar que rompan el layout en pantallas de 320px-375px.

### 2. Gestión de Elementos Flotantes (Z-Index y Posicionamiento)
- **StickyBuyBar:** Se mantendrá como el elemento jerárquico principal en la base (`z-50`).
- **CartDrawer (Botón Flotante):**
  - Se implementará una lógica para **ocultar** el botón flotante del carrito en móviles cuando la `StickyBuyBar` esté presente, evitando la redundancia (ya que la barra muestra el precio y permite comprar).
- **WhatsApp y ScrollToTop:**
  - Se ajustará su posición `bottom` dinámica (usando la variable CSS `--sticky-bar-h` ya existente) para que siempre floten **encima** de la barra de compra, pero con un margen mayor en móviles para no obstruir el botón principal "BUY NOW".

### 3. Coherencia de Producto en Sticky Bar
- Se verificará que en la página del libro físico, la `StickyBuyBar` apunte al SKU del libro físico y muestre su precio ($44.00 USD).
- En la página digital, la barra debe mostrar el precio regionalizado correctamente y apuntar al checkout digital.

### 4. Limpieza de UI
- Eliminar márgenes excesivos o elementos decorativos que causan el desbordamiento lateral.
- Asegurar que el componente `PinterestSave` no interfiera con el scroll lateral.

## Verificación
- Prueba en simulador de viewport (320px, 375px, 414px).
- Verificación de la variable `--sticky-bar-h` para confirmar que los botones flotantes se desplazan correctamente al aparecer/desaparecer la barra.
- Confirmar que no hay scroll horizontal residual.
