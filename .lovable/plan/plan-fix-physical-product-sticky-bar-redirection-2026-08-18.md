# Plan - Fix Physical Product Sticky Bar Redirection

The user wants to ensure that all physical products use the internal checkout system instead of external links (like Amazon or Shopify) in the `StickyBuyBar`.

## Technical Details

1.  **Modify `ProductSpanish3000VerbsBook.tsx`**:
    *   Add `PhysicalBookCheckout` component and state.
    *   Update `handleAddToCart` and `StickyBuyBar`'s `onBuyClick` to trigger the internal checkout instead of redirecting to Amazon.
2.  **Modify `ProductSpanishGrammarPatterns.tsx`**:
    *   Add `PhysicalBookCheckout` component and state.
    *   Update `handleAddToCart` and `StickyBuyBar`'s `onBuyClick` to trigger the internal checkout instead of redirecting to Amazon.
3.  **Audit other Physical Products**:
    *   `ProductSpanish5000.tsx`, `Product8000Book.tsx`, and `Product5000Book.tsx` already appear to have `PhysicalBookCheckout` integrated, but I will verify they are correctly using the internal checkout for the `StickyBuyBar`.

## Proposed Changes

### Physical Product Pages
- `src/pages/ProductSpanish3000VerbsBook.tsx`
- `src/pages/ProductSpanishGrammarPatterns.tsx`
- `src/pages/Product8000Book.tsx`
- `src/pages/Product5000Book.tsx`
- `src/pages/ProductSpanish5000.tsx`

For each, I will ensure:
- `PhysicalBookCheckout` is present and functional.
- `StickyBuyBar` calls a handler that opens the `PhysicalBookCheckout` dialog.
- No external `buyUrl` is passed to `StickyBuyBar` for physical products.

---

**Note**: I will add the missing `PhysicalBookCheckout` dialogs to the two pre-order pages (3000 Verbs and Grammar Patterns) and ensure they point to the correct internal book keys.
