import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_ID = "price_1Tg6KBBfc72Blbd9hEX3dulP"; // Spanish Relax Physical + Digital + Bonuses — $34.99
const SHIPPING_COUNTRIES = ["US", "GB", "AU", "NZ"] as const;

// Digital upsell prices ($12 each — 1,000 Spanish Verbs & 500 Spanish Questions)
const UPSELL_PRICES = [
  "price_1Tg6PaBfc72Blbd93fFNj4g1",
  "price_1Tg6QsBfc72Blbd9HW4e8kCb",
];

// Cache shipping-rate IDs across warm invocations to avoid the extra round-trip
let cachedStandardShippingId: string | null = null;
let cachedFreeShippingId: string | null = null;

async function getShippingRateIds(stripe: Stripe): Promise<{ standardId: string; freeId: string }> {
  if (cachedStandardShippingId && cachedFreeShippingId) {
    return { standardId: cachedStandardShippingId, freeId: cachedFreeShippingId };
  }
  const [standardShipping, freeShipping] = await Promise.all([
    stripe.shippingRates.create({
      display_name: "International standard ($8 — US/UK/AU/NZ)",
      type: "fixed_amount",
      fixed_amount: { amount: 800, currency: "usd" },
      delivery_estimate: {
        minimum: { unit: "business_day", value: 7 },
        maximum: { unit: "business_day", value: 15 },
      },
    }),
    stripe.shippingRates.create({
      display_name: "Free shipping (orders $50+)",
      type: "fixed_amount",
      fixed_amount: { amount: 0, currency: "usd" },
      delivery_estimate: {
        minimum: { unit: "business_day", value: 7 },
        maximum: { unit: "business_day", value: 15 },
      },
    }),
  ]);
  cachedStandardShippingId = standardShipping.id;
  cachedFreeShippingId = freeShipping.id;
  return { standardId: standardShipping.id, freeId: freeShipping.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { email } = await req.json().catch(() => ({}));

    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.replace(/\/$/, "") ||
      "https://ilinguerelax.com";

    const { standardId, freeId } = await getShippingRateIds(stripe);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email || undefined,
      line_items: [{ price: PRICE_ID, quantity: 1, adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 } }],
      mode: "payment",
      shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
      shipping_options: [
        { shipping_rate: standardId },
        { shipping_rate: freeId },
      ],
      // @ts-ignore — optional_items (cross-sells) supported by current Stripe API
      optional_items: UPSELL_PRICES.map((price) => ({
        price,
        quantity: 1,
        adjustable_quantity: { enabled: true, minimum: 0, maximum: 1 },
      })),
      allow_promotion_codes: true,
      success_url: `${origin}/payment-success`,
      cancel_url: `${origin}/products/5-000-spanish-words-with-english-pronunciation?payment=canceled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating physical payment:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});