import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resend } from "../_shared/brevo.ts";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { normalizeSkus, splitSkuList } from "../_shared/digitalSku.ts";
import { sendPurchaseCapi } from "../_shared/metaCapi.ts";
import { invokeInternalFunction } from "../_shared/invokeInternal.ts";
import { upsertPhysicalShipment } from "../_shared/physicalShipments.ts";

// NOTE: We do NOT instantiate the Stripe SDK here. There is no STRIPE_SECRET_KEY
// in this project; API keys are opaque gateway connection IDs. Webhook signature
// verification only needs HMAC-SHA256 against PAYMENTS_*_WEBHOOK_SECRET, so we
// verify manually (same approach as the shared verifyWebhook helper) and try
// both live and sandbox secrets so one endpoint serves both environments.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const encoder = new TextEncoder();
const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

function parseStripeSig(header: string): { t?: string; v1: string[] } {
  const v1: string[] = [];
  let t: string | undefined;
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k === "t") t = v;
    if (k === "v1") v1.push(v);
  }
  return { t, v1 };
}

async function verifyStripeSignature(body: string, sigHeader: string): Promise<
  { ok: true; env: "live" | "sandbox" } | { ok: false; reason: string }
> {
  const { t, v1 } = parseStripeSig(sigHeader);
  if (!t || v1.length === 0) return { ok: false, reason: "malformed stripe-signature header" };
  // 5 min tolerance
  const age = Math.abs(Date.now() / 1000 - Number(t));
  if (!Number.isFinite(age) || age > 300) return { ok: false, reason: `timestamp out of tolerance (${age}s)` };

  const candidates: Array<{ env: "live" | "sandbox"; secret: string }> = [];
  const live = Deno.env.get("PAYMENTS_LIVE_WEBHOOK_SECRET");
  const sandbox = Deno.env.get("PAYMENTS_SANDBOX_WEBHOOK_SECRET");
  if (live) candidates.push({ env: "live", secret: live });
  if (sandbox) candidates.push({ env: "sandbox", secret: sandbox });
  if (candidates.length === 0) return { ok: false, reason: "no webhook secret configured" };

  for (const c of candidates) {
    const expected = await hmacSha256Hex(c.secret, `${t}.${body}`);
    if (v1.includes(expected)) return { ok: true, env: c.env };
  }
  return { ok: false, reason: "no matching v1 signature" };
}

async function raiseStripeAlert(reason: string, severity: "warn" | "error" | "critical", extra: Record<string, unknown> = {}) {
  console.error(`[Stripe ALERT ${severity}] ${reason}`, extra);
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    let notified = false;
    if (severity !== "warn") {
      try {
        const r = await resend.emails.send({
          from: "Alertas ILINGUE <hola@ilinguerelax.com>",
          to: ["hola@ilinguerelax.com"],
          subject: `[Stripe Webhook ${severity.toUpperCase()}] ${reason}`,
          html: `<h2>Stripe Webhook Alert</h2>
            <p><b>Severity:</b> ${severity}</p>
            <p><b>Reason:</b> ${reason}</p>
            <pre style="background:#f4f4f4;padding:8px;overflow:auto;font-size:12px">${JSON.stringify(extra, null, 2).slice(0, 3000)}</pre>`,
        });
        notified = !!r;
      } catch (e) { console.error("Stripe alert email failed:", e); }
    }
    await admin.from("webhook_alerts").insert({
      provider: "stripe", severity, reason,
      event_type: (extra.event_type as string) ?? null,
      http_status: (extra.http_status as number) ?? null,
      payload: extra, notified,
    });
  } catch (e) { console.error("raiseStripeAlert failed:", e); }
}

const labelStripeProduct = (session: any) => {
  const amount = (session.amount_total || 0) / 100;
  const currency = (session.currency || "usd").toUpperCase();
  if (Math.round(amount) === 22) {
    return { product_id: "product-spanish-5000-digital", content_name: "Spanish Relax - 5,000 Words (Digital)", value: amount, currency };
  }
  if (amount >= 30) {
    return { product_id: "product-spanish-5000-physical", content_name: "Spanish Relax - 5,000 Words (Physical)", value: amount, currency };
  }
  return { product_id: "stripe-checkout", content_name: "Stripe Checkout Purchase", value: amount, currency };
};

const getAdminClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const getPaymentIntentId = (session: any): string | undefined => {
  const pi = session?.payment_intent;
  if (!pi) return undefined;
  return typeof pi === "string" ? pi : pi.id;
};

const hasAsyncStripeMethod = (methodTypes: unknown): boolean => {
  const list = Array.isArray(methodTypes) ? methodTypes.map((m) => String(m)) : [];
  return list.some((m) => m === "us_bank_account" || m === "cashapp");
};

async function recordStripePurchase(params: {
  adminClient: any;
  eventKey: string;
  sourceId: string;
  paymentIntentId?: string;
  customerEmail: string;
  customerName: string;
  customerCountry?: string | null;
  purchase: { product_id: string; content_name: string; value: number; currency: string };
  itemsSummary?: string;
  skus?: string;
  eventType: string;
}): Promise<{ alreadyRecorded: boolean }> {
  const { adminClient, eventKey, sourceId, paymentIntentId, customerEmail, customerName, customerCountry, purchase, itemsSummary, skus, eventType } = params;
  const { data: existing } = await adminClient
    .from("funnel_events")
    .select("id")
    .eq("event_name", "Purchase")
    .eq("session_id", eventKey)
    .maybeSingle();
  if (existing) {
    console.log("[stripe-webhook] purchase already recorded; skipping re-processing", { eventKey });
    return { alreadyRecorded: true };
  }

  // Inserción idempotente: el índice único parcial
  // funnel_events_stripe_purchase_unique impide que dos eventos simultáneos
  // (checkout.session.completed + payment_intent.succeeded, o un reintento de
  // Stripe) registren el mismo cobro dos veces y disparen correos duplicados.
  const { error: insertError } = await adminClient.from("funnel_events").insert({
    event_name: "Purchase",
    product_id: purchase.product_id,
    value: purchase.value,
    currency: purchase.currency,
    session_id: eventKey,
    page_path: "/payment-success",
    country: customerCountry || null,
    provider: "stripe",
    email: customerEmail,
    name: customerName,
    referrer: JSON.stringify({
      provider: "stripe",
      event_type: eventType,
      session_id: sourceId,
      payment_intent_id: paymentIntentId || null,
      external_reference: eventKey ? `ILR-ST-${String(eventKey).slice(-8).toUpperCase()}` : undefined,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_country: customerCountry || null,
      items_summary: itemsSummary || purchase.content_name,
      skus: skus || "",
      status: "approved",
    }).slice(0, 2000),
  });

  if (insertError) {
    if ((insertError as any).code === "23505") {
      console.log("[stripe-webhook] concurrent duplicate purchase discarded", { eventKey });
      return { alreadyRecorded: true };
    }
    throw insertError;
  }


  // Meta Conversions API (server-side) so the sale shows up in Facebook Ads
  // even if the buyer never lands back on the success page.
  const orderId = eventKey ? `ILR-ST-${String(eventKey).slice(-8).toUpperCase()}` : sourceId;
  await sendPurchaseCapi({
    eventId: `Purchase_${orderId}`,
    email: customerEmail,
    country: customerCountry,
    value: purchase.value,
    currency: purchase.currency,
    contentIds: (skus ? splitSkuList(skus) : [purchase.product_id]).filter(Boolean),
    contentName: purchase.content_name,
    orderId,
  });

  return { alreadyRecorded: false };
}

