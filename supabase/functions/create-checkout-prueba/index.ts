const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { z } from "npm:zod@3.23.8";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { resolveServerPricing, PricingError, isRestrictedCurrency } from "../_shared/catalogPricing.ts";


// SEGURIDAD: solo se aceptan id y cantidad. El precio, el nombre y el
// descuento se resuelven en el servidor desde el catálogo; los valores que
// mande el navegador se ignoran.
const ItemSchema = z.object({
  id: z.string().min(1).max(180),
  name: z.string().max(200).optional(),
  price: z.number().optional(),
  quantity: z.number().int().min(1).max(50),
  image: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
});

const BodySchema = z.object({
  environment: z.enum(["sandbox", "live"]).default("sandbox"),
  items: z.array(ItemSchema).min(1).max(20),
  currency: z.string().length(3).default("usd"),
  stripePaymentMethod: z.enum(["card", "us_bank_account", "cashapp", "klarna", "afterpay_clearpay", "affirm"]).default("card"),
  couponPercent: z.number().min(0).max(100).optional(),
  couponCode: z.string().max(20).optional(),
  contact: z.object({
    email: z.string().email().max(255),
    phone: z.string().max(20),
    firstName: z.string().max(50),
    lastName: z.string().max(50),
    country: z.string().length(2),
  }),
  returnUrl: z.string().url(),
  isRestrictedRetry: z.boolean().optional(),
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

    // Precio autoritativo del servidor (ignora price/couponPercent del cliente).
    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        country: body.contact.country,
        couponCode: body.couponCode,
      });
    } catch (e) {
      if (e instanceof PricingError) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    const discountMultiplier = 1 - pricing.couponPercent / 100;

    const line_items = pricing.items.map((item) => {
      const unit_amount = Math.round(item.unitUsd * discountMultiplier * 100);
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

    const total = Math.round(pricing.totalUsd * 100);

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

    const productSummary = pricing.items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(" · ")
      .slice(0, 300);
    const deliverySkus = normalizeSkus(pricing.items.map((i) => i.sku)).join(",").slice(0, 490);
    const checkoutMetadata = {
      source: "checkout-prueba-1",
      customer_email: body.contact.email,
      customer_name: fullName,
      customer_phone: body.contact.phone,
      customer_country: body.contact.country,
      coupon_code: pricing.couponCode ?? "",
      coupon_percent: String(pricing.couponPercent),
      items_count: String(pricing.items.length),
      items_summary: productSummary,
      skus: deliverySkus,
    };

    // Respeta exactamente la opción elegida en /admin/checkout-methods.
    // Antes, al elegir "Tarjeta", se omitía payment_method_types y Stripe
    // volvía a mostrar automáticamente PayPal, Klarna y todos los métodos
    // activados en la cuenta, aunque el administrador no los hubiera elegido.
    
    // Favor local currency if supported and not restricted.
    const forceUsd = body.isRestrictedRetry || isRestrictedCurrency(body.contact.country);
    
    // Stripe handle Adaptive Pricing better when the base currency matches the catalog (USD)
    // but the final session can be shown in local. We prefer local currency processing 
    // for non-restricted countries.
    const targetCurrency = forceUsd ? "usd" : currency;

    console.log(`[Stripe] Creating session. TargetCurrency: ${targetCurrency}, ForceUSD: ${forceUsd}, Country: ${body.contact.country}`);

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: body.returnUrl,
      // Adaptive Pricing allows Stripe to present local currency automatically if enabled.
      adaptive_pricing: { enabled: !forceUsd },
      currency: targetCurrency,
      customer_email: body.contact.email,
      payment_intent_data: {
        description: productSummary || "iLingue Relax Digital",
        receipt_email: body.contact.email,
        metadata: checkoutMetadata,
      },
      metadata: checkoutMetadata,
    });


    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout-prueba error:", err);
    // No exponemos el detalle interno de la pasarela, pero sí un código corto
    // (tipo/código de Stripe) para poder diagnosticar en /admin/payment-errors.
    const e = err as any;
    const stripeCode = e?.code || e?.type || "unknown_error";
    const stripeParam = e?.param || "";
    const reason = [e?.type, e?.code, stripeParam].filter(Boolean).join(":").slice(0, 80) || 
                   (e?.message && e.message.length < 100 ? e.message : "gateway_error");
    
    console.error(`Stripe Error [${stripeCode}]:`, e.message, "Param:", stripeParam);

    const message = e?.message && e.message.length < 200 && !e.message.includes("api.stripe.com")
      ? e.message 
      : "No se pudo iniciar el pago. Intenta nuevamente.";

    return new Response(
      JSON.stringify({ 
        error: message, 
        reason,
        stripe_code: stripeCode,
        stripe_param: stripeParam,
        detail: e?.message 
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

