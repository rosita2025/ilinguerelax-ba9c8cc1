// dLocal Go — receptor de notificaciones (webhook)
// dLocal Go llama a `notification_url` en cada cambio de estado del pago.
// Seguridad: NUNCA confiamos en el body. Re-consultamos el pago en la API de
// dLocal Go con nuestras credenciales y solo entregamos si está PAID.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { normalizeSkus, splitSkuList } from "../_shared/digitalSku.ts";
import { sendPurchaseCapi } from "../_shared/metaCapi.ts";
import { verifyDlocalSignature } from "../_shared/dlocal.ts";

const API_BASE = "https://api.dlocalgo.com/v1";

function authHeader(): string {
  const apiKey = Deno.env.get("DLOCAL_GO_API_KEY");
  const secretKey = Deno.env.get("DLOCAL_GO_SECRET_KEY");
  if (!apiKey || !secretKey) throw new Error("DLOCAL_GO credentials missing");
  return `Bearer ${apiKey}:${secretKey}`;
}

async function fetchPayment(id: string) {
  const r = await fetch(`${API_BASE}/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: authHeader() },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`dLocal GET /payments/${id} failed [${r.status}]`);
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = url.searchParams;

  try {
    const rawBody = await req.text();

    // 1) Verificación de firma HMAC-SHA256 de dLocal Go (obligatoria).
    const signatureOk = await verifyDlocalSignature(req, rawBody);
    if (!signatureOk) {
      console.warn("dLocal webhook rechazado: firma inválida o ausente");
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown> = {};
    try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { body = {}; }

    const paymentId = String(
      (body as any)?.payment_id ?? (body as any)?.id ?? q.get("payment_id") ?? q.get("id") ?? "",
    ).trim();

    if (!paymentId || !/^[A-Za-z0-9_-]{4,80}$/.test(paymentId)) {
      console.log("dLocal webhook ignorado: payment_id ausente o inválido");
      return new Response(JSON.stringify({ received: true, ignored: "no payment id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Estado real consultado directamente a dLocal Go (nunca del body).
    const payment = await fetchPayment(paymentId);
    const status = String(payment.status || "").toUpperCase();
    const ALLOWED_STATUS = ["PAID", "PENDING", "REJECTED", "CANCELLED", "EXPIRED", "AUTHORIZED", "VERIFIED", "EXPIRED_PARTIAL"];
    if (!ALLOWED_STATUS.includes(status)) {
      console.warn("dLocal webhook: estado desconocido", { paymentId, status });
      return new Response(JSON.stringify({ received: true, ignored: "unknown status" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) El pago debe corresponder a una orden creada por nosotros.
    const expectedOrder = (q.get("order") || "").trim();
    const remoteOrder = String(payment.order_id || "").trim();
    if (expectedOrder && remoteOrder && expectedOrder !== remoteOrder) {
      console.warn("dLocal webhook rechazado: order_id no coincide", { paymentId });
      return new Response(JSON.stringify({ error: "order mismatch" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("dLocal webhook:", { paymentId, status, order: payment.order_id });



    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const orderNumber = String(payment.order_id || q.get("order") || `ILR-DL-${paymentId}`);
    const customerEmail = String(payment.payer?.email || q.get("email") || "").trim().toLowerCase();
    const customerName = String(payment.payer?.name || q.get("name") || customerEmail.split("@")[0] || "Cliente");
    const country = String(payment.country || q.get("country") || "").toUpperCase() || undefined;
    const phone = q.get("phone") || undefined;
    const skus = normalizeSkus(splitSkuList(q.get("skus") ?? ""));
    const summary = q.get("summary") || payment.description || "Producto ILINGUE RELAX";
    const amount = Number(payment.amount ?? q.get("usd") ?? 0) || undefined;
    const currency = String(payment.currency || "USD").toUpperCase();
    const couponCode = (q.get("coupon") || "").trim().toUpperCase() || undefined;
    const couponPctRaw = Number(q.get("coupon_pct"));
    const couponPercent = Number.isFinite(couponPctRaw) && couponPctRaw > 0 ? couponPctRaw : undefined;

    await supabase.from("funnel_events").insert({
      event_name: status === "PAID" ? "Purchase" : `dlocal_${status.toLowerCase()}`,
      product_id: skus[0] || orderNumber,
      value: amount ?? null,
      currency,
      country: country ?? null,
      provider: "dlocalgo",
    }).then(({ error }) => { if (error) console.error("dLocal funnel log failed:", error.message); });

    if (status !== "PAID") {
      return new Response(JSON.stringify({ received: true, status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!customerEmail) {
      console.error("dLocal PAID sin email de comprador", { paymentId, orderNumber });
      return new Response(JSON.stringify({ received: true, warning: "no email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendPurchaseCapi({
      eventId: `Purchase_${orderNumber}`,
      email: customerEmail,
      country: country ?? null,
      value: amount ?? null,
      currency,
      contentIds: skus,
      contentName: summary,
      orderId: orderNumber,
    }).catch((e) => console.error("dLocal CAPI failed:", e));

    try {
      await sendThankYouEmail({
        customerEmail,
        customerName,
        customerPhone: phone,
        customerCountry: country,
        productName: summary,
        skus,
        amount,
        currency,
        provider: "dlocalgo",
        orderNumber,
        idempotencyKey: `dlocal-paid-${paymentId}`,
        couponCode,
        couponPercent,
      });
    } catch (e) {
      console.error("dLocal thank-you failed:", e);
    }

    if (skus.length > 0) {
      const { error: digitalErr } = await supabase.functions.invoke("send-digital-ilinguerelax", {
        body: {
          customerEmail,
          customerName,
          customerPhone: phone,
          customerCountry: country,
          orderId: orderNumber,
          skus,
          amount,
          currency,
          provider: "dlocalgo",
          idempotencyKey: `digital:dlocal:${paymentId}`,
        },
      });
      if (digitalErr) console.error("dLocal digital delivery failed:", digitalErr);
    } else {
      console.warn("dLocal PAID sin SKUs de entrega", { paymentId, orderNumber });
    }

    return new Response(JSON.stringify({ received: true, status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("dlocal-webhook error:", err);
    return new Response(JSON.stringify({ error: "internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
