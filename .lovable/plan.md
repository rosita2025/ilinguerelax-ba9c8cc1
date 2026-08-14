# Plan: Optimización y Automatización de Secuencias de Marketing y Recuperación de Carritos

El sistema de marketing y recuperación de carritos presenta fallos en la automatización y sincronización de datos entre las fuentes (Tienda, Hotmart) y las secuencias (Newsletter, Post-Compra, Abandonos). Este plan unifica el procesamiento de colas, corrige los filtros de exclusión y mejora la visibilidad en el panel de administración.

## Objetivos
- Unificar el procesamiento de todas las secuencias de marketing en un solo flujo confiable.
- Corregir el log de "Últimos envíos" en el panel de administración para que muestre la actividad real.
- Eliminar pantallas obsoletas (`/admin/brevo-abandoned`) y centralizar todo en `/admin/marketing-drips`.
- Asegurar que los abandonos de Hotmart y la tienda se procesen correctamente sin duplicados.

## Detalles Técnicos
- **Base de Datos**: 
  - Usar `marketing_drip_sends` como el log maestro de envíos para todas las secuencias.
  - Asegurar que `persistent_carts` sea la fuente de verdad para abandonos de la tienda.
- **Funciones Edge**:
  - `send-marketing-drip`: Optimizar para procesar no solo compras internas, sino también logs de Hotmart.
  - `send-cart-reminders`: Asegurar que el cron de PostgreSQL lo ejecute cada hora.
  - `send-newsletter-drip`: Corregir el filtro de `last_activity` para que no bloquee envíos si el carrito no tiene actividad reciente.
- **Panel Admin**:
  - Actualizar `AdminMarketingDrips.tsx` para incluir una pestaña de "Abandonos" (reemplazando la pantalla eliminada).
  - Agregar filtros por país y correo en el log de actividad.
  - Mostrar el estado del cron y permitir el procesamiento manual de todas las colas (Reminders, Drips, Newsletter).

## Pasos de Implementación

### 1. Backend: Consolidación y Reparación de Funciones
- Modificar `send-marketing-drip` para procesar contactos de `email_contacts` provenientes de compras manuales y Hotmart.
- Asegurar que `send-cart-reminders` use `marketing_drip_sends` para evitar correos duplicados entre sistemas.
- Actualizar el cron `send-marketing-drip` en la base de datos para asegurar su ejecución diaria.

### 2. Frontend: Centralización del Panel de Marketing
- Eliminar la ruta y archivo `src/pages/AdminBrevoAbandoned.tsx`.
- Modificar `src/components/admin/AdminNav.tsx` para remover el enlace a "Log de Abandonos Brevo".
- Rediseñar `src/pages/AdminMarketingDrips.tsx`:
  - Agregar una pestaña de "Abandonos" que muestre los logs de `brevo_sync_logs` y `cart_reminder_sends`.
  - Mejorar la tabla de "Últimos Envíos" para incluir columnas de País (detectado por IP/Config) y notas detalladas del paso enviado.
  - Unificar los botones de "Procesar Colas" en una sección de control centralizada.

### 3. Validación
- Realizar pruebas de envío manual desde el panel admin.
- Verificar que las compras exitosas marquen los carritos como `converted` para detener recordatorios.
- Validar la aparición de países y correos en los nuevos logs.
