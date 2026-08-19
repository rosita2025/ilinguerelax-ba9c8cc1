// dLocal Go — cobro con tarjeta usando un token de SmartFields.
// El navegador nunca envía el PAN a nuestro backend: SmartFields tokeniza la
// tarjeta en dLocal y aquí solo recibimos el token de un solo uso.
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { z } from "npm:zod@3.23.8";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { resolveServerPricing, PricingError, localTotalFromPricing } from "../_shared/catalogPricing.ts";
import { dlocalApiBase } from "../_shared/dlocal.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";

// SEGURIDAD: precio/nombre del cliente se ignoran; se resuelven en servidor.
const ItemSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().max(300).optional(),
  price: z.number().optional(),
  quantity: z.number().int().min(1).max(50),
});

const BodySchema = z.object({
  orderId: z.string().min(1).max(80).optional(),
  cardToken: z.string().min(8).max(200),
  installments: z.number().int().min(1).max(24).optional(),
  items: z.array(ItemSchema).min(1).max(20),
  couponPercent: z.number().min(0).max(100).optional(),
  couponCode: z.string().max(20).optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(1).max(120),
  payerPhone: z.string().max(30).optional(),
  payerDocument: z.string().max(30).optional(),
  payerAddress: z.string().max(160).optional(),
  payerCity: z.string().max(80).optional(),
  payerState: z.string().max(80).optional(),
  payerZip: z.string().max(24).optional(),
  country: z.string().length(2),
  currency: z.string().length(3).default("USD"),
  // Ignorados: el importe se calcula en el servidor (catálogo + FX propio).
  amount: z.number().positive().max(200000).optional(),
  expectedTotalUsd: z.number().positive().max(200000).optional(),

  successUrl: z.string().url(),
  backUrl: z.string().url(),
});

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Cobro con tarjeta vía dLocal DESACTIVADO: solo transferencia y efectivo.
const DLOCAL_CARD_ENABLED = false;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!DLOCAL_CARD_ENABLED) {
    return json({ error: "El pago con tarjeta por dLocal está desactivado. Usa transferencia bancaria o pago en efectivo." }, 403);
  }



  const apiKey = Deno.env.get("DLOCAL_GO_API_KEY");
  const secretKey = Deno.env.get("DLOCAL_GO_SECRET_KEY");
  if (!apiKey || !secretKey) return json({ error: "dLocal Go no está configurado" }, 500);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const body = parsed.data;

    // Total autoritativo desde el catálogo (evita manipulación del carrito).
    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        country: body.country,
        couponCode: body.couponCode,
      });
    } catch (e) {
      if (e instanceof PricingError) return json({ error: e.message }, 400);
      throw e;
    }
    const calculatedUsd = Number(pricing.totalUsd.toFixed(2));
    // SEGURIDAD: el importe del navegador se descarta por completo.
    const clientUsd = body.expectedTotalUsd ?? null;
    if (clientUsd && Math.abs(calculatedUsd - clientUsd) > 0.01) {
      console.warn("cart total mismatch (ignorado)", { clientUsd, calculatedUsd });
    }
    const requestedCurrency = body.currency.toUpperCase();
    const serverLocal = requestedCurrency === "USD" ? null : await localTotalFromPricing(pricing, requestedCurrency);
    const chargeCurrency = serverLocal == null ? "USD" : requestedCurrency;
    const chargeAmount = serverLocal == null ? calculatedUsd : serverLocal;


    const orderId = body.orderId ?? `ILR-DLC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const skus = normalizeSkus(pricing.items.map((i) => i.sku));
    const description = `iLingue Relax · ${pricing.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ")}`.slice(0, 250);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const notifyParams = new URLSearchParams({
      order: orderId,
      email: body.payerEmail,
      name: body.payerName,
      country: body.country.toUpperCase(),
      skus: skus.join(","),
      summary: description,
      usd: String(calculatedUsd),
      ...(pricing.couponCode ? { coupon: pricing.couponCode } : {}),
      ...(pricing.couponPercent ? { coupon_pct: String(pricing.couponPercent) } : {}),
      ...(body.payerPhone ? { phone: body.payerPhone } : {}),
    });
    const notificationUrl = supabaseUrl
      ? `${supabaseUrl}/functions/v1/dlocal-webhook?${notifyParams.toString()}`
      : undefined;

    const payload: Record<string, unknown> = {
      // Importe autoritativo del servidor (catálogo + tasa FX propia).
      amount: chargeAmount,
      currency: chargeCurrency,

      country: body.country.toUpperCase(),
      order_id: orderId,
      description,
      success_url: body.successUrl,
      back_url: body.backUrl,
      payment_method_id: "CARD",
      payment_method_flow: "DIRECT",
      card: {
        token: body.cardToken,
        installments: body.installments ?? 1,
        capture: true,
        save: false,
      },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      payer: {
        name: body.payerName.slice(0, 100),
        email: body.payerEmail,
        ...(body.payerPhone ? { phone: body.payerPhone } : {}),
        ...(body.payerDocument ? { document: body.payerDocument } : {}),
        ...(body.payerAddress ? {
          address: {
            street: body.payerAddress,
            city: body.payerCity,
            state: body.payerState,
            zip_code: body.payerZip,
            country: body.country.toUpperCase(),
          },
        } : {}),
      },
    };


    const resp = await fetch(`${dlocalApiBase()}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}:${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error(`dLocal SmartFields payment failed [${resp.status}]: ${text}`);
      return json({ error: "La tarjeta fue rechazada. Intenta con otra o elige otro método." }, 402);
    }

    const data = JSON.parse(text);
    const status = String(data.status || "").toUpperCase();
    // 3DS / verificación adicional: dLocal devuelve una URL de redirección.
    const redirectUrl = data.redirect_url || data.redirectUrl || null;

    // Guarda la dirección de envío para que el webhook pueda crear el envío físico.
    await logOrderEvent({
      orderNumber: orderId,
      event: "order_created",
      provider: "dlocalgo",
      status,
      method: "card",
      reference: String(data.id ?? ""),
      customerEmail: body.payerEmail,
      amount: calculatedUsd,
      currency: "USD",
      metadata: {
        country: body.country.toUpperCase(),
        skus,
        customerName: body.payerName,
        customerPhone: body.payerPhone ?? null,
        shipping: {
          address: body.payerAddress ?? null,
          city: body.payerCity ?? null,
          state: body.payerState ?? null,
          zip: body.payerZip ?? null,
          country: body.country.toUpperCase(),
        },
      },
    });

    return json({ id: data.id, orderId, status, redirect_url: redirectUrl });
  } catch (err) {
    console.error("dlocal-create-card-payment error:", err);
    return json({ error: "No se pudo procesar el pago" }, 500);
  }
});
