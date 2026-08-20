# Plan - Update FAQ Content for Spanish Mastery System (CMB7)

Update the FAQ section on the dynamic product page to reflect specific delivery times, payment methods, and the conditional refund policy.

## User Review

- **Format**: Confirm it is a Digital PDF under the iLingue Relax brand.
- **Delivery**: Specify delivery within 5 minutes via email.
- **Payments**: List Stripe, Credit Cards, and PayPal as accepted methods.
- **Guarantee**: Update the 7-day refund policy to clarify that downloaded items are eligible for a 50% refund only.

## Technical Details

- **File**: `src/pages/ProductDynamic.tsx`
- **Component**: Update the `items` array passed to the `FAQ` component.
- **Logic**: Apply these specific details when `product.sku === '5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7'`.

### FAQ Items to add/update:
1. **Delivery**: "Sent to your email within 5 minutes of purchase."
2. **Format**: "High-quality Digital PDF (Official iLingue Relax Brand)."
3. **Payments**: "Secure payments via Stripe, Credit/Debit Cards, and PayPal."
4. **Refund Policy**: "7-Day Guarantee. (Note: A 50% partial refund applies if the digital content has already been downloaded)."
