# Plan: Optimize Meta Pixel Tracking & Cleanup Redundant Events

The user reported duplicate Facebook Pixel events (specifically `AddToCart` and `InitiateCheckout`) and wants to strictly control when these fire. The goal is to only fire pixel events for traffic reaching our internal `/checkouts/:sku` pages while removing tracking from buttons that lead to Hotmart or general "Add to Cart" actions that might be double-counted.

## Proposed Changes

### 1. `src/hooks/useMetaPixel.ts`
- Modify `hasPixelConsent` to strictly allow events ONLY when coming from paid traffic (`isMetaPaidTraffic`) AND NOT being internal/admin traffic.
- Update tracking functions to ensure they don't fire if the target is an external provider (like Hotmart) that already has its own pixel embedded.

### 2. `src/components/StickyBuyBar.tsx`
- Remove the internal `trackHotmartEvent("AddToCart", ...)` from the `handleBuy` function. 
- The pixel event should only be triggered if we land on our checkout page, which is already handled in `Checkout.tsx` or via the `trackHotmartEvent` call within `handleBuy` only for internal routes.
- **Action**: Refine the conditional in `handleBuy` to ensure `AddToCart` is ONLY fired when navigating to internal `/checkout` routes, never for external links.

### 3. `src/stores/cartStore.ts` & `src/stores/checkoutStore.ts`
- Remove `trackHotmartEvent('AddToCart', ...)` from the store logic. 
- Tracking should happen in the UI layer (page components) to avoid firing on every state change or background sync.

### 4. `src/pages/Checkout.tsx`
- Ensure `InitiateCheckout` is the only primary event fired when the page loads.
- Verify that it only fires once per session/SKU to prevent duplicates on refresh.

### 5. `src/pages/ProductDynamic.tsx`
- Ensure `ViewContent` is fired correctly but check if it's being duplicated by the `StickyBuyBar`.

## Validation Plan
1. **Pixel Helper**: Use the Facebook Pixel Helper browser extension (via Playwright or manual check) to verify:
   - `PageView` fires once.
   - `AddToCart` fires ONLY when clicking a button that leads to `/checkouts`.
   - `InitiateCheckout` fires ONLY when landing on `/checkouts`.
   - No events fire for Hotmart-destined clicks (since Hotmart fires their own).
2. **Logs**: Check `funnel_events` in Supabase to ensure clean, non-duplicated flow.

