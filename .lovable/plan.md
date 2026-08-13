# Plan - Separate Digital and Physical Checkout UX

Improve the checkout experience by distinguishing between digital and physical products, ensuring appropriate data collection (shipping for physical) and a clear, separate summary.

## Proposed Changes

### 1. Checkout Store Enhancement
- Update `PruebaStore` in `src/stores/checkoutStore.ts` to include a helper `hasPhysicalItems` selector for easy access across components.

### 2. Digital vs Physical Product Separation in Checkout Page
- **src/pages/Checkout.tsx**:
    - Update the main layout to visually separate digital items from physical ones in the summary if both coexist (unlikely per current usage, but good for robustness).
    - Ensure `is_physical` is correctly handled for all items in the cart.

### 3. Dynamic Shipping Form in Buyer Info
- **src/components/checkout/BuyerInfoForm.tsx**:
    - Refine the visibility logic for the shipping address section.
    - Add a clear header: "Dirección de Envío (Solo para productos físicos)" / "Shipping Address (Physical products only)".
    - Ensure that if only digital products are present, no shipping fields are rendered, maintaining a "clean" digital checkout.

### 4. Order Summary Visual Improvements
- **src/components/checkout/OrderSummary.tsx**:
    - Add a "Shipping" line item to the price breakdown.
    - For digital products: "Envío: Gratis (Entrega Digital)".
    - For physical products: Show the calculated shipping cost (based on the $8 standard / Free > $50 logic already in the edge function).

### 5. Cart Drawer Clarity
- **src/components/CartDrawer.tsx**:
    - Add labels to items in the cart indicating whether they are "Digital" or "Físico".
    - Update the "Continue" button text based on the cart contents (e.g., "Continuar al pago" vs "Configurar envío").

## Technical Details
- The existing `is_physical` flag in `digital_products` table is already used; we will ensure it's propagated correctly through the `useCheckoutPruebaStore`.
- The shipping calculation logic ($8 for <$50, Free for >=$50) will be mirrored in the frontend `OrderSummary` for transparency, matching the `create-physical-checkout` edge function.
- Validation logic in `isBuyerValid` will remain strict for physical items (requiring address) and lean for digital items.

## Verification Plan
- **Automated Tests**:
    - Simulate adding a digital product: verify no shipping fields appear.
    - Simulate adding a physical book: verify shipping fields appear and are required.
    - Simulate a bundle: verify shipping fields appear.
- **Visual Check**:
    - Confirm the price breakdown correctly reflects the shipping cost.
    - Confirm the Cart Drawer clearly identifies product types.
