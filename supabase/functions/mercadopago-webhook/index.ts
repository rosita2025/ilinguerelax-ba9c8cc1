// Mercado Pago Webhook receiver
// Docs: https://www.mercadopago.com.pe/developers/es/docs/your-integrations/notifications/webhooks
// Validates x-signature header (HMAC SHA256) and logs payment events.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseSignatureHeader(header: string | null): { ts?: string; v1?: string } {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2).map((s) => s?.trim());
    if (k && v) out[k] = v;
  }
  return { ts: out.ts, v1: out.v1 };
}

async function verifySignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature verification");
    return true; // allow while user configures secret; MP still requires it in prod
  }
  const sigHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id") ?? "";
  const { ts, v1 } = parseSignatureHeader(sigHeader);
  if (!ts || !v1) return false;

  // MP manifest: id:<dataId>;request-id:<requestId>;ts:<ts>;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = await hmacSha256Hex(secret, manifest);
  return expected === v1;
}

async function mpGet(path: string) {
  const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN missing");
  const r = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`MP ${path} failed ${r.status}: ${t}`);
  }
  return await r.json();
}

const fetchPayment = (id: string) => mpGet(`/v1/payments/${id}`);
const fetchPlan = (id: string) => mpGet(`/preapproval_plan/${id}`);
const fetchSubscription = (id: string) => mpGet(`/preapproval/${id}`);
const fetchInvoice = (id: string) => mpGet(`/authorized_payments/${id}`);
const fetchMerchantOrder = (id: string) => mpGet(`/merchant_orders/${id}`);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // MP sends data.id both in body and query (?data.id=...&type=payment)
    const body = await req.json().catch(() => ({}));
    const dataId =
      body?.data?.id?.toString() ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id") ??
      "";
    const type = body?.type ?? body?.topic ?? url.searchParams.get("type") ?? "";

    console.log("MP webhook received:", { type, dataId, action: body?.action });

    if (!dataId) {
      return new Response(JSON.stringify({ received: true, ignored: "no data.id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ok = await verifySignature(req, dataId);
    if (!ok) {
      console.error("Invalid MP signature");
      return new Response("Invalid signature", { status: 401, headers: corsHeaders });
    }

    // Only process payment events. Ignore merchant_order, plan, etc.
    if (type !== "payment") {
      return new Response(JSON.stringify({ received: true, ignored: type }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = await fetchPayment(dataId);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Log to funnel_events for the live admin dashboard.
    await supabase.from("funnel_events").insert({
      event_type: payment.status === "approved" ? "purchase" : `mp_${payment.status}`,
      product_id: payment.metadata?.source ?? "checkout-prueba-1",
      product_name: payment.description ?? "Mercado Pago",
      amount: payment.transaction_amount ?? null,
      currency: payment.currency_id ?? "PEN",
      country: payment.payer?.address?.country_id ?? "PE",
      metadata: {
        provider: "mercadopago",
        payment_id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        payment_method: payment.payment_method_id,
        payment_type: payment.payment_type_id,
        payer_email: payment.payer?.email,
        preference_id: payment.metadata?.preference_id,
        external_reference: payment.external_reference,
      },
    });

    console.log("MP payment processed:", {
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      method: payment.payment_method_id,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("MP webhook error:", err);
    // Return 200 to avoid infinite retries when the problem is on our side.
    return new Response(JSON.stringify({ received: true, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
