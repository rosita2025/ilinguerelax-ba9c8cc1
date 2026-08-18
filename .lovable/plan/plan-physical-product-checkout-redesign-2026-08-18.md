# Plan - Physical Product Checkout Redesign

Standardize the checkout experience for all physical books (5,000 Words, 8,000 Words, 3,000 Verbs, and Grammar Patterns). All "COMPRAR AHORA" or "Add to Cart" actions on these pages will now use a unified internal checkout flow instead of external links or simple carts.

## User Review Required

> [!IMPORTANT]
> The sticky bar and main buttons on physical book pages will now open a secure, internal checkout modal. This ensures users stay on your site and follow a consistent purchase flow.

- Check if the checkout titles and prices in `PhysicalBookCheckout.tsx` match your expectations for all 5 physical books.
- Confirm if any specific physical products still need to point to external sites (currently, the goal is to unify all to internal checkout).

## Proposed Changes

### Physical Book Pages
- **src/pages/Product5000Book.tsx**: Update `handleAddToCart` to set `physicalCheckoutOpen(true)`. Update the main button and `StickyBuyBar` to trigger this.
- **src/pages/Product8000Book.tsx**: Standardize all three purchase buttons (Standard, Fast Shipping, and Sticky Bar) to use the internal `handleAddToCart`.
- **src/pages/ProductSpanish3000VerbsBook.tsx**: Ensure the pre-order buttons and sticky bar trigger the `PhysicalBookCheckout` modal.
- **src/pages/ProductSpanishGrammarPatterns.tsx**: Verify and ensure the Lavender-themed buttons correctly open the checkout modal.

### Checkout & Components
- **src/components/PhysicalBookCheckout.tsx**:
    - Update the shipping info to be more concise.
    - Ensure all SKUs (`english_5000`, `english_8000`, `spanish_5000`, `spanish_3000_verbs`, `spanish_grammar_patterns`) are handled correctly.
    - Synchronize prices in the order summary with the latest business rules.
- **src/components/StickyBuyBar.tsx**:
    - Optimize the `handleBuy` logic for physical products to ensure it correctly triggers the internal checkout state provided by parent pages.
    - Ensure it doesn't try to navigate to external URLs for these specific SKUs.

## Technical Details
- Use `useState` in each product page to manage the `physicalCheckoutOpen` modal state.
- Pass this state and a setter to the `PhysicalBookCheckout` component.
- Ensure `useCartStore` is used for background logic if needed, but the primary UI should be the Stripe Embedded Checkout within the modal.
- Verify `trackHotmartEvent` or Meta Pixel events are fired correctly when the modal opens (AddToCart).

## Validation Plan
- Manually trigger checkout on each of the 4 physical product pages.
- Verify the `PhysicalBookCheckout` modal appears with the correct book title and price summary.
- Confirm the Stripe iframe loads correctly within the modal.
- Test the sticky bar on mobile and desktop for each product.
