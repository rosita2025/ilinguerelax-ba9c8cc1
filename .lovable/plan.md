# Plan de Corrección del Footer y Botones Flotantes

El usuario reporta que el Footer tiene fondo blanco con letras blancas (invisible) y solicita restaurar el fondo oscuro, limpiar la estructura móvil, ajustar la posición de los botones flotantes y traducir contenidos específicos al inglés para el producto "5,000 Spanish Words".

## Cambios Realizados

### Frontend

#### Componente Footer (`src/components/Footer.tsx`)
- Se restaurará el fondo oscuro `#111827` en el contenedor principal.
- Se actualizarán las clases de los títulos (`h3`) para que sean `text-white font-bold text-base mb-3`.
- Se actualizarán los enlaces (`a` y `Link`) para que sean `text-gray-400 hover:text-white text-sm transition-colors block py-1`.
- Se simplificará la estructura del grid a una sola columna en móvil usando `grid-cols-1 md:grid-cols-4`.
- Se asegurará de que el texto sea visible y no use colores semánticos que dependan del tema (shadcn) si están causando problemas de contraste.

#### Botones Flotantes (`src/components/WhatsAppButton.tsx` y `src/components/ScrollToTop.tsx`)
- Se ajustará la posición fija a `bottom-[115px]` para que floten exactamente sobre la barra de compra (que tiene `bottom-0`).
- Se aumentará el `z-index` a `50` para asegurar visibilidad.

#### Traducción y Contenidos
- Se verificará que las traducciones al inglés en `src/components/Footer.tsx` coincidan con lo solicitado:
  - CATEGORIES (All Products, English, Spanish, Other Languages)
  - SERVICES (About Us, Blog, FAQ, Shipping & Delivery, Terms & Conditions, Privacy Policy)
  - COMMUNITY (Instagram, Facebook, WhatsApp)

## Detalles Técnicos
- El Footer usa `text-primary-foreground` actualmente, lo cual en temas claros/oscuros puede fallar si no está bien definido. Se forzará `text-gray-400` y `text-white` para el fondo `#111827`.
- Se eliminarán paddings excesivos en móvil que puedan estar rompiendo la rejilla.

## Validación
- Se verificará visualmente en la ruta `/products/5-000-spanish-words-with-english-pronunciation-physical` que el footer sea legible.
- Se comprobará que los botones de WhatsApp y Scroll-to-Top no se solapen con la Sticky Bar.
