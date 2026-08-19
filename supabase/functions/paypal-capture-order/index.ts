// Capture a PayPal order server-side after buyer approves in the popup.
const corsHeaders = { 
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-correlation-id, x-trace-id, x-requested-with", 
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "x-correlation-id, x-trace-id"
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { invokeInternalFunction } from "../_shared/invokeInternal.ts";

const PAYPAL_ENV = (Deno.env.get("PAYPAL_ENV") ?? "live").toLowerCase() === "sandbox" ? "sandbox" : "live";
const PAYPAL_BASE = PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

function parseSkus(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const sku = String(item ?? "").trim().slice(0, 180);
    if (!sku || seen.has(sku)) continue;
    seen.add(sku);
    out.push(sku);
  }
  return out;
}

function cleanString(value: unknown, max: number): string | undefined {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : undefined;
}

async function getAccessToken(): Promise<string> {
  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET");
  if (!id || !secret) throw new Error("PayPal credentials not configured");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${id}:${secret}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const traceId = crypto.randomUUID();
  const t0 = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId ?? "").trim();
    const checkoutEmail = cleanString(body.buyerEmail, 254);
    const checkoutName = cleanString(body.buyerName, 120);
    const checkoutPhone = cleanString(body.buyerPhone, 40);
    const checkoutCountry = cleanString(body.buyerCountry, 2)?.toUpperCase();
    const skus = parseSkus(body.skus);
    // Correlation id from header or body; falls back to server-side trace.
    const rawCorr = String(req.headers.get("x-correlation-id") ?? req.headers.get("X-Correlation-Id") ?? body.correlationId ?? "").slice(0, 64);
    const clientCorr = /^[A-Za-z0-9._:-]{6,64}$/.test(rawCorr) ? rawCorr : null;
    const correlationId = clientCorr ?? `srv-${traceId}`;
    console.log(JSON.stringify({ corr: correlationId, trace: traceId, fn: "paypal-capture-order", phase: "input", env: PAYPAL_ENV, orderId, clientProvided: !!clientCorr, skuCount: skus.length, hasCheckoutEmail: !!checkoutEmail }));
    if (!/^[A-Z0-9]{5,32}$/i.test(orderId)) {
      console.warn(JSON.stringify({ corr: correlationId, trace: traceId, fn: "paypal-capture-order", phase: "reject", reason: "invalid_orderId", orderId }));
      return new Response(JSON.stringify({ error: "Invalid orderId", trace: traceId, correlationId }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId, "x-trace-id": traceId },
      });
    }
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `cap-${correlationId}`,
      },
    });
    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error(JSON.stringify({ corr: correlationId, trace: traceId, fn: "paypal-capture-order", phase: "json_parse_error", status: res.status, ms: Date.now() - t0 }));
      throw new Error(`Error al procesar respuesta de captura (${res.status})`);
    }

    if (!res.ok) {
      console.error(JSON.stringify({
        corr: correlationId, trace: traceId, fn: "paypal-capture-order", phase: "paypal_error",
        status: res.status, error: data, orderId, ms: Date.now() - t0,
      }));

      // Extraer mensaje de error legible
      let errorMessage = "No se pudo completar el pago en PayPal";
      if (data?.details?.[0]?.description) {
        errorMessage = `PayPal: ${data.details[0].description}`;
      } else if (data?.message) {
        errorMessage = `PayPal: ${data.message}`;
      }

      return new Response(JSON.stringify({ 
        error: errorMessage, 
        details: data,
        trace: traceId, 
        correlationId 
      }), {
        status: res.status >= 400 && res.status < 500 ? res.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId, "x-trace-id": traceId },
      });
    }
    const status = data.status; // COMPLETED expected
    // Extract audit-friendly amounts from the capture payload.
    const pu = Array.isArray(data.purchase_units) ? data.purchase_units[0] : undefined;
    const cap = pu?.payments?.captures?.[0];
    const capturedAmount = cap?.amount?.value ?? null;
    const capturedCurrency = cap?.amount?.currency_code ?? null;
    const captureId = cap?.id ?? null;
    const payerEmail = data.payer?.email_address ?? null;
    const payerCountry = data.payer?.address?.country_code ?? null;
    // Confirm the correlation id we sent on create came back on the order.
    const echoedCorr = pu?.reference_id ?? pu?.custom_id ?? null;
    const corrMatches = echoedCorr === correlationId;
    console.log(JSON.stringify({
      corr: correlationId, trace: traceId, fn: "paypal-capture-order", phase: "captured",
      orderId, captureId, status,
      amount: capturedAmount, currency: capturedCurrency,
      payerCountry, hasPayerEmail: !!payerEmail,
      echoedCorr, corrMatches,
      ms: Date.now() - t0,
    }));
    if (status === "COMPLETED" && (payerEmail || checkoutEmail)) {
      console.log(JSON.stringify({ corr: correlationId, trace: traceId, fn: "paypal-capture-order", phase: "processing_completion", orderId }));
      const payerName = checkoutName || [data.payer?.name?.given_name, data.payer?.name?.surname].filter(Boolean).join(" ").trim() || undefined;
      const customerEmail = checkoutEmail || payerEmail;
      const customerCountry = checkoutCountry || payerCountry || undefined;
      const productName = pu?.description || pu?.items?.[0]?.name || "Pedido iLingue Relax";
      const paidOrderNumber = captureId ? `ILR-PP-${String(captureId).slice(-8).toUpperCase()}` : String(orderId);
      // Historial visible en /mi-pedido (mismo formato que Stripe/dLocal/MP).
      try {
        const eventsClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await eventsClient.from("order_events").insert({
          order_number: paidOrderNumber,
          customer_email: customerEmail,
          provider: "paypal",
          event: "payment_paid",
          status: "paid",
          method: "paypal",
          reference: captureId ?? String(orderId),
          amount: capturedAmount ? Number(capturedAmount) : null,
          currency: capturedCurrency ?? "USD",
          metadata: { skus, correlationId },
        });
      } catch (e) {
        console.error("[paypal-capture-order] order_events payment_paid insert failed:", e);
      }
      // Siempre enviamos "Gracias por tu compra" (con producto y precio).
      // Si además hay SKUs digitales, luego se dispara la entrega de materiales.
      await sendThankYouEmail({
        customerEmail,
        customerName: payerName,
        customerCountry,
        productName,
        amount: capturedAmount ? Number(capturedAmount) : undefined,
        currency: capturedCurrency ?? "USD",
        provider: "paypal",
        orderNumber: captureId ? `ILR-PP-${String(captureId).slice(-8).toUpperCase()}` : undefined,
        idempotencyKey: captureId || orderId,
      });
      if (skus.length > 0) {
        const digitalClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const orderNumber = captureId ? `ILR-PP-${String(captureId).slice(-8).toUpperCase()}` : String(orderId);
        const deliveryBody = {
          customerEmail,
          customerName: payerName,
          customerPhone: checkoutPhone,
          customerCountry,
          orderId: captureId || orderId,
          skus,
          amount: capturedAmount ? Number(capturedAmount) : undefined,
          currency: capturedCurrency ?? "USD",
          provider: "paypal",
          idempotencyKey: `digital:paypal:${captureId || orderId}:${skus.slice().sort().join(",")}`,
        };
        // Un reintento inmediato (la entrega es idempotente por idempotencyKey).
        let digitalErr = (await invokeInternalFunction("send-digital-ilinguerelax", deliveryBody)).error;
        if (digitalErr) {
          console.error(JSON.stringify({ corr: correlationId, trace: traceId, fn: "paypal-capture-order", phase: "digital_delivery_retry", error: digitalErr.message }));
          digitalErr = (await invokeInternalFunction("send-digital-ilinguerelax", deliveryBody)).error;
        }
        if (digitalErr) {
          console.error(JSON.stringify({ corr: correlationId, trace: traceId, fn: "paypal-capture-order", phase: "digital_delivery_error", error: digitalErr.message, skuCount: skus.length }));
          try {
            await digitalClient.from("order_events").insert({
              order_number: orderNumber,
              customer_email: customerEmail,
              provider: "paypal",
              event: "digital_delivery_error",
              status: "error",
              detail: String(digitalErr.message ?? digitalErr).slice(0, 500),
              amount: capturedAmount ? Number(capturedAmount) : null,
              currency: capturedCurrency ?? "USD",
              metadata: { skus, correlationId, trace: traceId },
            });
            await digitalClient.from("digital_delivery_alerts").insert({
              source: "paypal-capture-order",
              source_ref: orderNumber,
              customer_email: customerEmail,
              reason: "delivery_invoke_failed",
              details: { error: String(digitalErr.message ?? digitalErr).slice(0, 500), skus },
            });
          } catch (logErr) {
            console.error("paypal delivery error logging failed:", logErr);
          }
        } else {
          console.log(JSON.stringify({ corr: correlationId, trace: traceId, fn: "paypal-capture-order", phase: "digital_delivery_sent", skuCount: skus.length }));
        }

      }
    }
    return new Response(JSON.stringify({
      status, order: data, trace: traceId, correlationId,
      audit: { orderId, captureId, amount: capturedAmount, currency: capturedCurrency, payerCountry, corrMatches },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId, "x-trace-id": traceId },
    });
  } catch (e) {
    console.error(JSON.stringify({ trace: traceId, fn: "paypal-capture-order", phase: "exception", error: (e as Error).message, ms: Date.now() - t0 }));
    return new Response(JSON.stringify({ error: (e as Error).message, trace: traceId }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