async function sendStripePurchaseEmails(params: {
  adminClient: any;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerCountry?: string;
  purchase: { content_name: string; value: number; currency: string };
  orderNumber: string;
  paymentKey: string;
  skus: string[];
  couponCode?: string;
  couponPercent?: number;
  couponAmount?: number;
}) {
  const { adminClient, customerEmail, customerName, customerPhone, customerCountry, purchase, orderNumber, paymentKey, skus, couponCode, couponPercent, couponAmount } = params;
  // Historial visible en /mi-pedido: dejamos el pago aprobado en order_events
  // igual que dLocal/Mercado Pago para que el cliente vea el mismo detalle.
  try {
    await adminClient.from("order_events").insert({
      order_number: orderNumber,
      customer_email: customerEmail,
      provider: "stripe",
      event: "payment_paid",
      status: "paid",
      method: "card",
      reference: paymentKey,
      amount: purchase.value,
      currency: purchase.currency,
      metadata: { skus, source: "stripe-webhook" },
    });
  } catch (e) {
    console.error("[stripe-webhook] order_events payment_paid insert failed:", e);
  }
  // Siempre enviamos "Gracias por tu compra" (con producto y precio).
  // Si además hay SKUs digitales, luego se dispara la entrega de materiales.
  await sendThankYouEmail({
    customerEmail,
    customerName,
    customerPhone,
    customerCountry,
    productName: purchase.content_name,
    skus,
    amount: purchase.value,
    currency: purchase.currency,
    provider: "stripe",
    orderNumber,
    idempotencyKey: `stripe:${paymentKey}`,
    couponCode,
    couponPercent,
    couponAmount,
  });
  if (skus.length === 0) {
    console.log("[stripe-webhook] no skus in metadata; skipping digital delivery", { paymentKey });
    return;
  }

  const deliveryBody = {
    customerEmail,
    customerName,
    customerPhone,
    customerCountry,
    orderId: orderNumber,
    skus,
    amount: purchase.value,
    currency: purchase.currency,
    provider: "stripe",
    idempotencyKey: `digital:stripe:${paymentKey}`,
  };

  // Un reintento inmediato: el token de descarga es idempotente por idempotencyKey.
  let digitalErr = (await invokeInternalFunction("send-digital-ilinguerelax", deliveryBody)).error;
  if (digitalErr) {
    console.error("send-digital-ilinguerelax webhook invoke failed (retrying):", digitalErr);
    digitalErr = (await invokeInternalFunction("send-digital-ilinguerelax", deliveryBody)).error;
  }
  if (digitalErr) {
    console.error("send-digital-ilinguerelax webhook invoke failed:", digitalErr);
    // Registro persistente para /admin (no bloquea el 200 al webhook).
    try {
      await adminClient.from("order_events").insert({
        order_number: orderNumber,
        customer_email: customerEmail,
        provider: "stripe",
        event: "digital_delivery_error",
        status: "error",
        detail: String(digitalErr.message ?? digitalErr).slice(0, 500),
        amount: purchase.value,
        currency: purchase.currency,
        metadata: { skus },
      });
      await adminClient.from("digital_delivery_alerts").insert({
        source: "stripe-webhook",
        source_ref: orderNumber,
        customer_email: customerEmail,
        reason: "delivery_invoke_failed",
        details: { error: String(digitalErr.message ?? digitalErr).slice(0, 500), skus },
      });
    } catch (logErr) {
      console.error("stripe delivery error logging failed:", logErr);
    }
  }
}


// Extrae info de cupón desde session.metadata (checkout propio) o total_details (Stripe promo codes)
function extractStripeCoupon(source: any): { couponCode?: string; couponPercent?: number; couponAmount?: number } {
  const md = source?.metadata || {};
  const codeMeta = String(md.coupon_code || "").trim().toUpperCase() || undefined;
  const pctMeta = Number(md.coupon_percent);
  const couponPercent = Number.isFinite(pctMeta) && pctMeta > 0 ? pctMeta : undefined;
  const amountDiscount = Number(source?.total_details?.amount_discount || 0);
  const couponAmount = amountDiscount > 0 ? Number((amountDiscount / 100).toFixed(2)) : undefined;
  const discountCode =
    source?.total_details?.breakdown?.discounts?.[0]?.discount?.promotion_code?.code ||
    source?.total_details?.breakdown?.discounts?.[0]?.discount?.coupon?.name ||
    undefined;
  const couponCode = codeMeta || (discountCode ? String(discountCode).toUpperCase() : undefined);
  return { couponCode, couponPercent, couponAmount };
}

