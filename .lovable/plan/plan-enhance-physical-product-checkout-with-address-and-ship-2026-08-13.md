# Plan: Enhance Physical Product Checkout with Address and Shipping Costs

The user wants to improve the physical book checkout process by explicitly including address fields, country selection, and clear shipping costs. Since we are using Stripe's Embedded Checkout, we need to ensure the `shipping_address_collection` is correctly configured and the UI reflects these costs clearly.

## User Review Required

> [!IMPORTANT]
> The checkout currently supports shipping to: **USA, Canada, UK, Australia, and New Zealand**. If you need to add more countries, please let me know.

## Technical Details

### 1. Stripe Checkout Configuration
Update `supabase/functions/create-physical-checkout/index.ts` to:
- Ensure `shipping_address_collection` is active (already there, but confirm `allowed_countries`).
- Ensure `shipping_options` are properly configured with standard and free tiers.
- Add `phone_number_collection: { enabled: true }` to the Stripe session for delivery purposes.

### 2. Frontend Enhancements
Update `src/components/PhysicalBookCheckout.tsx`:
- Add a visual breakdown of the order (Price + Shipping = Total) in the sidebar so the user sees the cost *before* the Stripe form loads.
- Add a "Paso 1: Dirección y Pago" header to the Stripe section.

### 3. Product Page Updates
Refine `src/pages/Product5000Book.tsx`, `src/pages/Product8000Book.tsx`, and `src/pages/ProductSpanish5000.tsx` to:
- Ensure the shipping cost ($8 USD) is consistently displayed near the "Comprar" button.
- Add a small "Calculado al finalizar" note for clarity.

## Proposed Changes

### Backend (Edge Function)
- `supabase/functions/create-physical-checkout/index.ts`: Enable phone number collection and verify shipping rules.

### Frontend (Components)
- `src/components/PhysicalBookCheckout.tsx`:
    - Add an "Order Summary" section in the sidebar.
    - Show standard shipping ($8) and conditional free shipping ($0 if >$50).
- `src/pages/Product5000Book.tsx` & siblings:
    - Update the price display to be even more explicit about shipping.
