# Plan - Fix Product Page Loading Failures

The user reported that several product pages are "down" or failing to load. My investigation confirmed that these pages (which use the `ProductDynamic` component) are stuck on a loading spinner. The root cause is likely a `TypeError` occurring in the pricing logic or a failure in the `useLocalCurrency` hook when certain database fields are null or when the product data hasn't fully loaded yet.

## User Review Required

> [!IMPORTANT]
> I found that pages for specific products are failing to load. I will implement a fix to handle missing or incomplete product data gracefully.

## Technical Details

- **Fault Isolation**: The `ProductDynamic` component crashes or stalls if `product` properties are accessed before the state is populated, or if certain `jsonb` fields (`local_prices`, `local_usd_prices`) are null when passed to hooks.
- **Fix Strategy**: 
    1. Update `ProductDynamic.tsx` to include defensive checks for all database-sourced fields.
    2. Add null-safety to `useLocalCurrency.ts` to ensure it returns a valid fallback state even if the database record is incomplete.
    3. Update the `useCardPrice` hook used in product grids to handle `sku` aliases and missing rows without crashing the parent component.
- **Validation**: I will use Playwright to verify that the reported URLs load their content (H1 titles) and that the loading spinner disappears correctly.

## Implementation Steps

### 1. Fix `ProductDynamic` Component
- Add safety checks around `local_prices` and `local_usd_prices` access.
- Ensure the `effectiveUsd` calculation handles edge cases where tier prices are defined as 0 or null.
- Add an explicit "not found" or "error" UI state if the database query fails.

### 2. Update Pricing Hooks
- In `useLocalCurrency.ts`, ensure that `overrides` and `localUsdPrices` are safely cast and handled as optional.
- In `useCardPrice.ts`, improve the robustness of the `format` and `formatOriginal` methods when a `sku` is provided but not found in the local cache.

### 3. Verification
- Run a browser-based check on the 4 problematic URLs to confirm they render correctly.
- Verify that `npm run build` still passes.
