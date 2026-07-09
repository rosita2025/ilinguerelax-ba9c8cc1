import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

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

    // Resolve or create a Stripe Customer so email/name are prefilled in
    // Embedded Checkout (Stripe still shows the email field, but it comes
    // pre-populated and users don't need to retype it).
    const fullName = `${body.contact.firstName} ${body.contact.lastName}`.trim().slice(0, 100);
    let customerId: string | undefined;
    try {
      const existing = await stripe.customers.list({ email: body.contact.email, limit: 1 });
      if (existing.data.length) {
        customerId = existing.data[0].id;
        await stripe.customers.update(customerId, {
          name: fullName || existing.data[0].name || undefined,
          phone: body.contact.phone || existing.data[0].phone || undefined,
        });
      } else {
        const created = await stripe.customers.create({
          email: body.contact.email,
          name: fullName || undefined,
          phone: body.contact.phone || undefined,
          metadata: { source: "checkout-prueba-1", country: body.contact.country },
        });
        customerId = created.id;
      }
    } catch (e) {
      console.warn("customer resolve failed, falling back to customer_email:", e);
    }

    const productSummary = body.items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(" · ")
      .slice(0, 300);

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: body.returnUrl,
      ...(customerId
        ? { customer: customerId, customer_update: { name: "auto", address: "auto" } }
        : { customer_email: body.contact.email }),
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
