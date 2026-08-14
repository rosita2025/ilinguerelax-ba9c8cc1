# Plan - Optimization of Physical Order Management and Tracking Delivery

The user wants to update the `/admin/orders-physical` panel to work flawlessly and ensure that sending tracking information is reliable.

## Proposed Changes

### 1. Edge Function Optimization (`supabase/functions/list-admin-orders/index.ts`)
- Ensure the `update_tracking` action correctly identifies and updates both `manual_payments` and `shopify_sales`.
- Add validation to prevent empty tracking updates.
- Ensure the `order_events` logging includes enough metadata for debugging.

### 2. Admin UI Improvements (`src/pages/AdminPhysicalOrders.tsx`)
- Implement a more robust saving state per order.
- Add "Copy Tracking Link" helper button if a provider is recognized (Amazon, DHL, etc.).
- Improve the "Status" badge display to be more descriptive (e.g., distinguishing between "Paid" and "Shipped").
- Add a "Send Email Notification" toggle or button to trigger a Resend email when tracking is added (requires a new Edge Function action).

### 3. Customer Status Page (`src/pages/OrderStatus.tsx`)
- Verify that the tracking card is visible and provides direct links to carrier websites.
- Ensure the "Digital Delivered First" notice is clear.

### 4. Integration & Validation
- Test the flow from updating in admin to viewing in `/mi-pedido`.
- Validate that Shopify orders (which often have their own tracking) don't conflict with manual overrides.

## Technical Details
- **Tables**: `manual_payments`, `shopify_sales`, `order_events`.
- **Fields**: `tracking_number`, `shipping_provider`.
- **Carrier Logic**: Auto-detect carrier URL based on `shipping_provider` string.
