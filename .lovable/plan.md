# Fix: card/gateway orders missing from Physical Orders admin

## What is happening

Order `ILR-ST-1ADAPRPX` was paid with card (Stripe) on 2026-08-19 for SKU `5-000-spanish-words-with-english-pronunciation-physical`. The digital delivery went out (1 digital email send recorded), but the order never shows up in `/admin/orders-physical`.

Verified cause: the admin Physical Orders screen only merges two sources — manual payments and Shopify sales. Stripe/dLocal card orders are recorded only as an `order_events` row (`payment_paid`, provider `stripe`, PEN 33.73, SKUs in metadata). They exist in the database but no admin view reads them, so every card-paid physical book is invisible for shipping.

Second gap found: no shipping address is stored for card orders. The Stripe path saves only email, name, phone, country — street/city/postal code are not persisted anywhere, so even once the order shows up, the address must be captured.

## What will be built

1. **Show gateway orders in Physical Orders**
   The admin orders backend will also read paid `order_events` (Stripe, dLocal, and any future gateway), match their SKUs against products flagged as physical, and return them as a third source alongside manual and Shopify. Existing manual/Shopify behaviour stays untouched.

2. **Tracking for gateway orders**
   A new `physical_shipments` table keyed by order number will hold carrier, tracking number, shipping proof URL and shipment status for orders that do not live in `manual_payments`/`shopify_sales`. The existing "save tracking" action in the admin will write there when the order source is a gateway, and the existing tracking email to the customer will fire the same way.

3. **Capture the shipping address for card orders**
   The checkout already collects full shipping details for physical products. Those fields will be passed through the Stripe payment metadata and persisted by the webhook into `physical_shipments`, so the admin card shows the address to ship to. Orders paid before this change (including `ILR-ST-1ADAPRPX`) will show "address not recorded" with the customer email so it can be requested or filled manually — an editable address field on the admin card covers that.

4. **Backfill visibility for the current order**
   Once step 1 ships, `ILR-ST-1ADAPRPX` appears immediately in `/admin/orders-physical` as PAID / not shipped, with its customer email and product, ready for tracking entry.

## Technical notes

- `supabase/functions/list-admin-orders/index.ts`: add an `order_events` query (`event = payment_paid`), dedupe by `order_number`, join `physical_shipments`, exclude orders already returned by manual/Shopify, return as `gateway[]`.
- `src/pages/AdminPhysicalOrders.tsx`: add `"gateway"` to the source union, map the new array (customer email, provider badge, amount+currency, SKU list, address block), and route its tracking save to the new source.
- New migration: `public.physical_shipments` (order_number PK, email, provider, tracking_number, shipping_proof_url, shipping_address jsonb, status, timestamps) with explicit GRANTs, RLS enabled, and no client-side policies — access only via service-role edge functions.
- `supabase/functions/stripe-webhook/index.ts` and `dlocal-webhook`: upsert a `physical_shipments` row when any purchased SKU is physical.
- `create-checkout-prueba` / intent creation: forward address fields in metadata (short keys, within Stripe's 500-char per-value limit).

## Out of scope

No pricing, checkout UI, or digital delivery changes.
