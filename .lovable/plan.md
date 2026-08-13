# Plan - Add Shipping Fields and Calculations to Physical Book Checkout

The user wants to collect shipping information (address, country, shipping cost) for physical book checkouts. Currently, these details are handled within the Stripe Embedded Checkout session via the `create-physical-checkout` edge function, but the user likely wants to see or collect these details more explicitly or ensure they are properly integrated into the flow.

## Technical Details

- **Frontend (`src/components/PhysicalBookCheckout.tsx`)**:
  - Update the dialog to provide more clarity about the shipping process.
  - Since Stripe's `EmbeddedCheckout` already collects the address when `shipping_address_collection` is enabled (which it is in the edge function), we will ensure the UI reflects that the price includes shipping or shows the total clearly.
  - Add a summary of shipping costs and allowed countries in the dialog before the checkout loads.

- **Edge Function (`supabase/functions/create-physical-checkout/index.ts`)**:
  - The function already has `shipping_address_collection` and `shipping_options`.
  - I will verify if any additional metadata needs to be passed to ensure the order is correctly tracked in the backend.

- **Order Management**:
  - Ensure that when a physical book order is completed, the shipping address from Stripe is captured (usually via webhook or post-checkout session retrieval).

## Proposed Changes

### Components
- **`src/components/PhysicalBookCheckout.tsx`**:
  - Enhance the dialog with a clearer "Shipping Details" section.
  - Explicitly list the shipping cost ($8 or FREE) and the target countries.
  - Add a note that the address will be collected securely by Stripe.

### Edge Functions
- **`supabase/functions/create-physical-checkout/index.ts`**:
  - (Already verified) It currently allows US, CA, GB, AU, NZ.
  - It handles standard ($8) and free ($50+) shipping rates.

### Integration
- **`src/pages/Checkout.tsx`**:
  - Check if this page should also handle physical products. Currently, physical books use `PhysicalBookCheckout.tsx` (a dialog with Stripe Embedded Checkout), while digital products use the custom `/checkouts/:slug` flow. I will keep them separate as per current architecture unless the user wants a unified cart.

## User Review Required

> [!IMPORTANT]
> The shipping address and final cost are currently collected **inside** the Stripe popup to ensure security and accurate tax/shipping calculation. Do you want me to move the address collection to a custom form *before* opening Stripe, or is the current Stripe-native collection sufficient?
