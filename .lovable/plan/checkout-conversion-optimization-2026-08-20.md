# Checkout Conversion Optimization

Optimize the checkout flow to increase CTR and conversion in international markets (USA, Australia, UK, Germany). Fix UX issues like mobile zooming, ambiguous payment method styling, and vertical scroll length.

## Technical Details

### UI and UX Improvements
- **Mobile Form Fix**: Update `src/components/checkout/BuyerInfoForm.tsx` to ensure all `input` and `select` elements have a minimum font-size of 16px to prevent iOS auto-zoom, and refine padding/margins for a "Shopify-like" compact feel.
- **Compact Layout**: Reduce vertical spacing in `src/pages/Checkout.tsx` and `src/components/checkout/OrderSummary.tsx`, ensuring the most critical information (totals and pay button) is easily accessible.
- **Payment Method Hierarchy**: Refactor `src/components/checkout/PaymentMethodsGroup.tsx` to use distinctive colored badges and clearer titles for Stripe (Cards, GPay, Apple Pay) and dLocal Go (Local transfers), removing gray tones that suggest "disabled" states.

### Pricing and Shipping Consistency
- **Shipping Rule Reinforcement**: Ensure `useCheckoutTotal.ts` strictly applies the $8 USD flat shipping fee for physical orders and $0 for digital, with no thresholds or overrides.
- **Gateway Synchronization**: Verify that the calculated total (including regional USD adjustments) is correctly passed to the Stripe and dLocal Go edge functions to prevent validation errors.

### Internationalization
- **Translation Audit**: Review `src/i18n/checkoutUI.ts` to ensure English translations for "Full Name", "Secure Payment", and "Shipping Address" are natural and build trust in non-Spanish speaking regions.

## Verification Plan
- **Mobile Viewport Test**: Verify that clicking form fields does not trigger browser zooming on mobile resolutions.
- **Pricing Audit**: Add items to the cart and verify that shipping is exactly $8 for physical and $0 for digital across different IP regions (USA vs. Peru).
- **Payment Gateway Simulation**: Initiate checkouts for different methods to ensure the "InitiateCheckout" event tracks the correct localized value.
