# Plan de Implementación: Gestión de Seguimiento y Pedidos Físicos en Admin

El objetivo es crear un panel de administración dedicado para productos físicos que permita gestionar números de seguimiento (tracking) y estados de envío, separándolos de las compras puramente digitales para una mejor gestión logística.

## User Review Required

> [!IMPORTANT]
> - ¿Qué formato suelen tener tus números de seguimiento? (Ej: Solo números, enlace directo de Amazon, o texto libre)
> - ¿Necesitas que el sistema envíe un correo automático al cliente en cuanto guardes el número de seguimiento en el panel?

## Cambios Propuestos

### Base de Datos (Supabase)
- Añadir columna `tracking_number` y `shipping_provider` a la tabla `manual_payments`.
- Añadir columna `tracking_number` y `shipping_provider` a la tabla `shopify_sales` (para reflejar envíos de Amazon/Shopify).
- Asegurar que `order_events` registre cada actualización de tracking para auditoría.

### Panel de Administración
- **Nueva Página `AdminPhysicalOrders.tsx`**: Panel dedicado a "/admin/orders-physical" que solo muestra pedidos con productos físicos.
- **Gestión de Tracking**: Interfaz para introducir números de seguimiento por pedido.
- **Filtros por Estado**: Separar pedidos en "Pendiente de Envío", "En Tránsito" y "Entregado".
- **Integración en `AdminNav.tsx`**: Añadir enlace directo a "Pedidos Físicos" bajo la sección de Ventas.

### Experiencia del Cliente
- Actualizar `/mi-pedido` (`OrderStatus.tsx`) para mostrar el número de seguimiento y un enlace directo al transportista si está disponible.

## Detalles Técnicos

### Esquema de Datos
```sql
ALTER TABLE public.manual_payments ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.manual_payments ADD COLUMN IF NOT EXISTS shipping_provider TEXT;

ALTER TABLE public.shopify_sales ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.shopify_sales ADD COLUMN IF NOT EXISTS shipping_provider TEXT;
```

### Componentes React
- **`AdminPhysicalOrders.tsx`**: Utilizará `adminInvoke("list-admin-orders")` filtrando por `isPhysical`.
- **`TrackingAction.tsx`**: Pequeño componente para editar el tracking sin recargar toda la lista.

### Funciones Edge
- Actualizar `list-admin-orders` para incluir los nuevos campos de seguimiento en el payload de respuesta.
- Crear/Actualizar `update-order-tracking` para persistir los cambios y registrar el evento en `order_events`.

## Pasos de Verificación
1. Crear un pedido manual con producto físico y verificar que aparece en el nuevo panel.
2. Asignar un número de tracking y confirmar que se guarda correctamente en la base de datos.
3. Verificar que en `/mi-pedido` el cliente ahora puede ver su número de seguimiento.
4. Validar que los pedidos digitales no aparecen en esta nueva vista para evitar confusión.
