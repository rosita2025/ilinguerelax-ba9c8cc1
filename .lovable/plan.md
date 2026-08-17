# Plan: Visual text and content updates for Spanish Mastery System

Apply requested visual text edits and content updates to `src/pages/ProductSpanish5000Digital.tsx` to align with the "Spanish Mastery System" branding and specific feature counts.

## Changes

### `src/pages/ProductSpanish5000Digital.tsx`

- **Hero & Product Info**: 
  - Update bonus text to mention "Escrito humano", "marca registrada", "pago seguro".
  - Refine feature lists to match the new counts:
    - "5,000 Spanish Words + Pronunciation 250 Pages" (changed from generic list).
    - "Complete A1–C1 Grammar Guide — 250 Pages" (updated from 327).
- **"What's Included" Section**:
  - Update counts for the words and grammar guide to 250 pages each.
  - Ensure all requested bullet points are present.

## Technical details
- Minimal text replacements in the JSX to preserve all existing logic (regional pricing, lazy loading, hooks).
- No functional changes to the checkout or i18n logic.

## Verification
- Visual inspection of the preview page at `/products/5-000-spanish-words-with-english-pronunciation-digital`.
- Confirm counts (250 pages) and new labels ("Escrito humano", etc.) are visible.
