# Plan: Actualización de Reseñas y Calificaciones en Productos Dinámicos

Este plan implementa la capacidad de mostrar reseñas y calificaciones personalizadas (incluyendo "cero" para productos nuevos) en las páginas de productos dinámicos y en la barra de compra persistente (`StickyBuyBar`).

## Cambios Realizados

### 1. Base de Datos (Supabase)
- Se han añadido las columnas `rating` (numeric) y `review_count` (integer) a la tabla `public.digital_products`.
- Se han establecido valores por defecto (`4.8` y `120`) para mantener la consistencia con los productos existentes.
- Se han otorgado permisos de lectura pública y gestión para administradores.

### 2. Frontend - Página de Producto (`ProductDynamic.tsx`)
- Se ha actualizado la interfaz `DBProduct` para incluir `rating` y `review_count`.
- Se ha modificado la consulta a Supabase para obtener estos nuevos campos.
- Los componentes `SEO`, `VerifiedReviews` y `StickyBuyBar` ahora utilizan los valores reales de la base de datos.
- Si un valor es explícitamente `0`, se mostrará como tal, satisfaciendo la petición del usuario para productos nuevos.

### 3. Frontend - Panel de Administración (`AdminProductEdit.tsx`)
- Se han incluido los campos `rating` y `review_count` en el formulario de edición de productos (Sección 3: Precios por región).
- Se ha actualizado la lógica de guardado para persistir estos valores en la base de datos.
- Se han añadido iconos de `lucide-react` (`Star`, `Eye`) para mejorar la interfaz del administrador.

## Verificación Sugerida
1. Ir a `/admin/productos` y editar un producto nuevo o existente.
2. Cambiar la calificación a `0.0` y el número de reseñas a `0`.
3. Guardar el producto.
4. Visitar la página pública del producto y verificar que tanto en el encabezado como en la barra lateral (`StickyBuyBar`) aparezcan las estrellas vacías y el texto "0.00 (0 reseñas)".

Este cambio permite al usuario gestionar la prueba social de cada producto de forma individual desde el panel de control.
