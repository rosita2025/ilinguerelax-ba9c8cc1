# Plan: Checkout UI Cleanup and Currency Transparency

Ensure the checkout experience is clean, removes redundant sections, and provides consistent dual-currency transparency.

## Proposed Changes

### UI Cleanup

#### [OrderSummary.tsx](src/components/checkout/OrderSummary.tsx)
- Remove the redundant "Accepted Methods" section marked with a red X in the user's reference image (lines 327-347).
- Verify the main "Secure Checkout" footer with official logos remains intact at the bottom of the page.

### Currency Transparency

#### [OrderSummary.tsx](src/components/checkout/OrderSummary.tsx) and [PaymentMethodsGroup.tsx](src/components/checkout/PaymentMethodsGroup.tsx)
- Ensure the local currency amount is always visible as the primary price when available.
- Consistently show the USD equivalent reference `(≈ USD $XX.XX)` for all payment methods and in the order summary.
- Fix any logic that might be hiding the local currency for global gateways (Stripe, PayPal, dLocal) to avoid user confusion about total cost.

## Technical Details
- Remove the visual block for `Accepted Methods` inside the `OrderSummary` component to match the user's visual request.
- Refine the `usdSuffix` logic to ensure it doesn't duplicate currency labels (e.g., avoid `USD $USD`).
- Use the established `formatLocalDirect` and `formatCurrencyAmount` patterns for consistent formatting.

## Verification Plan
- **Visual Check:** Confirm the "Accepted Methods" block is gone from the order summary sidebar.
- **Currency Test:** Simulate sessions from different countries (Peru, Mexico, US) and verify that the total shows "Local (≈ $USD)" correctly.
- **Consistency Audit:** Check that the total in the Order Summary matches the totals shown on the payment buttons exactly.
