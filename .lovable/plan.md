# Optimization Plan - Secure Checkout Badges & Payment Info

Add trust badges, secure checkout information, and clear payment method visibility to the checkout page and product pages to reduce friction.

## Proposed Changes

### 1. New Components
- **`src/components/checkout/TrustBadges.tsx`**: A reusable component displaying trust signals like "Secure Checkout", "256-bit SSL", "Immediate Delivery", and "Verified Merchant".
- **`src/components/checkout/PaymentLogos.tsx`**: Displays a row of supported payment method logos (Visa, Mastercard, PayPal, Stripe, etc.) to show available methods at a glance.

### 2. Checkout Page Enhancements (`src/pages/Checkout.tsx`)
- Integrate `TrustBadges` and `PaymentLogos` in the sidebar/summary area.
- Add a "Guaranteed Safe Checkout" section with a lock icon.
- Ensure payment method icons are visible before selecting a method.

### 3. Product Page Enhancements (`src/pages/ProductDynamic.tsx`)
- Add trust badges near the "Add to Cart" / "Buy Now" button.
- Include a small "Secure Payment" notice with processor logos (Stripe, dLocal, PayPal) to reassure users before they click.

### 4. Translation Updates (`src/i18n/translations/`)
- Add new strings for trust badges and secure checkout messaging in ES, EN, FR, and PT.

## Verification Plan
- **Visual Check**: Open `/checkouts/1000-palabras-ingles` (or any valid SKU) and verify badges are visible.
- **Responsive Check**: Ensure badges stack or scale correctly on mobile devices.
- **I18n Check**: Switch languages and verify translations.
