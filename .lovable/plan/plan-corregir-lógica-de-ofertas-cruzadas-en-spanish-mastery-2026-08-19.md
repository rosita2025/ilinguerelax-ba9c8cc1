# Plan: Corregir Lógica de Ofertas Cruzadas en Spanish Mastery System

El objetivo es separar claramente las ofertas físicas y digitales en sus respectivas páginas para evitar redundancias, corregir el precio de la versión digital a $72.99 USD y asegurar un diseño móvil perfecto sin desbordamientos.

## Cambios en el Frontend

### 1. Página del Libro Físico (`src/pages/ProductSpanish5000.tsx`)
- Eliminar la sección `#physical-bundle` (líneas 444-522) que duplica la oferta del Hero.
- Insertar un nuevo bloque "Looking for a Digital-Only version?" elegante después de la sección de beneficios.
- **Texto**: "Get instant access to the PDF version without waiting for international shipping."
- **Botón**: "View Digital Version — $72.99 USD" (usando `formatPrice` para moneda local).
- **Ruta**: Redirigir a `/products/5-000-spanish-words-with-english-pronunciation-digital`.
- **Estilo**: Asegurar `w-full max-w-full px-4 box-border text-center` para evitar overflow móvil.

### 2. Página Digital (`src/pages/ProductSpanish5000Digital.tsx`)
- Modificar la tarjeta de "Upgrade" (líneas 600-618) o agregar una nueva sección similar.
- **Texto**: "Want the Physical Printed Book?"
- **Botón**: "Get Physical Book + Free Digital — $44.00 USD" (usando `formatPrice`).
- **Ruta**: Redirigir a `/products/5-000-spanish-words-with-english-pronunciation-physical`.
- **Precios**: Actualizar los fallbacks de `useCountryTierRouting` para la versión digital a $72.99 USD.

## Detalles Técnicos
- Se utilizará `formatPrice(72.99)` de `useI18n` para que el precio digital se muestre correctamente en la moneda del usuario (EUR, GBP, MXN, etc.).
- Se aplicarán clases de Tailwind `break-words` y `overflow-hidden` en los contenedores de texto.

## Verificación
- Abrir la página física en modo móvil (375px) y verificar que no haya scroll horizontal.
- Confirmar que el botón digital lleve a la ruta correcta.
- Verificar en la página digital que el precio mostrado sea $72.99 USD (o equivalente local).
