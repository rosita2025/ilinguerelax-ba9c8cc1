# Redesign Coreano Relax - 1,000 Words & Mapas Mentales

Adjust the Korean product landing page to emphasize the 1,000 words launch while retaining the "+100 Mapas Mentales" branding and promising future updates to 2,000 words.

## User Requirements
- Title: **1,000 Palabras Esenciales para Aprender Coreano**.
- Retain: **+100 Mapas Mentales**.
- Badge: **NUEVO LANZAMIENTO**.
- Promise: Free update to **2,000 words**.
- Trust: Highlight real **WhatsApp testimonials** from Rosa and Crady.
- Price: Keep at **$12 USD** (already updated, but verify catalog naming).

## Proposed Changes

### Configuration
#### [src/config/checkoutCatalog.ts]
- Update the product name to "Coreano Sin Complicaciones · 1,000 Palabras Esenciales (PDF)".
- Update description to "1,000 palabras esenciales + 100 mapas mentales para aprender coreano (Hangul, pronunciación y español)".

### Components
#### [src/components/coreano/CoreanoHeroRedesign.tsx]
- Update main title to "Aprende las 1,000 palabras esenciales del coreano 🇰🇷".
- Add "NUEVO LANZAMIENTO" badge alongside the "COREANO PARA HISPANOHABLANTES" badge.
- Add "Incluye +100 Mapas Mentales" in the benefit list.
- Add a text notice: "¡Recibe actualización GRATIS a 2,000 palabras próximamente!"
- Ensure the mockup alt text is updated.

#### [src/components/coreano/CoreanoFeaturesGrid.tsx]
- Change the first feature card from "2,000 PALABRAS" to "1,000 PALABRAS".
- Ensure "+100 MAPAS MENTALES" is featured or mentioned clearly in descriptions.

#### [src/components/coreano/CoreanoUpdates.tsx]
- Specifically mention the upcoming expansion from 1,000 to 2,000 words as a free bonus for current buyers.

#### [src/components/ResenasWhatsAppCoreano.tsx]
- Verify it prominently mentions "Supervisora Rosa" and "Asistente Crady".
- Ensure the WhatsApp captures are clearly visible.

### Page Implementation
#### [src/pages/ProductCoreanoRelax.tsx]
- Update SEO metadata: title and description.
- Ensure `ResenasWhatsAppCoreano` is placed strategically to address trust concerns.
- Update `handleBuyStore` item name and description to match the 1,000 words focus.

## Technical Details
- All text updates will be in Spanish as requested.
- Use existing Tailwind tokens for styling.
- Maintain responsiveness across all components.
