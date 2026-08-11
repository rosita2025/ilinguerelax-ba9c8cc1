# Plan - Segmentación de Marketing Post-Compra y Automatización de Drips

El objetivo es implementar un sistema de segmentación para compradores recientes, permitiéndoles entrar en secuencias de marketing (Drip Campaigns) personalizadas según la categoría del producto adquirido, con envíos programados a los 7, 15 y 25 días (lanzamientos).

## Cambios propuestos

### Backend (Edge Functions y Base de Datos)

#### 1. Esquema de Base de Datos
- Crear la tabla `marketing_drip_config` para definir las secuencias por categoría y días.
- Crear la tabla `marketing_drip_sends` para rastrear los envíos realizados y evitar duplicados.
- Añadir políticas RLS y GRANTs necesarios.

#### 2. Lógica de Segmentación
- Modificar `supabase/functions/_shared/brevoContact.ts` para asegurar que el atributo `CATEGORIA` se guarde correctamente en cada compra (ya existe una base en `brevoCategory.ts`).
- Actualizar `supabase/functions/send-newsletter-drip/index.ts` o crear una nueva función `send-marketing-drip` que procese específicamente a los compradores basándose en su fecha de compra y categoría.

#### 3. Plantillas de Email
- Crear un nuevo archivo `supabase/functions/_shared/marketingTemplates.ts` (o extender `dripTemplates.ts`) con el contenido para los días 7, 15 y 25, adaptado a las categorías (Inglés, Coreano, Libros Físicos, etc.).

#### 4. Automatización
- Configurar un `pg_cron` que invoque la función de marketing drip diariamente.

### Frontend (Admin Panel)

#### 1. Panel de Configuración
- Crear `/admin/marketing-drips` para permitir al administrador editar los días y plantillas de cada categoría de lanzamiento.
- Integrar esta vista en `AdminHome.tsx`.

## Detalles técnicos
- **Segmentación:** Se utilizará la columna `source` y `product_type` de `email_contacts` o directamente los registros de `funnel_events` / `hotmart_purchases` / `stripe` para identificar compradores.
- **Intervalos:** 7 días (Recordatorio/Contenido), 15 días (Valor/Testimonios), 25 días (Oferta de Lanzamiento/Cierre).
- **Categorías:** Aprovechar el `inferProductCategory` existente para agrupar usuarios automáticamente.

## Pasos de validación
- Realizar una compra de prueba en la tienda y verificar que el contacto se cree con la categoría correcta en la base de datos.
- Invocar manualmente la función de drip con un email de prueba para validar el renderizado de la plantilla según la categoría.
- Verificar en el log de Brevo (o en el admin de Brevo) que los atributos de segmentación lleguen correctamente.
