---
name: Translate WhatsApp Reviews to English
description: Translate the WhatsApp reviews section (ResenasWhatsAppCoreano) to English for verified buyers.
type: feature
---

## Overview
Translate UI text and review summaries in `src/components/ResenasWhatsAppCoreano.tsx` from Spanish to English, as requested by the user ("compradores verificads debe usar ingles por favor").

## Proposed Changes

### Frontend Improvements
- Update `resenas` data array:
    - `contacto`: "Verified Buyer", "Verified Female Buyer", "Verified Student".
    - `pais`: Maintain original country name + emoji.
    - `resumen`: Translate Spanish review text to English.
- Update UI labels:
    - "Reseñas reales por WhatsApp" -> "Real WhatsApp Reviews"
    - "Lo que dicen nuestras compradoras verificadas" -> "What our verified buyers are saying"
    - "Reseñas verificadas" -> "Verified reviews"
    - "Conversaciones auténticas atendidas por..." -> "Authentic conversations attended by..."
    - "Desliza para ver más" -> "Slide to see more"
    - "Datos personales protegidos" -> "Personal data protected"
    - "WhatsApp verificado" -> "WhatsApp verified"
    - "Supervisora Rosa & Asistente Crady" (Stay as names)
    - "Por privacidad, ocultamos nombres..." -> "For privacy, we hide names and numbers of buyers. Real verified screenshots."
    - Button aria-labels: "Anterior" -> "Previous", "Siguiente" -> "Next".

## Verification Plan
- Check the preview on routes that use this component (e.g., SKU CMB7).
- Verify all Spanish text has been replaced with English equivalents.
