# Plan: Implement "Add to Cart" and Checkout for New Physical Products

The goal is to ensure all physical product pages (5,000 Palabras, 8,000 Palabras, 3,000 Verbs, and Grammar Patterns) correctly use the internal checkout system for both the main "Buy" buttons and the "Sticky Buy Bar".

## Technical Details

- **Internal Checkout Logic**: All physical product CTA buttons should trigger the `PhysicalBookCheckout` modal by setting `physicalCheckoutOpen(true)`.
- **Sticky Buy Bar Integration**: The `StickyBuyBar` component on these pages must have its `onBuyClick` prop linked to the same `handleAddToCart` function that opens the physical checkout modal.
- **Cart Store Synchronization**: While these products currently use a modal-based checkout, I will ensure they correctly interact with `useCartStore` if applicable, or consistently use the `PhysicalBookCheckout` component as established in recent updates.
- **Verification**: I will check that each button click on the preview leads to the checkout flow and doesn't redirect to external platforms like Hotmart or Amazon.

## Proposed Changes

### Physical Product Pages
- **src/pages/Product5000Book.tsx**: Verify `handleAddToCart` triggers `setPhysicalCheckoutOpen(true)` and that the `StickyBuyBar` uses `onBuyClick={handleAddToCart}`.
- **src/pages/Product8000Book.tsx**: Ensure both "COMPRAR AHORA" buttons (Shopify and International) trigger the internal checkout instead of just internal routing or external links.
- **src/pages/ProductSpanish3000VerbsBook.tsx**: Confirm `StickyBuyBar` and main CTA are correctly wired to `handleAddToCart`.
- **src/pages/ProductSpanishGrammarPatterns.tsx**: Confirm the recent fix is applied and consistent.

### Components
- **src/components/StickyBuyBar.tsx**: No changes needed to the component itself, just ensuring correct usage in pages.

## Verification Plan
1.  **Manual Test**: Click "Comprar Ahora" on `Product5000Book.tsx` and `Product8000Book.tsx` in the preview to confirm the checkout modal appears.
2.  **Sticky Bar Test**: Scroll down on these pages and click the sticky button to confirm it also opens the modal.
3.  **Code Audit**: Ensure no `href` or `window.location.assign` calls are bypassing the internal checkout for physical items.
