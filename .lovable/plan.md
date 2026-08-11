# Plan: Fix Stripe Checkout "unknown" error

The Stripe checkout is currently failing with an "unknown" error because the backend Edge Function `create-checkout-prueba` is using an invalid `ui_mode` parameter (`embedded_page`). Stripe's Embedded Checkout requires `ui_mode: "embedded"`.

## Changes

1.  **Backend (Edge Function)**:
    *   Update `supabase/functions/create-checkout-prueba/index.ts`: Change `ui_mode: "embedded_page"` to `ui_mode: "embedded"`.
    *   Ensure the `clientSecret` is correctly returned to the frontend.

2.  **Frontend (Stripe Integration)**:
    *   Verify `src/components/checkout/PaymentMethodsGroup.tsx` correctly handles the `clientSecret` returned by the updated function.

## Validation

*   Try to initiate a Stripe checkout in the preview.
*   The "Código: unknown" error should disappear, and the secure Stripe iframe should mount correctly.
