import { z } from "npm:zod@3.23.8";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { resolveServerPricing, PricingError, isRestrictedCurrency, tierForCountry } from "../_shared/catalogPricing.ts";
import { localAmountFromUsd } from "../_shared/fxRates.ts";

const corsHeaders = { 
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", 
  "Access-Control-Allow-Methods": "POST, OPTIONS" 
};

// SEGURIDAD: solo se aceptan id y cantidad. El precio, el nombre y el
// descuento se resuelven en el servidor desde el catálogo.
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
    const country = body.contact.country.toUpperCase();

    // Precio autoritativo del servidor (ignora price/couponPercent del cliente).
    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        country: country,
        couponCode: body.couponCode,
        currency: currency,
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
    const forceUsd = body.isRestrictedRetry || isRestrictedCurrency(country);
    const targetCurrency = forceUsd ? "usd" : currency;

    // --- LÓGICA DE ENVÍO (Debe ser idéntica al Frontend) ---
    const isPhysical = pricing.items.some(i => i.isPhysical);
    const tier = tierForCountry(country);
    const isLatam = tier === "latam";
    const shippingUsdBase = isLatam ? 9 : 8;
    
    // Server-side subtotal for shipping threshold
    const subtotalUsd = pricing.items.reduce((sum, it) => sum + (it.unitUsd * it.quantity), 0);
    const hasUpsell = pricing.items.length > 1;
    const shippingUsd = (isPhysical && !hasUpsell) ? (subtotalUsd >= 50 ? 0 : shippingUsdBase) : 0;
    
    // Convert shipping to local currency if needed
    let shippingAmountCents = 0;
    if (shippingUsd > 0 && !hasUpsell) {
      if (targetCurrency === "usd") {
        shippingAmountCents = Math.round(shippingUsd * 100);
      } else {
        const shippingLocal = await localAmountFromUsd(shippingUsd, targetCurrency.toUpperCase());
        if (shippingLocal) {
          shippingAmountCents = Math.round(shippingLocal * 100);
        } else {
          shippingAmountCents = Math.round(shippingUsd * 100);
        }
      }
    }

    const line_items = await Promise.all(pricing.items.map(async (item) => {
      let unit_amount;
      if (targetCurrency === "usd") {
        unit_amount = Math.round(item.unitUsd * discountMultiplier * 100);
      } else {
        // Obtenemos el precio unitario local con cupon
        const rate = await localAmountFromUsd(1, targetCurrency.toUpperCase()) || 1;
        const override = item.localPrices?.[targetCurrency.toUpperCase()];
        const regionalUsd = item.localUsdPrices?.[targetCurrency.toUpperCase()];
        const activeUsd = (typeof regionalUsd === "number" && regionalUsd > 0) ? regionalUsd : item.unitUsd;
        
        let localUnit = (typeof override === "number" && override > 0)
          ? override
          : activeUsd * rate;
          
        unit_amount = Math.round(localUnit * discountMultiplier * 100);
      }
      
      return {
        price_data: {
          currency: targetCurrency,
          product_data: {
            name: item.name,
            ...(item.description && { description: item.description }),
            ...(item.image && { images: [item.image] }),
          },
          unit_amount,
        },
        quantity: item.quantity,
      };
    }));

    // Agregar el costo de envío como un item de línea si existe
    if (shippingAmountCents > 0) {
      line_items.push({
        price_data: {
          currency: targetCurrency,
          product_data: {
            name: country === "ES" || isLatam ? "Costo de Envío" : "Shipping Cost",
            description: "Standard Shipping",
          },
          unit_amount: shippingAmountCents,
        },
        quantity: 1,
      });
    }

    const totalCents = line_items.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0);

    if (totalCents < 50) {
      return new Response(
        JSON.stringify({ error: "El monto total debe ser al menos $0.50 USD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
      shipping_usd: String(shippingUsd),
    };

    const forceUsd = body.isRestrictedRetry || isRestrictedCurrency(country);
    const targetCurrency = forceUsd ? "usd" : currency;

    console.log(`[Stripe] Creating session. TargetCurrency: ${targetCurrency}, Total: ${totalCents}, Country: ${country}`);

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: body.returnUrl,
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
    const e = err as any;
    const stripeCode = e?.code || e?.type || "unknown_error";
    const stripeParam = e?.param || "";
    const reason = [e?.type, e?.code, stripeParam].filter(Boolean).join(":").slice(0, 80) || 
                   (e?.message && e.message.length < 100 ? e.message : "gateway_error");
    
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
