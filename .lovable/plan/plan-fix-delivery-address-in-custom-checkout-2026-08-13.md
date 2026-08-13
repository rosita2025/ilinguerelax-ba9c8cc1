# Plan - Fix Delivery Address in Custom Checkout

The user reported that the "Delivery Address" section is not working in the custom checkout (`/checkouts/:sku`). Based on previous context, this section should automatically appear when physical products are in the cart, but it seems there might be a regression or missing logic in how the `isPhysical` flag is handled or how the form is rendered.

## User Review Required

> [!IMPORTANT]
> I will verify if the shipping address fields are correctly appearing for physical products (like "Inglés Relax 5,000 Palabras - Libro Físico") and ensure the data is correctly saved to the checkout store for payment processing.

## Proposed Changes

### Checkout Store
- Verify `isPhysical` property in `PruebaItem` and ensure it's correctly persisted.
- Ensure `BuyerInfo` in `src/stores/checkoutStore.ts` has all required shipping fields.

### Buyer Info Form
- Debug `src/components/checkout/BuyerInfoForm.tsx` to ensure the `hasPhysicalItems` check is working correctly.
- Ensure the shipping address section (Line 263 onwards) is visible when physical items are present.
- Verify validation logic `isBuyerValid` handles physical fields correctly.

### Checkout Page
- Ensure `src/pages/Checkout.tsx` correctly identifies physical products from the database (`is_physical` column) and passes the flag to the store.

### Payment Integration
- Verify that `PaymentMethodsGroup.tsx` respects the `valid` state from `BuyerInfoForm` before allowing payment.

## Technical Details

- The `hasPhysicalItems` flag is calculated as `items.some(i => i.isPhysical)`.
- Physical products are identified in Supabase by the `is_physical` boolean in the `digital_products` table.
- Shipping address fields are: `address`, `city`, `state`, `zip`, `country`.
- Supported shipping countries are currently limited to: US, CA, GB, AU, NZ.

## Verification Plan

### Automated Tests
- Run a Playwright script to:
  1. Navigate to a physical product checkout (e.g., `/checkouts/5-000-palabras-libro-fisico`).
  2. Verify the "Dirección de envío" section is visible.
  3. Verify that the "Comprar" button is disabled until address fields are filled.
  4. Verify that filling the fields enables the payment methods.

### Manual Verification
- Check the browser console for any RLS errors or state synchronization issues when loading physical products.
