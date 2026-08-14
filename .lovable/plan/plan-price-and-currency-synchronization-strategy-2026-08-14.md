# Plan: Price and Currency Synchronization Strategy

The user wants to ensure that the prices set in the admin panel (`/admin/products/:sku`) are correctly used in the checkout flow for Stripe, dLocal Go, and PayPal, prioritizing local currency when available and falling back to USD correctly.

## Proposed Changes

### 1. Synchronization Logic
- Ensure `src/components/checkout/PaymentMethodsGroup.tsx` remains the source of truth for UI display, already using `sumItemsLocal` to honor admin overrides.
- Verify that `supabase/functions/_shared/catalogPricing.ts` (specifically `localTotalFromPricing`) correctly mirrors the frontend's `sumItemsLocal` logic to prevent "checkout total" vs "gateway amount" mismatches.
- Harden the "conversion to USD" messaging to be clear for all payment methods.

### 2. Edge Function Updates
- **`dlocal-create-payment`**: Ensure it uses the synchronized `localTotalFromPricing` logic to set the `amount` in the local currency before sending to dLocal Go.
- **`paypal-create-order`**: Verify it uses the synchronized `localTotalFromPricing` logic when a local currency (supported by PayPal like MXN, BRL) is detected.
- **`create-checkout-prueba` (Stripe)**: Although Stripe handles conversion via Adaptive Pricing, we can explicitly pass the target currency based on the country to improve predictability.

### 3. Admin UI Improvements
- Add a clear indicator in the `AdminProductEdit.tsx` pricing section to show which currencies are "Manual Overrides" vs "Automatic Conversions" to help the admin understand what will happen at checkout.

## Technical Details

### Backend Logic (`catalogPricing.ts`)
- The function `localTotalFromPricing` is already designed to match `sumItemsLocal`. I will verify if it accounts for shipping (if applicable) similarly to the frontend.
- Currently, `localTotalFromPricing` handles overrides from the `local_prices` JSON column in the `digital_products` table.

### Stripe Strategy
- In `create-checkout-prueba`, keep `adaptive_pricing: { enabled: !forceUsd }`.
- Ensure the base currency for the session is `USD` to allow Stripe's engine to perform the most accurate conversion, while presenting the "Local Badge" in the UI.

### dLocal Go Strategy
- Ensure `dlocal-create-payment` pulls the `localAmount` correctly.
- If a manual override for `MXN` exists in the DB, dLocal must be told to charge exactly that amount, not a converted USD value.

### User Guidance
- The user is asking "what do we do" regarding the admin product prices and the payment providers. The answer is that the system already supports this, but I will reinforce the code to make it 100% consistent and bug-free across all gateways.

## Validation Plan
1. Use Playwright to simulate a checkout from Mexico (MXN) for a product with a manual override (e.g., set MXN to 199 in admin).
2. Verify that the PayPal button, Stripe button, and dLocal buttons all show "MXN 199 ≈ $USD X.XX".
3. Verify that the actual payload sent to the Edge Functions contains the correct local amount.
