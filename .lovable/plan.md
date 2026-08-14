# Plan: Reparar Visualización de Datos en Marketing Hub (Newsletter & Drips)

El usuario reporta que el "Marketing Hub" (`/admin/marketing-drips`) no muestra datos ("está en blanco") en la sección de Newsletter y Drips, a pesar de que existen registros en la base de datos (`newsletter_drip_sends` tiene 136 filas). La investigación muestra que el componente espera datos de un Edge Function inexistente o mal configurado y usa nombres de tablas inconsistentes.

## Cambios Propuestos

### 1. Backend (Edge Function)
- **Crear `list-marketing-drips`**:
    - Desarrollar una nueva Edge Function para centralizar la lectura de:
        - `marketing_drip_config` y `newsletter_drip_config`.
        - `marketing_drip_sends` y `newsletter_drip_sends` (combinados y normalizados).
        - `email_contacts` (para estadísticas de suscriptores).
        - `brevo_sync_logs` (para logs de abandonos).
    - Implementar filtrado por fecha, búsqueda por email/país y orden descendente.

### 2. Frontend (Panel Admin)
- **`AdminMarketingDrips.tsx`**:
    - Actualizar `loadData` para invocar la nueva Edge Function `list-marketing-drips` en lugar de hacer queries directas a tablas (mejora seguridad y rendimiento).
    - Corregir el mapeo de datos en la tabla de "Actividad Reciente" para que soporte tanto envíos de `newsletter` como de `drips` de marketing.
    - Asegurar que el componente maneje correctamente el estado de carga y muestre mensajes de "Sin datos" solo cuando realmente no hay registros.

### 3. Base de Datos (Seguridad)
- **RLS y Permisos**:
    - Verificar que las tablas `newsletter_drip_sends` y `marketing_drip_sends` tengan políticas RLS que permitan la lectura al rol `service_role` (usado por la Edge Function).
    - Asegurar que el frontend use `adminInvoke` para pasar los tokens de seguridad necesarios.

## Plan de Verificación
1. **Prueba de Función**: Invocar `list-marketing-drips` manualmente vía `curl` y verificar que retorne los 136 registros de newsletter encontrados.
2. **Dashboard**: Abrir `/admin/marketing-drips` y confirmar que la pestaña "Newsletter" muestra la tabla con los envíos recientes.
3. **KPIs**: Verificar que el contador "Newsletter Hoy" no sea cero si hubo envíos en las últimas 24 horas.
