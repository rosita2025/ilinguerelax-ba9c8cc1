# Plan: Corregir estructura de productos Spanish Mastery System (Físico vs Digital)

Corregir la duplicidad de ofertas en la página física y asegurar una separación clara de productos entre las versiones física y digital, con precios actualizados y diseño móvil optimizado.

## Cambios propuestos

### Configuración de Catálogo
- **Archivo:** `src/config/checkoutCatalog.ts`
- Actualizar el precio base del SKU `5000-spanish-words` (digital) a **$72.99 USD** para que coincida con la nueva estrategia de precios.

### Página de Producto Físico
- **Archivo:** `src/pages/ProductSpanish5000.tsx`
- Identificar y **eliminar** cualquier sección o tarjeta que venda nuevamente el "Physical Bundle" (ya que es el producto principal del Hero).
- Mantener o refinar la sección de **"Digital Alternative Option"**:
  - Título: "Looking for a Digital-Only version?"
  - Botón: "View Digital Version — $72.99 USD" (usando `formatPrice(72.99)`).
  - Redirección: `/products/5-000-spanish-words-with-english-pronunciation-digital`.
- Aplicar `w-full max-w-full px-4 box-border text-center` para asegurar responsividad en móviles.

### Página de Producto Digital
- **Archivo:** `src/pages/ProductSpanish5000Digital.tsx`
- Asegurar que el producto principal sea el Digital ($72.99 USD).
- Actualizar el bloque de alternativa física:
  - Título: "Want the Physical Printed Book?"
  - Botón: "Get Physical Book + Free Digital — $44.00 USD" (usando `formatPrice(44.00)`).
  - Redirección: `/products/5-000-spanish-words-with-english-pronunciation-physical`.
- Aplicar `w-full max-w-full px-4 box-border text-center` en este bloque.

## Detalles técnicos
- Uso de `formatPrice` del hook `useI18n` para mantener la coherencia monetaria.
- Uso de `navigate` de `react-router-dom` para las redirecciones internas.
- Verificación de desbordamiento horizontal en dispositivos móviles.