async function handlePaidCheckoutSession(session: any, eventType: string) {
  if (session.payment_status !== "paid") {
    console.log("[stripe-webhook] checkout session not paid yet; waiting for async success", {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      eventType,
    });
    return { delivered: false, reason: "payment_not_paid" };
  }

  const customerEmail = session.customer_email || session.customer_details?.email || session.metadata?.customer_email;
  const customerName = session.customer_details?.name || session.metadata?.customer_name || session.metadata?.name || (customerEmail ? customerEmail.split("@")[0] : "Cliente");
  if (!customerEmail) {
    console.log("No customer email found in session");
    return { delivered: false, reason: "missing_email" };
  }

  const adminClient = getAdminClient();
  const purchase = await labelStripeProduct(session);
  const paymentKey = getPaymentIntentId(session) || session.id;
  const orderNumber = `ILR-ST-${String(paymentKey).slice(-8).toUpperCase()}`;
  const skus = normalizeSkus(splitSkuList(session.metadata?.skus));

  let alreadyRecorded = false;
  try {
    const rec = await recordStripePurchase({
      adminClient,
      eventKey: paymentKey,
      sourceId: session.id,
      paymentIntentId: getPaymentIntentId(session),
      customerEmail,
      customerName,
      customerCountry: session.customer_details?.address?.country || session.metadata?.customer_country,
      purchase,
      itemsSummary: session.metadata?.items_summary,
      skus: session.metadata?.skus,
      eventType,
    });
    alreadyRecorded = rec.alreadyRecorded;
  } catch (trackingError) {
    console.error("purchase tracking error:", trackingError);
  }

  // Reproceso de un evento antiguo (reintento/reenvío manual de Stripe, o el
  // mismo pago llegando por checkout.session.* y payment_intent.succeeded):
  // el cobro ya se procesó, así que NO se reenvían correos ni la entrega.
  if (alreadyRecorded) {
    return { delivered: false, reason: "already_processed" };
  }

  const coupon = extractStripeCoupon(session);
  await sendStripePurchaseEmails({
    adminClient,
    customerEmail,
    customerName,
    customerPhone: session.customer_details?.phone || session.metadata?.customer_phone || undefined,
    customerCountry: session.customer_details?.address?.country || session.metadata?.customer_country || undefined,
    purchase,
    orderNumber,
    paymentKey,
    skus,
    ...coupon,
  });

  await upsertPhysicalShipment({
    adminClient,
    orderNumber,
    email: customerEmail,
    customerName,
    provider: "stripe",
    address: {
      address: session.customer_details?.address?.line1 || session.metadata?.ship_address,
      city: session.customer_details?.address?.city || session.metadata?.ship_city,
      state: session.customer_details?.address?.state || session.metadata?.ship_state,
      zip: session.customer_details?.address?.postal_code || session.metadata?.ship_zip,
      country: session.customer_details?.address?.country || session.metadata?.customer_country,
    },
    skus,
  });

  return { delivered: true };
}

