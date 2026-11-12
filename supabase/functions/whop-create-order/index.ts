// Whop — crea el pedido de iLingue para pagar con billetera en Colombia (Nequi, Addi), Chile (Mercado Pago) y Argentina (Mercado Pago).
// El navegador solo manda id, cantidad y cupón; aquí se resuelven producto y precio autoritativos (mismos que dLocal y Stripe),
// se guarda el pedido (`order_created`) y se le pide a Whop una «configuración de checkout» con ese importe exacto en la moneda
// local del país. El navegador la abre en el checkout incrustado de Whop (`<Checkout checkoutConfiguration="ch_…">`).
// Si algo falla (sin secretos, Whop no responde, país sin Whop…), responde `whop_not_available`
// y el checkout cobra con la billetera de dLocal Go como siempre.
import { z } from "npm:zod@3.25.76";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { resolveServerPricing, PricingError, localTotalFromPricing } from "../_shared/catalogPricing.ts";
import { buildWhopCheckoutConfig, WHOP_API_BASE, WHOP_API_VERSION_DATE, WHOP_COUNTRIES } from "../_shared/whop.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BodySchema = z.object({
  items: z.array(z.object({ id: z.string().min(1).max(200), quantity: z.number().int().min(1).max(50) })).min(1).max(20),
  couponCode: z.string().max(30).optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(1).max(120),
  payerPhone: z.string().max(30).optional(),
  country: z.string().length(2),
});

const unavailable = (reason: string) => json({ error: "whop_not_available", reason }, 409);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, 400);
    const body = parsed.data;
    const country = body.country.toUpperCase();

    // Whop solo en los países de WHOP_COUNTRIES, en su moneda local y solo con productos digitales.
    const cfg = WHOP_COUNTRIES[country];
    if (!cfg) return unavailable("country_not_supported");
    const apiKey = Deno.env.get("WHOP_API_KEY");
    const productId = Deno.env.get("WHOP_PRODUCT_ID") || undefined; // opcional
    if (!Deno.env.get("WHOP_WEBHOOK_SECRET") || !apiKey) return unavailable("not_configured");

    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity })),
        country,
        couponCode: body.couponCode,
        currency: cfg.currency,
      });
    } catch (e) {
      if (e instanceof PricingError) return json({ error: e.message }, 400);
      throw e;
    }
    if (pricing.items.some((i) => i.isPhysical)) return unavailable("physical_product");

    const localAmount = await localTotalFromPricing(pricing, cfg.currency);
    if (!localAmount || localAmount <= 0) return unavailable("no_local_price");

    const orderId = `ILR-WH-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const skus = normalizeSkus(pricing.items.map((i) => i.sku));
    const description = `iLingue Relax · ${pricing.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ")}`.slice(0, 100);

    // Configuración de checkout en Whop con el importe exacto (reintento corto si Whop tarda).
    const config = buildWhopCheckoutConfig({
      accountId: Deno.env.get("WHOP_ACCOUNT_ID") || undefined,
      productId,
      orderId,
      title: description,
      amount: localAmount,
      currency: cfg.currency,
      methods: cfg.methods,
    });
    let checkoutConfigId = "";
    let whopError = "";
    for (let attempt = 1; attempt <= 2 && !checkoutConfigId; attempt++) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const r = await fetch(`${WHOP_API_BASE}/checkout_configurations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Api-Version-Date": WHOP_API_VERSION_DATE,
          },
          body: JSON.stringify(config),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        const text = await r.text();
        if (r.ok) {
          const parsed = JSON.parse(text);
          if (typeof parsed?.id === "string" && /^ch_[A-Za-z0-9]+$/.test(parsed.id)) checkoutConfigId = parsed.id;
          else whopError = `respuesta sin id: ${text.slice(0, 160)}`;
        } else {
          whopError = `[${r.status}] ${text.slice(0, 200)}`;
          if (r.status < 500 && r.status !== 429) break; // un 4xx no cambia reintentando
        }
      } catch (e) {
        whopError = e instanceof Error ? e.message : String(e);
      }
    }
    if (!checkoutConfigId) {
      console.error("whop-create-order: Whop no creó la configuración:", whopError);
      await logOrderEvent({
        orderNumber: orderId,
        event: "payment_error",
        provider: "whop",
        status: "WHOP_API_ERROR",
        detail: `No se pudo crear el checkout en Whop: ${whopError}`.slice(0, 500),
        customerEmail: body.payerEmail,
        metadata: { country, skus },
      });
      return unavailable("whop_api_error");
    }

    await logOrderEvent({
      orderNumber: orderId,
      event: "order_created",
      provider: "whop",
      status: "CREATED",
      method: "Billetera digital (Whop)",
      detail: description,
      customerEmail: body.payerEmail,
      amount: Number(pricing.totalUsd.toFixed(2)),
      currency: "USD",
      metadata: {
        country,
        skus,
        checkoutConfigId,
        productName: description,
        localAmount,
        localCurrency: cfg.currency,
        customerName: body.payerName,
        customerPhone: body.payerPhone ?? null,
      },
    });

    return json({ orderId, checkoutConfiguration: checkoutConfigId, amount: localAmount, currency: cfg.currency });
  } catch (err) {
    console.error("whop-create-order error:", err);
    return json({ error: "No pudimos iniciar el pago. Intenta de nuevo." }, 500);
  }
});
