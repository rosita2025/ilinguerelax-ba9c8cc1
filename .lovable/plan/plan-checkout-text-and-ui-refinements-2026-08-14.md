# Plan: Checkout Text and UI Refinements

The user wants to refine the text in the Cart Drawer and internationalization files to better guide customers through the physical/digital checkout process.

## User Review Required

> [!IMPORTANT]
> The text for "Configure shipping" has been expanded to "Configurar envío e ir al checkout" in Spanish to provide more context. Please verify if this matches the desired tone.

## Proposed Changes

### Internationalization
- Update `src/i18n/checkoutUI.ts` for all languages to ensure "Configure shipping" (and its translations) clearly indicates that it leads to the checkout page.

### Cart Drawer
- Remove the redundant hardcoded "Ir al checkout" text that appeared below the dynamic label.
- Ensure the dynamic button text correctly reflects whether the cart contains physical items (requiring shipping configuration) or only digital ones.

## Technical Details
- **File**: `src/i18n/checkoutUI.ts` - Editing `configureShipping` key in `es`, `en`, `pt`, and `fr` objects.
- **File**: `src/components/CartDrawer.tsx` - Cleaning up the button content to rely solely on the i18n dynamic labels.

---

*Note: I have already applied the core fixes to `src/components/CartDrawer.tsx` and the Spanish translation in `src/i18n/checkoutUI.ts` in the previous step. I will now proceed with the remaining translations and final cleanup.*
