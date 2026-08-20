---
name: Optimize Conversion Layout and Translate to English
description: Reduce scroll length by compacting layout and translate all remaining Spanish UI text to English in product and checkout flows.
type: feature
---

## Overview
As requested by the user, we will optimize the high-conversion product page (`ProductDynamic.tsx`) and the checkout flow to be more compact ("juntar hacia arriba") and fully in English.

## Proposed Changes

### Spacing Reduction (Compacting Layout)
- **`src/pages/ProductDynamic.tsx`**:
    - Reduce `main` padding: `pt-4 pb-20` -> `pt-2 pb-10`.
    - Compact Trustpilot badge margin: `mb-6` -> `mb-3`.
    - Reduce main grid gap: `gap-12` -> `gap-8`.
    - Shrink section margins/padding: `mt-24 py-16` -> `mt-12 py-8`.
    - Reduce Look Inside gallery heading margin: `mb-16` -> `mb-8`.
- **`src/pages/Checkout.tsx`**:
    - Reduce container padding: `py-6 md:py-10` -> `py-3 md:py-6` (in both loading skeleton and main content).
    - Compact header vertical padding: `py-2.5 sm:py-3` -> `py-1.5 sm:py-2`.
    - Reduce section gaps: `gap-8` -> `gap-5`.
    - Compact spacing between forms/panels: `space-y-4` -> `space-y-3`.

### English Translation (UI Updates)
- **`src/pages/ProductDynamic.tsx`**:
    - Update `SEO` description: `Descarga digital inmediata` -> `Instant digital download`.
    - Update `LANG` and `FLAG` maps to ensure all language names are in English.
- **`src/pages/Checkout.tsx`**:
    - Update "Producto no encontrado" -> "Product not found".
    - Update "Volver a la tienda" -> "Back to shop".
    - Update "Pedido Mixto" alert -> "Mixed Order".
    - Update toast messages: `Recuperamos tu carrito` -> `Cart recovered`.
- **`src/components/checkout/OrderSummary.tsx`**:
    - Update "¡Cupón aplicado!" -> "Coupon applied!".
    - Update digital access notices: "Obligatorio: ..." -> "Required: ...".
    - Update "Recibirás el acceso inmediato..." -> "Instant access via email after payment."
- **`src/components/checkout/BuyerInfoForm.tsx`**:
    - Update phone validation message: "Si escribes un teléfono..." -> "Phone must be at least 7 digits if provided."
- **`src/components/checkout/PaymentMethodsGroup.tsx`**:
    - Update remaining Spanish payment subtitles (e.g., "Paga con tu cuenta Google", "Paga en tiendas OXXO") to English.
- **`src/components/checkout/CheckoutTestimonials.tsx`**:
    - Update aria-labels: "Anterior" -> "Previous", "Siguiente" -> "Next".
    - Update "Ir al testimonio" -> "Go to testimonial".

## Verification Plan
- Check `ProductDynamic.tsx` (SKU CMB7) to ensure the layout feels tighter and text is in English.
- Go through the checkout process to verify all alerts, summaries, and forms are in English.
- Verify that responsive behavior remains intact on mobile.
