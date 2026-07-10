## Panel `/admin/productos` — Gestión tipo Shopify

Crear un panel completo para gestionar productos digitales sin tocar código.

### 1. Base de datos

Nueva tabla `digital_products` en Lovable Cloud:

| Campo | Tipo | Ejemplo |
|---|---|---|
| `sku` | text (único) | `patrones-especiales` |
| `name` | text | "Patrones Especiales de Inglés" |
| `description` | text | Descripción larga |
| `learner_language` | text | `es`, `en`, `fr`, `pt`, `ko` |
| `target_language` | text | `en`, `es`, `ko`, `fr` |
| `price_usd` | numeric | 8.00 |
| `price_pen` | numeric | 29.90 |
| `drive_url` | text | Enlace de Google Drive |
| `access_key` | text (opcional) | Solo si algún PDF la usa |
| `cover_image_url` | text | URL de la portada |
| `is_upsell` | boolean | Si puede aparecer como upsell |
| `stripe_price_id` | text (auto) | Se crea al guardar |
| `mp_preference_template` | jsonb (auto) | Configuración Mercado Pago |
| `active` | boolean | Publicado / borrador |
| `sort_order` | integer | Orden en la tienda |

Tabla auxiliar `product_upsells` (relaciones N:N):

| Campo | Descripción |
|---|---|
| `product_sku` | Producto principal |
| `upsell_sku` | Producto sugerido |
| `discount_pct` | Descuento al agregarlo (ej: 30%) |

Así cada producto tiene **sus propios upsells** (ej: Patrones sugiere Coreano; Coreano sugiere Verbos).

### 2. Categorías por par de idiomas

El sistema filtra automáticamente por combinación **idioma nativo → idioma a estudiar**:

- 🇪🇸 → 🇬🇧 Español aprende Inglés (Patrones, 1000 Verbos, 500 Preguntas)
- 🇬🇧 → 🇪🇸 Inglés aprende Español (5000 Spanish Words)
- 🇪🇸 → 🇰🇷 Español aprende Coreano (100 Mapas Coreano)
- 🇫🇷 → 🇬🇧 Francés aprende Inglés
- etc.

El admin muestra tabs por categoría; el frontend usa geolocalización IP para sugerir la categoría correcta.

### 3. Panel `/admin/productos`

Interfaz tipo Shopify:

- **Lista de productos** — tabla con thumbnail, nombre, categoría (banderas), precio USD/PEN, estado (activo/borrador), botones editar/duplicar/desactivar.
- **Filtros** — por categoría (par de idiomas), estado, tipo (principal/upsell).
- **Botón "Nuevo producto"** — formulario paso a paso:
  1. Info básica (nombre, SKU, descripción, portada)
  2. Idiomas (nativo → estudia)
  3. Precios (USD, PEN)
  4. Entrega digital (enlace Drive, clave opcional)
  5. Upsells (seleccionar productos sugeridos con descuento)
  6. Publicar (activo/borrador)
- **Al guardar** — llama edge function `sync-product-payment` que:
  - Crea el producto en Stripe automáticamente (via `payments--create_product` en runtime)
  - Genera plantilla de Mercado Pago
  - Guarda los IDs en la tabla

### 4. Integración con el resto del sistema

- **Checkout** (`checkoutCatalog.ts`) — se convierte en hook `useCheckoutCatalog()` que lee de la tabla.
- **Upsells en carrito** (`UpsellPanel.tsx`) — lee `product_upsells` según el producto en carrito.
- **Email de entrega** (`manage-manual-payments`, `send-transactional-email`) — consulta la tabla por SKU en vez de mapa hardcoded.
- **Páginas de producto** — opcional en fase 2: se puede migrar cada `ProductXxx.tsx` a leer de la tabla.

### 5. Migración de datos actuales

Poblar la tabla con los productos existentes:
- Patrones Especiales ($8 / S/29.90, ES→EN)
- Coreano 100 Mapas ($27, ES→KO)
- 1000 Verbos Inglés ($9, ES→EN)
- 500 Preguntas Inglés ($9, ES→EN)
- 5000 Spanish Words ($22, EN→ES)

Necesitaré que pegues los **enlaces de Google Drive** de cada uno para completarlos (o los dejo vacíos y los editas después en el panel).

### 6. Seguridad

- Tabla protegida con RLS: solo lectura pública de productos `active=true`; escritura solo vía edge function con `ADMIN_REVIEW_KEY`.
- El panel `/admin/productos` reutiliza la misma protección de `/admin/manual-payments`.
- `/descarga/*` se agrega a `robots.txt` con `Disallow` + meta `noindex` (aunque migremos a Drive, para limpiar rastros SEO).

### Detalles técnicos

**Archivos nuevos:**
- `supabase/migrations/xxx_digital_products.sql`
- `supabase/functions/manage-products/index.ts` (CRUD + sync a Stripe)
- `src/pages/AdminProducts.tsx` (lista)
- `src/pages/AdminProductEdit.tsx` (formulario)
- `src/components/admin/UpsellSelector.tsx`
- `src/hooks/useDigitalProducts.ts`

**Archivos modificados:**
- `src/App.tsx` — rutas `/admin/productos` y `/admin/productos/:sku`
- `src/pages/AdminHome.tsx` — nueva tarjeta "Productos"
- `src/stores/checkoutPruebaStore.ts` — leer de la tabla
- `supabase/functions/manage-manual-payments/index.ts` — leer materiales de la tabla
- `supabase/functions/_shared/transactional-email-templates/material-delivery.tsx` — recibir array de materiales
- `public/robots.txt` — bloquear `/descarga/*`

### Fase de entrega

**Fase 1 (esta iteración):** Tabla + panel admin + migración de datos + integración con checkout y emails.
**Fase 2 (después):** Migrar páginas de producto individuales para leer de la tabla (opcional; hoy funcionan hardcoded).

¿Procedo con la Fase 1?
