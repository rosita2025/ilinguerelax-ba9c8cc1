---
name: Checkout and Pricing Update
description: Update sticky buy bars, individual product prices, and the checkout process for multi-regional USD support.
type: feature
---

## Summary
The goal is to update the application to support multi-regional USD pricing across sticky bars, product pages, and the checkout flow, ensuring consistency and local currency visibility.

## Technical Details

### Pricing Logic
- Prioritize `local_usd_prices` overrides from the database for regional USD pricing.
- Ensure automated exchange rate synchronization via Supabase Edge Functions.
- Implement manual exchange rate markups (e.g., -5% for COP, -2% for MXN) to lower perceived costs in specific regions.

### Checkout Component (`src/components/checkout/OrderSummary.tsx`)
- Resolve the build error in `src/components/checkout/OrderSummary.js` (which appears to be a duplicate or build artifact).
- Ensure the `OrderSummary` correctly displays the Base USD price alongside the local currency conversion.
- Verify the currency breakdown section shows correct exchange rates and regional adjustments.

### Sticky Buy Bar (`src/components/StickyBuyBar.tsx`)
- Update the pricing display to reflect regional USD overrides.
- Ensure Meta Pixel tracking fires correctly with normalized USD values (2 decimal precision).

### Product Pages (`src/pages/ProductDynamic.tsx`, etc.)
- Update product pricing displays to respect the multi-regional USD tiering.

## Constraints & Preferences
- Always show USD reference (e.g., `≈ USD $XX.XX`) when local currency is displayed.
- Use 2-decimal precision for USD values.
- Maintain consistency across all payment gateways (Stripe, PayPal, dLocal Go).
