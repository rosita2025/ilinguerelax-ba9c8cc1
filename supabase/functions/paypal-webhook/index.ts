// PayPal webhook receiver.
// - Verifies signature with PayPal /v1/notifications/verify-webhook-signature.
// - Handles CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED / DENIED /
//   REFUNDED / REVERSED.
// - Idempotent: skips events already stored in `paypal_webhook_events`.
// - Emits structured JSON logs correlated with the buyer's `correlationId`
//   captured in the order's reference_id / custom_id.
//
// Config in PayPal Developer Dashboard → your app → Webhooks:
//   URL:     https://<project>.supabase.co/functions/v1/paypal-webhook
//   Events:  CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED,
//            PAYMENT.CAPTURE.DENIED, PAYMENT.CAPTURE.REFUNDED,
//            PAYMENT.CAPTURE.REVERSED
// Save the generated Webhook ID as the PAYPAL_WEBHOOK_ID secret.

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { sendPurchaseCapi } from "../_shared/metaCapi.ts";

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
  return data.access_token as string;
}

interface VerifyInput {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  eventBody: unknown;
}

async function verifySignature(v: VerifyInput, token: string): Promise<boolean> {
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: v.authAlgo,
      cert_url: v.certUrl,
      transmission_id: v.transmissionId,
      transmission_sig: v.transmissionSig,
      transmission_time: v.transmissionTime,
      webhook_id: v.webhookId,
      webhook_event: v.eventBody,
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const traceId = crypto.randomUUID();
  const t0 = Date.now();
  const log = (phase: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ trace: traceId, fn: "paypal-webhook", env: PAYPAL_ENV, phase, ...extra }));

  try {
    const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
    if (!webhookId) {
      log("config_missing", { reason: "PAYPAL_WEBHOOK_ID not set" });
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.text();
    let event: any;
    try { event = JSON.parse(raw); } catch {
      log("bad_json"); return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
    }

    const headers = req.headers;
    const verifyInput: VerifyInput = {
      authAlgo: headers.get("paypal-auth-algo") ?? "",
      certUrl: headers.get("paypal-cert-url") ?? "",
      transmissionId: headers.get("paypal-transmission-id") ?? "",
      transmissionSig: headers.get("paypal-transmission-sig") ?? "",
      transmissionTime: headers.get("paypal-transmission-time") ?? "",
      webhookId,
      eventBody: event,
    };

    if (!verifyInput.authAlgo || !verifyInput.transmissionId || !verifyInput.transmissionSig || !verifyInput.transmissionTime || !verifyInput.certUrl) {
      log("missing_signature_headers");
      return new Response("Missing signature headers", { status: 400, headers: corsHeaders });
    }

    const token = await getAccessToken();
    const ok = await verifySignature(verifyInput, token);
    if (!ok) {
      log("signature_invalid", { transmissionId: verifyInput.transmissionId });
      return new Response("Signature verification failed", { status: 401, headers: corsHeaders });
    }

    const eventId: string = event.id ?? verifyInput.transmissionId;
    const eventType: string = event.event_type ?? "unknown";
    const resource = event.resource ?? {};
    // For PAYMENT.CAPTURE.* the correlationId lives in resource.custom_id / invoice_id.
    // For CHECKOUT.ORDER.APPROVED it's in resource.purchase_units[0].reference_id / custom_id.
    const pu = Array.isArray(resource.purchase_units) ? resource.purchase_units[0] ?? {} : {};
    const correlationId: string =
      resource.custom_id ?? resource.invoice_id ?? pu.custom_id ?? pu.reference_id ?? "unknown";

    log("received", { eventId, eventType, corr: correlationId, resourceId: resource.id ?? null });

    // Idempotency: persist the event id; ignore duplicates.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: insertErr } = await supabase
      .from("paypal_webhook_events")
      .insert({
        event_id: eventId,
        event_type: eventType,
        correlation_id: correlationId,
        resource_id: resource.id ?? null,
        payload: event,
      });

    if (insertErr) {
      // 23505 = unique_violation → duplicate delivery, acknowledge OK.
      if ((insertErr as any).code === "23505") {
        log("duplicate", { eventId, corr: correlationId, ms: Date.now() - t0 });
        return new Response(JSON.stringify({ ok: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      log("db_error", { error: insertErr.message });
      // Return 500 so PayPal retries.
      return new Response(JSON.stringify({ error: "storage failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Business-level side effects per event type. Keep light — heavy work
    // should be queued so we always ACK PayPal quickly.
    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        const payer = resource.payer ?? event.resource?.payer ?? {};
        const payerEmail = payer.email_address ?? null;
        const payerName = [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(" ").trim() || undefined;
        log("capture_completed", {
          corr: correlationId,
          captureId: resource.id ?? null,
          amount: resource.amount?.value ?? null,
          currency: resource.amount?.currency_code ?? null,
          payerCountry: payer.address?.country_code ?? null,
          payerEmail: payerEmail ? "present" : "missing",
        });
        // Log the sale into funnel_events so admin analytics counts it.
        try {
          const captureId = resource.id ?? null;
          const skus = String(pu.custom_id || pu.reference_id || "").trim();
          const amountNum = resource.amount?.value ? Number(resource.amount.value) : null;
          await supabase.from("funnel_events").insert({
            event_name: "Purchase",
            product_id: (skus ? skus.split(",")[0].trim() : "") || pu.items?.[0]?.sku || "store",
            value: Number.isFinite(amountNum as number) ? amountNum : null,
            currency: resource.amount?.currency_code ?? "USD",
            session_id: captureId ? `paypal:${captureId}` : `paypal:${eventId}`,
            page_path: "/payment-success",
            country: payer.address?.country_code || null,
            referrer: JSON.stringify({
              provider: "paypal",
              event_type: eventType,
              capture_id: captureId,
              external_reference: correlationId,
              customer_email: payerEmail,
              customer_name: payerName,
              skus,
              status: "approved",
            }).slice(0, 2000),
          });
          const orderIdPp = `ILR-PP-${String(captureId || eventId).slice(-8).toUpperCase()}`;
          await sendPurchaseCapi({
            eventId: `Purchase_${orderIdPp}`,
            email: payerEmail,
            country: payer.address?.country_code || null,
            value: Number.isFinite(amountNum as number) ? (amountNum as number) : null,
            currency: resource.amount?.currency_code ?? "USD",
            contentIds: skus ? skus.split(",").map((x: string) => x.trim()).filter(Boolean) : [],
            contentName: skus || undefined,
            orderId: orderIdPp,
          });
        } catch (e) {
          log("funnel_log_failed", { error: e instanceof Error ? e.message : String(e) });
        }
        if (payerEmail) {
          const amt = resource.amount?.value ? Number(resource.amount.value) : undefined;
          const captureId2 = resource.id ?? null;
          await sendThankYouEmail({
            customerEmail: payerEmail,
            customerName: payerName,
            customerCountry: payer.address?.country_code || undefined,
            productName: pu.description || pu.items?.[0]?.name || "Pedido iLingue Relax",
            amount: Number.isFinite(amt) ? amt : undefined,
            currency: resource.amount?.currency_code ?? "USD",
            provider: "paypal",
            orderNumber: captureId2 ? `ILR-PP-${String(captureId2).slice(-8).toUpperCase()}` : undefined,
            idempotencyKey: captureId2 || undefined,
          });
        }
        break;
      }


      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REVERSED":
      case "PAYMENT.CAPTURE.REFUNDED":
        log("capture_failed_or_refunded", {
          corr: correlationId,
          eventType,
          captureId: resource.id ?? null,
          amount: resource.amount?.value ?? null,
          currency: resource.amount?.currency_code ?? null,
          reason: resource.status_details?.reason ?? null,
        });
        break;
      case "CHECKOUT.ORDER.APPROVED":
        log("order_approved", {
          corr: correlationId,
          orderId: resource.id ?? null,
        });
        break;
      default:
        log("event_ignored", { eventType, corr: correlationId });
    }

    log("ack", { eventId, eventType, corr: correlationId, ms: Date.now() - t0 });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log("exception", { error: (e as Error).message });
    // 500 → PayPal will retry with exponential backoff.
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