async function handleSucceededPaymentIntent(paymentIntent: any, eventType: string) {
  const metadata = paymentIntent.metadata || {};
  if (metadata.source !== "checkout-prueba-1" && !metadata.skus) {
    console.log("[stripe-webhook] payment_intent.succeeded ignored; no checkout metadata", { paymentIntentId: paymentIntent.id });
    return { delivered: false, reason: "not_checkout" };
  }
  if (!hasAsyncStripeMethod(paymentIntent.payment_method_types)) {
    console.log("[stripe-webhook] payment_intent.succeeded ignored for immediate method", { paymentIntentId: paymentIntent.id });
    return { delivered: false, reason: "immediate_method" };
  }

  const customerEmail = paymentIntent.receipt_email || metadata.customer_email;
  const customerName = metadata.customer_name || metadata.name || (customerEmail ? customerEmail.split("@")[0] : "Cliente");
  if (!customerEmail) {
    console.log("[stripe-webhook] payment_intent.succeeded missing customer email", { paymentIntentId: paymentIntent.id });
    return { delivered: false, reason: "missing_email" };
  }

  const adminClient = getAdminClient();
  const purchase = {
    product_id: "stripe-checkout",
    content_name: metadata.items_summary || "iLingue Relax Digital",
    value: Number(((paymentIntent.amount_received || paymentIntent.amount || 0) / 100).toFixed(2)),
    currency: String(paymentIntent.currency || "usd").toUpperCase(),
  };
  const paymentKey = paymentIntent.id;
  const orderNumber = `ILR-ST-${String(paymentKey).slice(-8).toUpperCase()}`;
  const skus = normalizeSkus(splitSkuList(metadata.skus));

  let alreadyRecordedPi = false;
  try {
    const rec = await recordStripePurchase({
      adminClient,
      eventKey: paymentKey,
      sourceId: paymentIntent.id,
      paymentIntentId: paymentIntent.id,
      customerEmail,
      customerName,
      customerCountry: metadata.customer_country,
      purchase,
      itemsSummary: metadata.items_summary,
      skus: metadata.skus,
      eventType,
    });
    alreadyRecordedPi = rec.alreadyRecorded;
  } catch (trackingError) {
    console.error("purchase tracking error:", trackingError);
  }

  if (alreadyRecordedPi) {
    return { delivered: false, reason: "already_processed" };
  }

  const coupon = extractStripeCoupon(paymentIntent);
  await sendStripePurchaseEmails({
    adminClient,
    customerEmail,
    customerName,
    customerPhone: metadata.customer_phone || undefined,
    customerCountry: metadata.customer_country || undefined,
    purchase,
    orderNumber,
    paymentKey,
    skus,
    ...coupon,
  });

  await upsertPhysicalShipment({
    adminClient,
    orderNumber,
    email: customerEmail,
    customerName,
    provider: "stripe",
    address: {
      address: metadata.ship_address,
      city: metadata.ship_city,
      state: metadata.ship_state,
      zip: metadata.ship_zip,
      country: metadata.customer_country,
    },
    skus,
  });

  return { delivered: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      // Bot/scanner golpeando la URL pública sin header. Sin correo, sin alerta.
      console.log("Stripe webhook rejected: missing stripe-signature (probable bot/scanner)");
      return new Response("Missing signature", { status: 400 });
    }

    const verified = await verifyStripeSignature(body, sig);
    if (!verified.ok) {
      // Firma inválida = bot/scanner. Stripe nunca movió dinero. Silencio total.
      console.log("Stripe webhook rejected: invalid signature (probable bot/scanner)", { reason: verified.reason });
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    console.log("Webhook event received:", event.type, event.id);

    // Eventos rancios: Stripe reintenta hasta 3 días y el panel permite reenviar
    // eventos a mano. Un pago de ayer NO debe volver a disparar correos hoy.
    const eventCreated = Number(event?.created);
    if (Number.isFinite(eventCreated)) {
      const ageHours = (Date.now() / 1000 - eventCreated) / 3600;
      if (ageHours > 24) {
        console.warn("[stripe-webhook] stale event ignored (no emails/delivery)", {
          eventId: event.id, type: event.type, ageHours: Math.round(ageHours),
        });
        return new Response(JSON.stringify({ received: true, ignored: "stale_event" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as any;
      const result = await handlePaidCheckoutSession(session, event.type);


      return new Response(
        JSON.stringify({ received: true, ...result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (event.type === "payment_intent.succeeded") {
      const result = await handleSucceededPaymentIntent(event.data.object as any, event.type);
      return new Response(
        JSON.stringify({ received: true, ...result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (event.type === "checkout.session.async_payment_failed" || event.type === "payment_intent.payment_failed") {
      console.warn("[stripe-webhook] async payment failed; no digital delivery", {
        eventType: event.type,
        id: event.data?.object?.id,
        metadata: event.data?.object?.metadata || {},
      });
      return new Response(JSON.stringify({ received: true, delivered: false, reason: "payment_failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // El detalle queda solo en los logs del servidor; al cliente/Stripe se le
    // devuelve un mensaje genérico para no filtrar internals.
    console.error("Webhook error:", errorMessage);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

});
