# Plan: Gestión de Productos Físicos en el Panel de Administración

El usuario desea poder gestionar productos físicos (5,000 palabras, 8,000 palabras y 5,000 words Spanish Relax) desde el panel de administración, de forma similar a los productos digitales. Actualmente, la interfaz de administración (`/admin/productos`) y la edición de productos no muestran ni permiten filtrar explícitamente por el estado "físico", aunque el esquema de la base de datos y el modelo de datos ya cuentan con el campo `is_physical`.

## Cambios propuestos

### 1. Lista de Productos (`src/pages/AdminProducts.tsx`)
- **Filtros**: Añadir un botón de filtro para "Físicos" junto a los filtros de idioma.
- **Visualización (Tarjetas)**: Mostrar una etiqueta "Físico" en las tarjetas de producto (similar a la etiqueta "Upsell").
- **Visualización (Tabla)**: Añadir una columna "Formato" (Digital/Físico) o incluir el estado en la columna "Tipo".
- **Interfaz de Datos**: Actualizar la interfaz `Product` para incluir `is_physical: boolean`.

### 2. Edición de Producto (`src/pages/AdminProductEdit.tsx`)
- **Control de Formato**: Asegurar que el interruptor (Switch) para "Producto Físico" sea visible y funcional en la interfaz de edición (actualmente existe en la interfaz `Product` del archivo pero puede no estar renderizado de forma prominente).
- **Lógica Condicional**: Si un producto es físico, ocultar o marcar como opcionales los campos específicos de entrega digital (como `drive_url` o `access_key`) y mostrar avisos sobre la configuración de envío en Stripe.

### 3. Backend (Edge Function `manage-products`)
- Verificar que la acción `list` devuelva el campo `is_physical`.
- Asegurar que la acción `upsert` guarde correctamente el estado `is_physical` en la tabla `digital_products` (que actúa como maestro de catálogo).

## Detalles técnicos
- **Base de Datos**: La tabla `digital_products` ya tiene la columna `is_physical`.
- **Sincronización**: Los productos marcados como `is_physical: true` deben seguir siendo editables desde aquí para que el componente `ProductDynamic` y el catálogo los reconozca, pero su flujo de pago debe dirigirse a la lógica de Stripe Physical Checkout ya implementada.

## Pasos de Verificación
1. Entrar en `/admin/productos` y verificar que aparezca el filtro "Físicos".
2. Editar un producto (ej. Spanish Relax 5,000) y marcarlo como físico.
3. Guardar y verificar que en la lista aparezca con la etiqueta correspondiente.
4. Validar que al crear un nuevo producto se pueda seleccionar el formato físico desde el inicio.
