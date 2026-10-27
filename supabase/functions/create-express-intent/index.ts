import { z } from "npm:zod@3.25.76";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { resolveServerPricing, PricingError, isRestrictedCurrency } from "../_shared/catalogPricing.ts";
import { localAmountFromUsd } from "../_shared/fxRates.ts";

/**
 * Stripe EXPRESS CHECKOUT (Apple Pay / Google Pay / Link).
 *
 * Dos acciones:
 *  - "quote":  devuelve { amount, currency } que el botón necesita para abrirse.
 *  - "create": crea el PaymentIntent y devuelve { clientSecret, paymentIntentId }.
 *
 * La usan dos pantallas: los botones de billetera (source = "express-checkout") y el
 * formulario de pago nuevo tipo "Payment Element" (source = "payment-element", que
 * además permite métodos con redirección como Klarna o Cash App).
 *
 * El monto SIEMPRE lo calcula el servidor desde el catálogo (igual que
 * create-checkout-prueba): el navegador solo manda ids y cantidades.
 * Solo productos DIGITALES (sin envío). El webhook entrega el producto cuando
 * llega payment_intent.succeeded con metadata.source = "express-checkout".
 */

// Monedas "sin decimales" de Stripe (igual que create-checkout-prueba).
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

function toStripeAmount(amount: number, currency: string): number {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase());
  return Math.round(isZeroDecimal ? amount : amount * 100);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BodySchema = z.object({
  environment: z.enum(["sandbox", "live"]).default("sandbox"),
  action: z.enum(["quote", "create"]),
  source: z.enum(["express-checkout", "payment-element"]).default("express-checkout"),
  // Métodos locales de Stripe (pago por redirección, sin guardar tarjeta), cada uno solo en su país y en euros:
  // bizum (ES), satispay (IT), ideal (NL), mb_way (PT), klarna (países de la UE en EUR y EE. UU. en USD) y
  // crypto (stablecoins; solo se cobra en USD). Por defecto, el flujo de siempre.
  method: z.enum(["card", "bizum", "satispay", "ideal", "mb_way", "klarna", "crypto"]).default("card"),
  items: z.array(z.object({
    id: z.string().min(1).max(180),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(20),
  currency: z.string().length(3).default("usd"),
  country: z.string().length(2),
  couponCode: z.string().max(20).optional(),
  // Referencia corta del pedido (ej. PED-7K3QX2): queda en la descripción y los metadatos del pago en Stripe.
  orderRef: z.string().regex(/^PED-[A-Z0-9-]{3,12}$/).optional(),
  contact: z.object({
    email: z.string().email().max(255),
    name: z.string().max(100).optional(),
    phone: z.string().max(30).optional(),
  }).optional(),
});

type Priced = Awaited<ReturnType<typeof resolveServerPricing>>;

/** Total en la unidad mínima de `targetCurrency`, o null si no hay tipo de cambio. */
async function totalFor(pricing: Priced, targetCurrency: string): Promise<number | null> {
  const discountMultiplier = 1 - pricing.couponPercent / 100;
  let total = 0;
  for (const item of pricing.items) {
    let unit: number;
    if (targetCurrency === "usd") {
      unit = toStripeAmount(item.unitUsd * discountMultiplier, targetCurrency);
    } else {
      const rate = await localAmountFromUsd(1, targetCurrency.toUpperCase());
      const override = item.localPrices?.[targetCurrency.toUpperCase()];
      const regionalUsd = item.localUsdPrices?.[targetCurrency.toUpperCase()];
      const activeUsd = (typeof regionalUsd === "number" && regionalUsd > 0) ? regionalUsd : item.unitUsd;
      const hasOverride = typeof override === "number" && override > 0;
      if (!hasOverride && !rate) return null; // sin tipo de cambio: no adivinamos
      const localUnit = hasOverride ? override : activeUsd * (rate as number);
      unit = toStripeAmount(localUnit * discountMultiplier, targetCurrency);
    }
    total += unit * item.quantity;
  }
  return total;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Invalid input", reason: "invalid_input" }, 400);
    }
    const body = parsed.data;
    const country = body.country.toUpperCase();

    let pricing: Priced;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity, price: undefined })),
        country,
        couponCode: body.couponCode,
        currency: body.currency.toLowerCase(),
      });
    } catch (e) {
      if (e instanceof PricingError) return json({ error: e.message, reason: "pricing_error" }, 400);
      throw e;
    }

    // Express solo para productos digitales (no hay dirección de envío).
    if (pricing.items.some((i) => i.isPhysical)) {
      return json({ error: "Express checkout not available for physical items", reason: "express_not_available" }, 400);
    }

    // Moneda: la elegida, salvo países restringidos o sin tipo de cambio → USD.
    let currency = isRestrictedCurrency(country) ? "usd" : body.currency.toLowerCase();
    let amount = await totalFor(pricing, currency);
    if (amount === null) {
      currency = "usd";
      amount = await totalFor(pricing, currency);
    }
    if (amount === null || amount < 50) {
      return json({ error: "Invalid amount", reason: "invalid_amount" }, 400);
    }

    if (body.action === "quote") {
      return json({ amount, currency });
    }

    // ── action === "create" ─────────────────────────────────────────────
    if (!body.contact) return json({ error: "Missing contact", reason: "missing_contact" }, 400);

    const stripe = createStripeClient(body.environment as StripeEnv);
    const email = body.contact.email.trim().toLowerCase();
    const fullName = (body.contact.name || email.split("@")[0]).trim().slice(0, 100);

    const productSummary = pricing.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ").slice(0, 300);
    const deliverySkus = normalizeSkus(pricing.items.map((i) => i.sku)).join(",").slice(0, 490);

    const metadata = {
      source: body.source,
      customer_email: email,
      customer_name: fullName,
      customer_phone: body.contact.phone ?? "",
      customer_country: country,
      ship_address: "",
      ship_city: "",
      ship_state: "",
      ship_zip: "",
      coupon_code: pricing.couponCode ?? "",
      coupon_percent: String(pricing.couponPercent),
      items_count: String(pricing.items.length),
      items_summary: productSummary,
      skus: deliverySkus,
      order_ref: body.orderRef ?? "",
      shipping_usd: "0",
    };

    // Customer reutilizable (permite el upsell post-compra con 1 clic).
    let customerId: string | undefined;
    try {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data[0]?.id ?? (await stripe.customers.create({ email, name: fullName })).id;
    } catch (custErr) {
      console.error("[create-express-intent] customer create/find failed (non-fatal):", custErr);
    }

    if (body.method !== "card") {
      const EUR_ONLY: Record<string, string> = { bizum: "ES", satispay: "IT", ideal: "NL", mb_way: "PT" };
      const KLARNA_EUR = ["AT", "BE", "DE", "ES", "FI", "FR", "IE", "IT", "NL", "PT"];
      let allowed = false;
      if (body.method === "crypto") allowed = currency === "usd";
      else if (body.method === "klarna") allowed = (currency === "eur" && KLARNA_EUR.includes(country)) || (currency === "usd" && country === "US");
      else allowed = country === EUR_ONLY[body.method] && currency === "eur";
      if (!allowed) {
        return json({ error: `${body.method} is not available for this country/currency`, reason: "local_method_not_available" }, 400);
      }
      const localIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        ...(customerId ? { customer: customerId } : {}),
        receipt_email: email,
        description: `${body.orderRef ? `[${body.orderRef}] ` : ""}${productSummary || "iLingue Relax Digital"}`.slice(0, 300),
        payment_method_types: [body.method],
        metadata,
      });
      return json({ clientSecret: localIntent.client_secret, paymentIntentId: localIntent.id, amount, currency });
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      ...(customerId ? { customer: customerId } : {}),
      receipt_email: email,
      description: `${body.orderRef ? `[${body.orderRef}] ` : ""}${productSummary || "iLingue Relax Digital"}`.slice(0, 300),
      setup_future_usage: "off_session",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: body.source === "payment-element" ? "always" : "never",
      },
      metadata,
    });

    return json({ clientSecret: intent.client_secret, paymentIntentId: intent.id, amount, currency });
  } catch (err) {
    console.error("create-express-intent error:", err);
    const e = err as { code?: string; type?: string; message?: string };
    return json(
      { error: "No se pudo iniciar el pago. Intenta nuevamente.", reason: [e?.type, e?.code].filter(Boolean).join(":") || "gateway_error" },
      502,
    );
  }
});
