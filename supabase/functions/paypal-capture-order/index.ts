// Capture a PayPal order server-side after buyer approves in the popup.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PAYPAL_ENV = (Deno.env.get("PAYPAL_ENV") ?? "live").toLowerCase() === "sandbox" ? "sandbox" : "live";
const PAYPAL_BASE = PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

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
    console.log(JSON.stringify({ trace: traceId, fn: "paypal-capture-order", phase: "input", env: PAYPAL_ENV, orderId }));
    if (!/^[A-Z0-9]{5,32}$/i.test(orderId)) {
      console.warn(JSON.stringify({ trace: traceId, fn: "paypal-capture-order", phase: "reject", reason: "invalid_orderId", orderId }));
      return new Response(JSON.stringify({ error: "Invalid orderId", trace: traceId }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(JSON.stringify({
        trace: traceId, fn: "paypal-capture-order", phase: "paypal_error",
        status: res.status, error: data, orderId, ms: Date.now() - t0,
      }));
      return new Response(JSON.stringify({ error: data, trace: traceId }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    console.log(JSON.stringify({
      trace: traceId, fn: "paypal-capture-order", phase: "captured",
      orderId, captureId, status,
      amount: capturedAmount, currency: capturedCurrency,
      payerCountry, hasPayerEmail: !!payerEmail,
      ms: Date.now() - t0,
    }));
    return new Response(JSON.stringify({
      status, order: data, trace: traceId,
      audit: { orderId, captureId, amount: capturedAmount, currency: capturedCurrency, payerCountry },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(JSON.stringify({ trace: traceId, fn: "paypal-capture-order", phase: "exception", error: (e as Error).message, ms: Date.now() - t0 }));
    return new Response(JSON.stringify({ error: (e as Error).message, trace: traceId }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

