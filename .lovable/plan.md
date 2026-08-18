# Plan de Rediseño: Coreano Relax (Alta Conversión)

Rediseño integral de la página de producto de Coreano para optimizar la conversión de tráfico frío (Ads), centrada en claridad, beneficios y prueba social.

## Cambios Visuales y de Contenido

### 1. Hero (Primera Pantalla)
- **Estructura:** Dos columnas en desktop.
- **Izquierda:** Mockup grande del producto + vista previa del interior (Coreano | Pronunciación | Español).
- **Derecha:** 
  - Etiqueta: `🇰🇷 COREANO PARA HISPANOHABLANTES`.
  - Título: `Aprende las 2,000 palabras esenciales del coreano 🇰🇷`.
  - Subtítulo: Foco en Hangul, español y pronunciación fácil.
  - Lista de 4 beneficios clave con checks.
  - Precio destacado: `US$12`.
  - Botón CTA: `QUIERO APRENDER COREANO`.
  - Footer de confianza: Pago seguro, acceso inmediato, producto digital.

### 2. Secciones de Valor
- **Bonos:** Presentación clara de 2 bonos gratuitos (100 Expresiones + Ejercicios de Hangul) etiquetados como `INCLUIDOS CON TU COMPRA`.
- **Actualizaciones:** Sección destacada sobre actualizaciones gratuitas.
- **¿Qué recibes?:** Grid visual con 6 tarjetas (2,000 palabras, Hangul, Español, Pronunciación, Categorías, Bonos).
- **"Cómo funciona":** Muestra real del contenido tipo "página de PDF" (Coreano → Pronunciación → Español).
- **Categorías:** Grid de iconos/etiquetas con las categorías temáticas incluidas (Saludos, Familia, Comida, etc.).

### 3. Segmentación y Confianza
- **¿Es para ti?:** Lista de perfiles ideales (Principiantes, fans de K-dramas/K-pop, viajeros).
- **Testimonios:** Integración de `ResenasWhatsAppCoreano` con las capturas de Rosa y Crady.
- **Garantía:** Sello de 7 días de satisfacción.

## Detalles Técnicos
- **SKU:** `1-000-palabras-esenciales-para-aprender-coreano` (se actualizará a 2,000 en el contenido).
- **Rutas:** Mantener `/products/1-000-palabras-esenciales-para-aprender-coreano` para no romper enlaces de anuncios existentes, pero actualizando el contenido a la oferta de 2,000 palabras.
- **Componentes:** 
  - Crear `src/components/CoreanoHeroRedesign.tsx`.
  - Crear `src/components/CoreanoFeaturesGrid.tsx`.
  - Crear `src/components/CoreanoBonuses.tsx`.
  - Actualizar `src/pages/ProductCoreanoRelax.tsx` para usar la nueva estructura.
- **Precios:** Ajustar `CHECKOUT_CATALOG` para reflejar el precio de $12 para este producto.

## SEO
- Meta tags optimizados para "Aprender vocabulario coreano PDF" y "Coreano para principiantes".
- JSON-LD de producto actualizado con el nuevo precio y oferta.
