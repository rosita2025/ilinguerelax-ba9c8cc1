# Plan - Checkout Delivery Address for Physical Products

The user wants to add a "Delivery Address" (Dirección de envío) section to the internal checkout when physical products are in the cart. Currently, the checkout primarily handles digital products (collecting only name, email, and optional WhatsApp). For physical books (English 5,000, 8,000, and Spanish 5,000), we need to collect the shipping address directly in the checkout UI if the user is purchasing them through the internal flow.

## User Review
- Add a "Delivery Address" section to the checkout.
- Ensure it includes fields for Address, City, State/Province, and Postal Code.
- Only show this section if at least one item in the cart is physical.

## Technical Details
- **Identify Physical Items**: Add a helper in `src/stores/checkoutStore.ts` or use existing product data to determine if an item is physical.
- **Store Address Data**: Update `useCheckoutPruebaStore` in `src/stores/checkoutStore.ts` to include `shippingAddress` in the `buyer` info or as a top-level state.
- **UI Component**: Create or update `src/components/checkout/BuyerInfoForm.tsx` to include the address fields.
- **Conditional Rendering**: Use the physical item check to toggle the visibility of the address form.
- **Validation**: Update `isBuyerValid` to require address fields if physical items are present.
- **International Shipping**: Support the same countries as the Stripe physical checkout (USA, Canada, UK, Australia, New Zealand).
- **Update i18n**: Add translations for address-related labels in `src/i18n/checkoutUI.ts`.

## Impacted Files
- `src/stores/checkoutStore.ts`: Add shipping address state and persistence.
- `src/i18n/checkoutUI.ts`: Add address field translations.
- `src/components/checkout/BuyerInfoForm.tsx`: Add the address fields UI.
- `src/components/checkout/OrderSummary.tsx`: (Optional) Show shipping info if relevant.
