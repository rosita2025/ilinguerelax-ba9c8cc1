import { z } from "npm:zod@3.25.76";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { resolveServerPricing, PricingError, isRestrictedCurrency, tierForCountry } from "../_shared/catalogPricing.ts";
import { localAmountFromUsd } from "../_shared/fxRates.ts";

// Monedas "sin decimales" según Stripe (misma lógica que create-checkout-prueba).
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
  image: z.string().transform((v) => v.slice(0, 2000)).optional(),
  description: z.string().transform((v) => v.slice(0, 2000)).optional(),
});

const BodySchema = z.object({
  environment: z.enum(["sandbox", "live"]).default("sandbox"),
  items: z.array(ItemSchema).min(1).max(20),
  currency: z.string().length(3).default("usd"),
  stripePaymentMethod: z.enum(["card", "us_bank_account", "cashapp", "klarna", "afterpay_clearpay", "affirm", "oxxo"]).default("card"),
  couponPercent: z.number().min(0).max(100).optional(),
  couponCode: z.string().max(20).optional(),
  contact: z.object({
    email: z.string().email().max(255),
    phone: z.string().max(20).optional(),
    firstName: z.string().max(50),
    lastName: z.string().max(50),
    country: z.string().length(2),
    address: z.string().max(160).optional(),
    city: z.string().max(80).optional(),
    state: z.string().max(80).optional(),
    zip: z.string().max(24).optional(),
  }),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url().optional(),
  isRestrictedRetry: z.boolean().optional(),
  // Clic del anuncio de Meta (cookie _fbc/_fbp): se guarda en el pago para que la compra se ligue al anuncio.
  meta: z.object({ fbc: z.string().max(255).optional(), fbp: z.string().max(255).optional() }).optional(),
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
      const flat = parsed.error.flatten();
      const detailText = [
        ...parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`),
        ...flat.formErrors,
      ].join(" | ").slice(0, 400);
      return new Response(
        JSON.stringify({
          error: detailText ? `Invalid input: ${detailText}` : "Invalid input",
          reason: detailText ? `invalid_input: ${detailText}` : "invalid_input",
          details: flat.fieldErrors,
          field_errors: flat.fieldErrors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const body = parsed.data;
    const env = body.environment as StripeEnv;
    const stripe = createStripeClient(env);

    const currency = body.currency.toLowerCase();
    const country = body.contact.country.toUpperCase();

    // Precio autoritativo del servidor (idéntico al checkout embebido):
    // mismos tiers por país, mismos ítems (producto + upsells), mismo cupón.
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
    // OXXO (efectivo en tiendas): solo México y solo en pesos; Stripe no lo cobra en otra moneda.
    const isOxxo = body.stripePaymentMethod === "oxxo";
    if (isOxxo && country !== "MX") {
      return new Response(JSON.stringify({ error: "OXXO solo está disponible en México.", reason: "oxxo_only_mexico" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const initialForceUsd = !isOxxo && (body.isRestrictedRetry || isRestrictedCurrency(country));

    // Crea la sesión en la moneda local del comprador o, con forceUsd, en dólares.
    // Si Stripe no acepta la moneda local (ej. cuenta sin esa moneda), se reintenta solo en USD: el comprador nunca ve un error por la moneda.
    const createSession = async (forceUsd: boolean): Promise<{ session: { url?: string | null } } | { tooSmall: true }> => {
    const targetCurrency = isOxxo ? "mxn" : forceUsd ? "usd" : currency;

    // --- LÓGICA DE ENVÍO (idéntica a create-checkout-prueba) ---
    const isPhysical = pricing.items.some(i => i.isPhysical);
    const tier = tierForCountry(country);
    const isLatam = tier === "latam";
    const shippingUsdBase = isLatam ? 9 : 8;

    const subtotalUsd = pricing.items.reduce((sum, it) => sum + (it.unitUsd * it.quantity), 0);
    const hasUpsell = pricing.items.length > 1;
    const shippingUsd = (isPhysical && !hasUpsell) ? (subtotalUsd >= 50 ? 0 : shippingUsdBase) : 0;

    let shippingAmountCents = 0;
    if (shippingUsd > 0 && !hasUpsell) {
      if (targetCurrency === "usd") {
        shippingAmountCents = toStripeAmount(shippingUsd, targetCurrency);
      } else {
        const shippingLocal = await localAmountFromUsd(shippingUsd, targetCurrency.toUpperCase());
        if (shippingLocal) {
          shippingAmountCents = toStripeAmount(shippingLocal, targetCurrency);
        } else {
          shippingAmountCents = toStripeAmount(shippingUsd, targetCurrency);
        }
      }
    }

    const line_items = await Promise.all(pricing.items.map(async (item) => {
      let unit_amount;
      if (targetCurrency === "usd") {
        unit_amount = toStripeAmount(item.unitUsd * discountMultiplier, targetCurrency);
      } else {
        const rate = await localAmountFromUsd(1, targetCurrency.toUpperCase()) || 1;
        const override = item.localPrices?.[targetCurrency.toUpperCase()];
        const regionalUsd = item.localUsdPrices?.[targetCurrency.toUpperCase()];
        const activeUsd = (typeof regionalUsd === "number" && regionalUsd > 0) ? regionalUsd : item.unitUsd;

        let localUnit = (typeof override === "number" && override > 0)
          ? override
          : activeUsd * rate;

        unit_amount = toStripeAmount(localUnit * discountMultiplier, targetCurrency);
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

    if (totalCents < 50) return { tooSmall: true };

    const fullName = `${body.contact.firstName} ${body.contact.lastName}`.trim().slice(0, 100);

    const productSummary = pricing.items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(" · ")
      .slice(0, 300);
    const deliverySkus = normalizeSkus(pricing.items.map((i) => i.sku)).join(",").slice(0, 490);

    const checkoutMetadata = {
      // CAMBIO: marca el origen para distinguir en reportes los pagos que
      // llegaron por el botón de emergencia anti-AdBlock.
      source: "checkout-hosted-fallback",
      pay_method: isOxxo ? "oxxo" : "card",
      customer_email: body.contact.email,
      customer_name: fullName,
      customer_country: body.contact.country,
      ship_address: String((body.contact as any).address ?? "").slice(0, 160),
      ship_city: String((body.contact as any).city ?? "").slice(0, 80),
      ship_state: String((body.contact as any).state ?? "").slice(0, 80),
      ship_zip: String((body.contact as any).zip ?? "").slice(0, 24),
      coupon_code: pricing.couponCode ?? "",
      coupon_percent: String(pricing.couponPercent),
      fbc: body.meta?.fbc ?? "",
      fbp: body.meta?.fbp ?? "",
      cip: !body.meta ? "" : (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 64),
      cua: !body.meta ? "" : (req.headers.get("user-agent") || "").slice(0, 400),
      items_count: String(pricing.items.length),
      items_summary: productSummary,
      skus: deliverySkus,
      shipping_usd: String(shippingUsd),
    };

    console.log(`[Stripe Hosted Fallback] Creating session. TargetCurrency: ${targetCurrency}, Total: ${totalCents}, Country: ${country}`);

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      // Solo tarjeta de crédito/débito (Apple Pay y Google Pay van dentro de "card"). Sin "link" en la lista Stripe no muestra
      // Link ("Confirma que eres tú" con teléfono) ni otros métodos, que confundían al comprador.
      payment_method_types: isOxxo ? ["oxxo"] : ["card"],
      // La ficha de OXXO vale 3 días; después el pedido se cancela solo.
      ...(isOxxo ? { payment_method_options: { oxxo: { expires_after_days: 3 } } } : {}),
      // CAMBIO 1: sin ui_mode → Stripe usa "hosted" (página completa, no iframe).
      // CAMBIO 2: success_url / cancel_url en vez de return_url.
      success_url: body.returnUrl,
      cancel_url: body.cancelUrl ?? body.returnUrl,
      adaptive_pricing: { enabled: !forceUsd && !isOxxo },
      currency: targetCurrency,
      customer_email: body.contact.email,
      payment_intent_data: {
        description: productSummary || "iLingue Relax Digital",
        receipt_email: body.contact.email,
        metadata: checkoutMetadata,
      },
      metadata: checkoutMetadata,
    });
    return { session };
    };

    let created;
    try {
      created = await createSession(initialForceUsd);
    } catch (firstErr) {
      const fe = firstErr as any;
      const currencyRejected = fe?.code === "currency_not_supported" || /currency|adaptive pricing|not supported/i.test(String(fe?.message ?? ""));
      if (initialForceUsd || isOxxo || !currencyRejected) throw firstErr;
      console.warn(`[Stripe Hosted] Moneda ${currency.toUpperCase()} rechazada (${fe?.code ?? fe?.message}); reintentando en USD`);
      created = await createSession(true);
    }
    if ("tooSmall" in created) {
      return new Response(
        JSON.stringify({ error: "El monto total debe ser al menos $0.50 USD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const session = created.session;

    // CAMBIO 3: devolvemos la URL hospedada en vez de clientSecret.
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout-hosted error:", err);
    const e = err as any;
    const stripeCode = e?.code || e?.type || "unknown_error";
    const stripeParam = e?.param || "";
    const stripeType = e?.type || "";
    const oxxoUnavailable = /oxxo/i.test(String(e?.message ?? "")) && /invalid|not.*(enabled|activated|supported)|payment method/i.test(String(e?.message ?? ""));
    const isCurrencyError = !oxxoUnavailable && stripeCode === "currency_not_supported" ||
                           (e?.message && e.message.toLowerCase().includes("not supported"));
    const reason = oxxoUnavailable ? "oxxo_not_available" : isCurrencyError ? "currency_restricted" :
                   ([stripeType, stripeCode, stripeParam].filter(Boolean).join(":").slice(0, 80) || "gateway_error");
    const message = oxxoUnavailable
      ? "OXXO no está disponible por ahora. Elige tarjeta, PayPal o transferencia."
      : isCurrencyError
      ? "Tu banco o región no admite pagos en moneda local. Intenta pagar en USD."
      : (e?.message && e.message.length < 200 && !e.message.includes("api.stripe.com")
          ? e.message
          : "No se pudo iniciar el pago. Intenta nuevamente.");

    return new Response(
      JSON.stringify({ error: message, reason, stripe_code: stripeCode, stripe_param: stripeParam, detail: e?.message }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
