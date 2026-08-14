# Plan - Fix Dynamic Admin Pricing Labels

The user reported that the USD reference labels in the admin pricing grid are "frozen" (e.g., showing `Ref: $27 USD` even when the base price is different). I will fix this by ensuring the reference labels and suggested prices in the admin product edit page update in real-time as the user types the Base USD price.

## Proposed Changes

### Frontend (Admin)

#### `src/pages/AdminProductEdit.tsx`
- Ensure the `price_usd` state change immediately propagates to the mapping function that renders the currency grid.
- Verify that `baseUsdRef` and `regionPrice` are calculated using the live `product.price_usd` state.

## Technical Details
- The logic inside the `.map()` function for currencies currently calculates `regionPrice` and `baseUsdRef`. 
- I will verify if there's any memoization or stale closures preventing the update.
- I will ensure `product.price_usd` is correctly tracked as a dependency if any `useMemo` is used, or simply ensure it's accessed directly from state during render.

## Verification Plan

### Automated Tests
- Run a Playwright script to:
  1. Navigate to a product edit page.
  2. Change the "Base USD" input value.
  3. Verify that the `(Ref: $XX.XX USD)` labels in the grid update to match the new value.
  4. Verify that the "Sug: YY.YY" buttons also update their values.

### Manual Verification
- Visually confirm in the admin preview that typing in the Base USD price field immediately updates the reference labels below.
