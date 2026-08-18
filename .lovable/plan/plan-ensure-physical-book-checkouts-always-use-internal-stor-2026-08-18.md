# Plan: Ensure Physical Book Checkouts Always Use Internal Store

The user noticed that some purchase buttons (specifically on the physical book pages) are still navigating to external payment links (like Stripe's hosted checkout directly or other external URLs) instead of staying within the internal `checkouts/:sku` flow. We need to ensure that every "Add to Cart" and "Buy Now" button, as well as the `StickyBuyBar`, on physical product pages correctly triggers the internal `PhysicalBookCheckout` component or navigates to the internal checkout route.

## User Review Required

> [!IMPORTANT]
> The current implementation for physical books uses the `PhysicalBookCheckout` component (an embedded Stripe modal). The user requested to "always use checkouts/:sku". 
> I will verify if the user prefers the internal `checkouts/:sku` route (which handles local payments like Yape/Plin/dLocal) for physical books as well, or if the Stripe-only `PhysicalBookCheckout` modal is correct for physical shipping.
> 
> **Proposed Action:** I will ensure all buttons trigger the internal `PhysicalBookCheckout` modal for physical books, as this is the current established pattern for handling shipping addresses, until the user specifies otherwise.

## Proposed Changes

### Frontend Improvements

#### `src/pages/ProductSpanish3000VerbsBook.tsx`
- Verify that `handleAddToCart` and `StickyBuyBar`'s `onBuyClick` both trigger the internal `PhysicalBookCheckout` modal.
- Ensure no hardcoded external links are present in the button logic.

#### `src/pages/ProductSpanishGrammarPatterns.tsx`
- Ensure consistency with the internal checkout modal trigger.
- Remove any legacy Shopify or Amazon routing logic that might still be active.

#### `src/pages/Product5000.tsx` & `src/pages/Product8000.tsx`
- These digital products were already mostly unified, but I will double-check that the `StickyBuyBar` correctly uses the internal route without any external fallback.

#### `src/components/StickyBuyBar.tsx`
- Refine the `isOnCheckout` detection to be more robust.
- Ensure the `onBuyClick` prop is always prioritized over `buyUrl` to prevent unexpected navigation.

## Technical Details

- **SKU Mapping:** Ensure the `sku` passed to `StickyBuyBar` matches the internal `PhysicalBookKey` used in `PhysicalBookCheckout.tsx`.
- **Checkout Detection:** Update `isOnCheckout` in `StickyBuyBar.tsx` to include both `/checkout` and `/checkouts` paths.
- **Button Logic:** Standardize `handleBuy` functions to consistently use `setPhysicalCheckoutOpen(true)` for physical products.

## Validation Plan

1. **Manual Preview Check:** Visit physical book pages and click all "Buy" buttons to verify the modal opens.
2. **Sticky Bar Check:** Scroll down to trigger the sticky bar and verify its button behavior.
3. **URL Check:** Inspect the console/network to ensure no requests are being made to external checkout domains (stripe.com hosted pages) before the internal modal is displayed.
