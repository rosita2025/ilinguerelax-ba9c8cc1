# Plan: Unify Spanish 5,000 Physical Book Checkout

The user wants to ensure all physical book pages, specifically including the "Spanish Mastery System: 5,000 Essential Words" (Spanish version of the 5,000 words book), use the internal checkout system (`/checkouts/:sku`) rather than external links.

## Proposed Changes

### 1. Update `ProductSpanish5000.tsx`
- Ensure `handleBuyNow` and `handleStickyBuy` trigger the `PhysicalBookCheckout` modal.
- Verify the `PhysicalBookCheckout` component is correctly placed and receives necessary props.

### 2. Update `ProductSpanish5000Digital.tsx`
- The user mentioned "5,000 spanish relax es el libro fisico". I need to check if this digital page also needs a link to the physical version or if it's already correct.
- Currently, this page seems to be for the Digital version, but it might need to link to the Physical version's internal checkout if a "Physical" option is presented.

### 3. Verify Other Physical Book Pages
- `src/pages/Product5000Book.tsx` (English version)
- `src/pages/Product8000Book.tsx` (English version)
- `src/pages/ProductSpanishGrammarPatterns.tsx`
- Ensure all these pages are fully transitioned to the internal checkout as per previous instructions.

## Technical Details
- Use `setPhysicalCheckoutOpen(true)` to open the modal.
- Ensure the `PhysicalBookCheckout` component is imported and used at the bottom of the `main` or `section` tags.
- Verify SKU mapping in `PhysicalBookCheckout.tsx` for `spanish_5000`.

## Validation Plan
- Manually check the "COMPRAR AHORA" / "BUY NOW" buttons on these pages to ensure they open the internal modal.
- Verify no external redirects to Hotmart or Amazon are triggered for physical products.
