// PayPal directo (flujo por redirección): crea la orden en PayPal y devuelve el enlace de aprobación.
// El precio SIEMPRE se calcula en el servidor (catálogo + cupón), nunca se confía en el navegador.
// Secretos de Supabase: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET (y PAYPAL_ENV=sandbox solo para pruebas).
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { z } from "npm:zod@3.23.8";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { resolveServerPricing, PricingError, localTotalFromPricing } from "../_shared/catalogPricing.ts";

const BodySchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1).max(200),
    quantity: z.number().int().min(1).max(50),
    price: z.number().optional(),
  })).min(1).max(20),
  country: z.string().length(2).optional(),
  couponCode: z.string().max(30).optional(),
  currency: z.string().min(3).max(3).optional(),
  payerEmail: z.string().email(),
  payerName: z.string().max(120).optional(),
  payerPhone: z.string().max(30).optional(),
  orderId: z.string().max(80).optional(),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// Monedas que PayPal acepta y que el checkout ya sabe cobrar; cualquier otra se cobra en USD.
const PAYPAL_CURRENCIES = new Set(["USD", "EUR", "GBP", "MXN", "BRL", "CAD", "AUD"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const paypalBase = () => (Deno.env.get("PAYPAL_ENV") === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com");

async function accessToken(): Promise<string> {
  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET no configurados");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(`PayPal auth ${res.status}: ${data?.error_description || data?.error || "sin token"}`);
  return data.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, 400);
    const body = parsed.data;

    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        country: body.country ?? "US",
        couponCode: body.couponCode,
      });
    } catch (e) {
      if (e instanceof PricingError) return json({ error: e.message }, 400);
      throw e;
    }

    // Moneda: la del comprador si PayPal la acepta y hay precio local; si no, USD.
    const wanted = String(body.currency ?? "USD").toUpperCase();
    let currency = "USD";
    let total = Number(pricing.totalUsd.toFixed(2));
    if (wanted !== "USD" && PAYPAL_CURRENCIES.has(wanted)) {
      const local = await localTotalFromPricing(pricing, wanted);
      if (local != null && local > 0) {
        currency = wanted;
        total = Number(local.toFixed(2));
      }
    }
    if (!(total > 0)) return json({ error: "Total inválido" }, 400);

    const productSummary = pricing.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ").slice(0, 300);
    const skus = normalizeSkus(pricing.items.map((i) => i.sku));
    const orderNumber = (body.orderId ?? `ILR-PP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`).toUpperCase();

    const token = await accessToken();
    const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": `create-${orderNumber}` },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: orderNumber,
          custom_id: orderNumber,
          description: productSummary.slice(0, 127) || "iLingue Relax",
          amount: { currency_code: currency, value: total.toFixed(2) },
        }],
        payment_source: {
          paypal: {
            email_address: body.payerEmail,
            experience_context: {
              brand_name: "iLingue Relax",
              landing_page: "LOGIN",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: body.returnUrl,
              cancel_url: body.cancelUrl,
            },
          },
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    const approveUrl = (data?.links as { rel: string; href: string }[] | undefined)?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
    if (!res.ok || !data?.id || !approveUrl) {
      console.error("PayPal create order error:", res.status, JSON.stringify(data).slice(0, 800));
      const issue = [data?.name, data?.details?.[0]?.issue].filter(Boolean).join(":") || `http_${res.status}`;
      return json({ error: `No pudimos iniciar el pago con PayPal. Intenta de nuevo o elige otro método. (Ref: paypal ${issue})` }, 400);
    }

    await logOrderEvent({
      orderNumber,
      event: "order_created",
      provider: "paypal",
      status: "CREATED",
      method: "PayPal",
      reference: String(data.id),
      detail: productSummary,
      customerEmail: body.payerEmail,
      amount: total,
      currency,
      metadata: {
        skus,
        payerName: body.payerName ?? "",
        payerPhone: body.payerPhone ?? "",
        country: body.country ?? "",
        couponCode: pricing.couponCode ?? "",
        couponPercent: pricing.couponPercent,
        itemsSummary: productSummary,
        paypalOrderId: String(data.id),
      },
    });

    return json({ orderId: orderNumber, paypalOrderId: data.id, approveUrl });
  } catch (err) {
    console.error("paypal-create-order error:", err);
    const detail = (err instanceof Error ? err.message : String(err)).slice(0, 120);
    return json({ error: `No pudimos iniciar el pago con PayPal. Intenta de nuevo en unos segundos. (Ref: ${detail})` }, 400);
  }
});
