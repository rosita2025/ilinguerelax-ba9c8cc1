# Plan: $1 USD Test Purchase Capability

The user wants to test a PayPal purchase for exactly $1 USD. To achieve this safely and without modifying live product prices, I will implement a new "Fixed Total" coupon code logic that forces the final checkout total to $1 USD regardless of the items in the cart.

## Proposed Changes

### 1. Store Updates
- Modify `src/stores/checkoutStore.ts` to include `FIXED1` in the `FIXED_TOTAL_COUPONS` object with a value of `1`.
- This code is already used to calculate the necessary discount percentage to reach a target total.

### 2. Edge Function Configuration
- Update `supabase/functions/_shared/catalogPricing.ts` (if it exists) to include `FIXED1: 1` in the backend fixed total map to ensure server-side validation matches the frontend.

### 3. Verification
- Verify that applying the coupon `FIXED1` in the checkout page results in a $1.00 USD total.
- Verify that the PayPal button initiates a payment for $1.00 USD.

## Technical Details
- **Coupon Code:** `FIXED1`
- **Target Total:** $1.00 USD
- **Logic:** The `applyCoupon` method in `checkoutStore.ts` calculates a `couponPercent` dynamically based on the current subtotal to arrive at the target fixed total.
