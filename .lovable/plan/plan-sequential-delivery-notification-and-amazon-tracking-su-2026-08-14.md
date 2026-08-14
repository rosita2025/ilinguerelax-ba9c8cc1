# Plan: Sequential Delivery Notification and Amazon Tracking Support

The user wants to clarify the delivery process for mixed orders (digital + physical): digital delivery happens immediately via email, followed by the physical delivery which will show as "in progress" and eventually provide an Amazon tracking link.

## User Review Required

> [!IMPORTANT]
> - Digital items are delivered instantly to your email after payment confirmation.
> - Physical items will show as "In Progress" until shipped.
> - Amazon tracking links will be provided once the physical shipment is dispatched.

## Technical Details

### 1. Internationalization Updates
- Update `src/i18n/checkoutStatus.ts` to add new keys for sequential delivery:
    - `digitalDeliveredFirst`: "Material digital enviado (inmediato)"
    - `physicalInProgress`: "Envío físico en preparación"
    - `trackingComingSoon`: "El código de seguimiento se enviará pronto"

### 2. UI Enhancements in Success & Order Status
- **`src/pages/CheckoutSuccess.tsx`**: Update the physical order section to explicitly mention that the digital version was already sent (if it's a bundle) and that the physical book is being prepared.
- **`src/pages/OrderStatus.tsx`**: Enhance the visual tracker to show:
    1. **Digital Access**: "Sent to Email" (Checkmark)
    2. **Physical Shipping**: "In Progress / Preparing"
    3. **Tracking**: Placeholder for the Amazon tracking link.

### 3. Database Schema (Internal)
- Ensure the `public.order_events` or `public.digital_products` table can store an external tracking URL (Amazon) if not already present, to be displayed in the status tracker once updated by an admin.
