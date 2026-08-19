# Plan: Corrección Definitiva de SKU y Alias de Checkout

Implementar una resolución dinámica de productos en el checkout para eliminar los errores de "Producto no encontrado" y asegurar que los botones de compra siempre apunten al SKU correcto.

## Cambios propuestos

### Configuración y Lógica de Resolución
- **`src/config/checkoutCatalog.ts`**:
    - Centralizar los alias de SKUs heredados (`spanish_5000_physical`, `english_8000`, etc.) en un mapa robusto.
    - Mejorar `resolveCheckoutSlug` para normalizar slugs (guiones bajos a medios) y manejar casos de insensibilidad a mayúsculas.
    - Asegurar que `getCatalogItem` use la resolución dinámica para encontrar el producto en el catálogo estático o en la base de datos.

### Páginas de Producto
- **`src/pages/Product*.tsx`**:
    - Eliminar rutas de checkout escritas a mano como `navigate("/checkouts/english_8000")`.
    - Cargar el producto desde la base de datos (o usar el objeto estático disponible) y navegar usando el SKU real: `navigate("/checkouts/${product.sku}")`.
    - Esto aplica a:
        - `Product5000Book.tsx`
        - `Product8000Book.tsx`
        - `ProductSpanish3000VerbsBook.tsx`
        - `ProductSpanishGrammarPatterns.tsx`
        - `ProductSpanish5000.tsx` (y su variante digital).

### Página de Checkout
- **`src/pages/Checkout.tsx`**:
    - Refinar el `useEffect` de carga de datos para que la resolución del SKU de administración sea infalible.
    - Asegurar que si un SKU no existe en `digital_products` pero sí en el catálogo estático, el checkout cargue correctamente.

## Detalles técnicos
- Uso de `resolveCheckoutSlug` como punto de entrada único para normalizar cualquier identificador proveniente de la URL.
- Los componentes `StickyBuyBar` en las páginas de producto recibirán el SKU dinámico para que el tracking de Meta Pixel y la navegación sean coherentes.

## Verificación
- Probar la navegación desde cada página de producto hacia el checkout.
- Verificar que los alias antiguos (ej. `/checkouts/english_8000`) sigan funcionando mediante la redirección interna del resolver.
- Confirmar que los eventos de Meta Pixel `AddToCart` e `InitiateCheckout` reciban el SKU real.
