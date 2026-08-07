# Plan - Remove Country Simulator and Clean Up Testing UI

The user wants to remove the "country simulator" (simulador de país) testing UI from the product pages. This UI was used to verify how different regions see prices and buttons, but it is no longer needed in the public-facing or final product view.

## Proposed Changes

### 1. Product Page Clean-up
- Edit `src/pages/ProductDynamic.tsx` to remove the entire `Simulador de país (pruebas)` block (lines 296-339 and related logic).
- Remove the `simCountry` state and references to `COUNTRY_OPTIONS`.
- Ensure buttons and pricing logic use the real `local.country` (from IP detection) exclusively.

### 2. Validation
- Verify that `ProductDynamic.tsx` still correctly displays the buy button and local pricing based on the visitor's IP.
- Ensure the `?country=XX` URL override (handled by `useRegionTier.ts`) still works for internal debugging without needing the on-page simulator.

## Context Note
The user mentioned "IP real: PE", which matches the behavior of the existing `useRegionTier` hook when detecting a Peruvian IP.
