# Plan: Automation Reinforcement for Marketing Drips

The user wants to ensure that customers who purchase products are correctly excluded from abandoned cart drips and correctly enrolled in post-purchase marketing drips, specifically addressing cases like `dogsballs111@yahoo.com`.

## User Review Required

> [!IMPORTANT]
> This plan focuses on backend logic to ensure that once a customer buys, they stop receiving abandoned cart emails and start receiving the correct post-purchase sequence.

- **Deduplication**: We will ensure that physical orders (Shopify), manual payments (Yape/Plin), and Stripe/PayPal/MP purchases all trigger the "Converted" flag.
- **Immediate Enrollment**: We will ensure the marketing drip picks up new buyers immediately.

## Proposed Changes

### Backend (Edge Functions)

#### 1. Shared Purchase Detection (`supabase/functions/_shared/purchasedSkus.ts`)
- Enhance the `getPurchasedSkus` helper to be more resilient with email normalization (case-insensitive) and cross-table checks.
- Add a specific check for `persistent_carts` status during SKU lookup.

#### 2. Abandoned Cart Deduplication (`supabase/functions/track-abandoned-checkout/index.ts`)
- Add a pre-check using `getPurchasedSkus` to immediately exit if the user already owns the product they are "abandoning".
- This prevents the "Buyer" from ever being logged as "Abandoned" if they buy within the same session or shortly after.

#### 3. Marketing Hub Sync (`supabase/functions/send-marketing-drip/index.ts`)
- Ensure that the query for "new clients" includes all sources: `hotmart_purchase`, `store_purchase`, `manual_payment`, and `shopify_sales`.
- Fix the logic that determines the `category` for physical books so they get their specific drip sequence.

#### 4. Newsletter Drip Safeguards (`supabase/functions/send-newsletter-drip/index.ts`)
- Reinforce the "Already Purchased" skip logic to check the full SKU set using the shared helper.

#### 5. Order Conversion Logic (`supabase/functions/_shared/thankYouEmail.ts`)
- Ensure `markAbandonedCartConverted` is called consistently across all entry points (Stripe, PayPal, Mercado Pago, Yape).

## Verification Plan

### Automated Tests
- Run `vitest` or similar (if available) to verify `getPurchasedSkus` returns correct sets for test emails.
- Use a mock script to trigger a checkout track for an existing buyer and verify it returns `skipped: "already_purchased"`.

### Manual Verification
- Check `/admin/marketing-drips` to see if `dogsballs111@yahoo.com` is correctly marked as a Buyer and has no active abandoned cart records.
- Verify that a new purchase successfully clears any existing rows in `persistent_carts` for that email.
