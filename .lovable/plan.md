# Plan - Update Physical Product Checkout to Internal System

The user wants to ensure all physical product pages use the internal checkout system for all "Add to Cart" and "Buy" buttons (including sticky bars). This will ensure that shipping and payment data is collected through our own platform (Stripe, dLocal, PayPal, etc.) instead of external marketplaces.

## Technical Details

1.  **Refactor `ProductSpanish3000VerbsBook.tsx`**:
    *   Ensure all primary buttons call `handleAddToCart`.
    *   Verify `handleAddToCart` triggers `setPhysicalCheckoutOpen(true)`.
    *   Confirm `PhysicalBookCheckout` is present and using the correct book configuration.

2.  **Refactor `ProductSpanishGrammarPatterns.tsx`**:
    *   Ensure all primary buttons call `handleAddToCart`.
    *   Verify `handleAddToCart` triggers `setPhysicalCheckoutOpen(true)`.
    *   Confirm `PhysicalBookCheckout` is present and using the correct book configuration.

3.  **Refactor `Product8000Book.tsx`**:
    *   Replace `handleAddToShopifyCart` calls in main buttons with the internal checkout handler.
    *   Ensure `PhysicalBookCheckout` is correctly integrated.

4.  **Refactor `Product5000Book.tsx`**:
    *   Replace `handleAddToShopifyCart` calls in main buttons with the internal checkout handler.
    *   Ensure `PhysicalBookCheckout` is correctly integrated.

5.  **Refactor `ProductSpanish5000.tsx`**:
    *   Confirm `handleStickyBuy` and main buy buttons trigger the internal checkout.

## Validation

- Verify that clicking any buy button on these pages opens the `PhysicalBookCheckout` dialog.
- Verify that the dialog correctly loads the Stripe/dLocal/PayPal checkout flow.
- Ensure no buttons remain pointing to Amazon or external Shopify URLs.
