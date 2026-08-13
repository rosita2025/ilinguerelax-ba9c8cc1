import { z } from "npm:zod@3.23.8";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Los 3 libros físicos. La clave se resuelve en el servidor: el navegador
// nunca manda precios.
const BOOKS = {
  english_5000: { priceId: "book_english_5000_onetime", name: "Inglés Relax 5,000 Palabras — Libro Físico" },
  english_8000: { priceId: "book_english_8000_onetime", name: "Inglés Relax 8,000 Palabras — Libro Físico" },
  spanish_5000: { priceId: "book_spanish_5000_onetime", name: "Spanish Relax 5,000 Words — Physical Book" },
} as const;

// Envíos internacionales habilitados
const SHIPPING_COUNTRIES = ["US", "CA", "GB", "AU", "NZ"] as const;

const BodySchema = z.object({
  book: z.enum(["english_5000", "english_8000", "spanish_5000"]),
  quantity: z.number().int().min(1).max(10).default(1),
  email: z.string().email().max(255).optional(),
  environment: z.enum(["sandbox", "live"]),
  returnUrl: z.string().url(),
});

let cachedRates: { standardId: string; freeId: string } | null = null;

async function getShippingRates(stripe: ReturnType<typeof createStripeClient>) {
  if (cachedRates) return cachedRates;
  const [standard, free] = await Promise.all([
    stripe.shippingRates.create({
      display_name: "International standard — $8",
      type: "fixed_amount",
      fixed_amount: { amount: 800, currency: "usd" },
      delivery_estimate: {
        minimum: { unit: "business_day", value: 7 },
        maximum: { unit: "business_day", value: 15 },
      },
    }),
    stripe.shippingRates.create({
      display_name: "FREE shipping (orders $50+)",
      type: "fixed_amount",
      fixed_amount: { amount: 0, currency: "usd" },
      delivery_estimate: {
        minimum: { unit: "business_day", value: 7 },
        maximum: { unit: "business_day", value: 15 },
      },
    }),
  ]);
  cachedRates = { standardId: standard.id, freeId: free.id };
  return cachedRates;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { book, quantity, email, environment, returnUrl } = parsed.data;
    const config = BOOKS[book];

    const stripe = createStripeClient(environment as StripeEnv);

    const prices = await stripe.prices.list({ lookup_keys: [config.priceId], limit: 1 });
    if (!prices.data.length) throw new Error(`Price not found: ${config.priceId}`);
    const price = prices.data[0];

    const { standardId, freeId } = await getShippingRates(stripe);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: price.id,
          quantity,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
        },
      ],
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(email && { customer_email: email }),
      shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
      shipping_options: [{ shipping_rate: standardId }, { shipping_rate: freeId }],
      payment_intent_data: { description: config.name },
      allow_promotion_codes: true,
      metadata: { 
        book, 
        product_name: config.name,
        digital_bundle: "true",
        digital_sku: book === "english_5000" ? "5000" : book === "english_8000" ? "8000" : "spanish-5000-digital"
      },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-physical-checkout]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
