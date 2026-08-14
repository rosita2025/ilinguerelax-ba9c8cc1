# Plan - Enhanced Physical Order Tracking & Notifications

Improve the customer experience for physical product tracking by providing more detailed status updates and automated email notifications.

## 1. Automated Email Notifications
- Update the `list-admin-orders` Edge Function to trigger a Resend email when a tracking number is saved.
- This email will notify the customer that their order has shipped and provide the tracking ID and provider.

## 2. Granular Order Tracking Stages
- Expand the progress bar in `/mi-pedido` (`OrderStatus.tsx`) to include:
  - **Pendiente**: Order received.
  - **Pagado**: Payment confirmed.
  - **Preparación**: 5-7 days preparation period (as requested).
  - **Enviado**: Tracking number assigned.
  - **En Tránsito**: Order is with the courier.
  - **Entregado**: Final delivery.
- Update the `order-status` Edge Function to return these more detailed stages.

## 3. Homepage Tracking Widget
- Create a `TrackingSearchBar` component.
- Add this component to the Homepage (`src/pages/Index.tsx`) to allow users to quickly find their order status without navigating away.

## 4. Tracking Link Enhancements
- Improve the logic for Amazon tracking to provide direct deep links.
- Clearly label Amazon tracking numbers to build trust.

## 5. UI/UX Refinements
- Add a "Preparation" notice with the 5-7 days timeframe as requested by the user.
- Ensure the progress bar is responsive and clear on mobile.
