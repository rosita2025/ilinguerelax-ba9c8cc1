# Plan - Payment Notifications & Country-Specific Info

The user wants to ensure that customers are properly notified and shown the correct manual payment details (Yape, Plin, Binance, SPEI Mexico, etc.) for Peru and Mexico during the checkout process and via email.

## User Requirements
- **Notifications**: Automated emails for manual payments (Yape, Plin, Binance, SPEI).
- **Regional Support**: Specific focus on Peru (Yape/Plin) and Mexico (SPEI/CLABE).
- **Manual Payment Details**: Display the correct banking info/QR during and after the purchase.

## Proposed Changes

### 1. Backend: Transactional Emails
- Refine `customer-manual-pending.tsx` and `admin-manual-pending.tsx` templates to ensure the information for **SPEI (Mexico)** and **Yape/Plin (Peru)** is prominent and accurate.
- Verify `send-transactional-email` logic correctly triggers these templates when a manual payment is initiated.

### 2. Frontend: Checkout Component
- Update `PaymentMethodsGroup.tsx` to ensure that when a customer selects a manual method (Yape, Plin, SPEI, Binance), the specific instructions for their country are displayed clearly.
- Ensure the **Mexico CLABE** info (Titular: Carmen Rosa Aliaga Dominguez, CLABE: 646180546709905176) is correctly shown for Mexican users.

### 3. Backend: Webhook Handling (dLocal/Manual)
- Verify `manage-manual-payments` correctly handles the creation of these orders and triggers the "Pending" email to the customer with the instructions.

## Technical Details
- **Email Template**: `supabase/functions/_shared/transactional-email-templates/customer-manual-pending.tsx`
- **Manual Payment Data**: Ensure the constants in `PaymentMethodsGroup.tsx` match the user's provided CLABE and Yape details.
- **Trigger**: The `create-checkout-prueba` or similar initiation function should call `send-transactional-email` for manual methods.

## Verification Plan
- **Manual Test**: Initiate a checkout for a product with a Peru/Mexico IP (simulated) and select Yape/SPEI.
- **Log Review**: Check `email_send_log` in Supabase to confirm the `customer-manual-pending` email is dispatched.
- **Visual Check**: Use Playwright to verify the payment instruction box appears correctly in the Checkout UI.
