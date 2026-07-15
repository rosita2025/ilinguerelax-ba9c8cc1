import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { normalizeSkus } from "../_shared/digitalSku.ts";

const ItemSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  price: z.number().positive().max(10000),
  quantity: z.number().int().min(1).max(50),
  image: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

const BodySchema = z.object({
  environment: z.enum(["sandbox", "live"]).default("sandbox"),
  items: z.array(ItemSchema).min(1).max(20),
  currency: z.string().length(3).default("usd"),
  couponPercent: z.number().min(0).max(90).default(0),
  couponCode: z.string().max(20).optional(),
  contact: z.object({
    email: z.string().email().max(255),
    phone: z.string().max(20),
    firstName: z.string().max(50),
    lastName: z.string().max(50),
    country: z.string().length(2),
  }),
  returnUrl: z.string().url(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const body = parsed.data;
    const env = body.environment as StripeEnv;
    const stripe = createStripeClient(env);

    const currency = body.currency.toLowerCase();
    const discountMultiplier = 1 - body.couponPercent / 100;

    const line_items = body.items.map((item) => {
      const unit_amount = Math.round(item.price * discountMultiplier * 100);
      return {
        price_data: {
          currency,
          product_data: {
            name: item.name,
            ...(item.description && { description: item.description }),
            ...(item.image && { images: [item.image] }),
          },
          unit_amount,
        },
        quantity: item.quantity,
      };
    });

    const total = body.items.reduce(
      (s, i) => s + Math.round(i.price * discountMultiplier * 100) * i.quantity,
      0,
    );

    if (total < 50) {
      return new Response(
        JSON.stringify({ error: "El monto total debe ser al menos $0.50 USD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Guest checkout: keep this function fast. Avoid customer list/update/create
    // calls before opening the payment form; Stripe will collect/prefill the
    // buyer email directly on the Checkout Session.
    const fullName = `${body.contact.firstName} ${body.contact.lastName}`.trim().slice(0, 100);

    const productSummary = body.items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(" · ")
      .slice(0, 300);
    const deliverySkus = normalizeSkus(body.items.map((i) => i.id)).join(",").slice(0, 490);

    // Métodos de pago habilitados en Stripe:
    // - card: tarjetas de crédito/débito globales
    // - link: One-click de Stripe
    // - us_bank_account: transferencia bancaria ACH (compradores USA)
    // - customer_balance: transferencia bancaria internacional (virtual account)
    // Nota: Efecty (Colombia) requiere moneda COP y country=CO;
    // no es compatible con este checkout Global en USD.
    const buyerCountry = body.contact.country.toUpperCase();
    const paymentMethodTypes: string[] = ["card", "link"];
    if (buyerCountry === "US") paymentMethodTypes.push("us_bank_account");

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: body.returnUrl,
      // Stripe convierte automáticamente el precio en USD a la moneda local del comprador.
      adaptive_pricing: { enabled: true },
      customer_email: body.contact.email,
      payment_method_types: paymentMethodTypes as any,
      payment_intent_data: {
        description: `Prueba 1 · ${productSummary}`,
      },
      metadata: {
        source: "checkout-prueba-1",
        customer_name: fullName,
        customer_phone: body.contact.phone,
        customer_country: body.contact.country,
        coupon_code: body.couponCode ?? "",
        coupon_percent: String(body.couponPercent),
        items_count: String(body.items.length),
        items_summary: productSummary,
        skus: deliverySkus,
      },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout-prueba error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
