import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resend } from "../_shared/brevo.ts";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      await raiseStripeAlert("Missing stripe-signature header", "warn", { http_status: 400 });
      return new Response("Missing signature", { status: 400 });
    }

    const verified = await verifyStripeSignature(body, sig);
    if (!verified.ok) {
      await raiseStripeAlert(`Firma inválida: ${verified.reason}`, "critical", { http_status: 401 });
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      
      // Check if this is a Spanish Relax purchase
      const customerEmail = session.customer_email || session.customer_details?.email;
      const customerName = session.customer_details?.name || "Valued Customer";
      
      if (!customerEmail) {
        console.log("No customer email found in session");
        return new Response(JSON.stringify({ received: true, emailSent: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Sending purchase emails to:", customerEmail);

      const purchase = await labelStripeProduct(session);
      try {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await adminClient.from("funnel_events").insert({
          event_name: "Purchase",
          product_id: purchase.product_id,
          value: purchase.value,
          currency: purchase.currency,
          session_id: session.client_reference_id || session.id,
          page_path: "/payment-success",
          country: session.customer_details?.address?.country || null,
          referrer: "stripe-webhook",
        });
      } catch (trackingError) {
        console.error("purchase tracking error:", trackingError);
      }

      const orderNumber = session.id ? `ILR-ST-${String(session.id).slice(-8).toUpperCase()}` : undefined;

      await sendThankYouEmail({
        customerEmail,
        customerName,
        customerPhone: session.customer_details?.phone || undefined,
        customerCountry: session.customer_details?.address?.country || undefined,
        productName: purchase.content_name,
        amount: purchase.value,
        currency: purchase.currency,
        provider: "stripe",
        orderNumber,
        idempotencyKey: session.id,
      });

      // Digital delivery — always trigger server-side so it goes out even if
      // the buyer closes the tab before landing on /checkout/success.
      try {
        const skusRaw = (session.metadata?.skus || "") as string;
        const skus = skusRaw.split(",").map((s) => s.trim()).filter(Boolean);
        if (skus.length > 0) {
          const digitalClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          );
          const { error: digitalErr } = await digitalClient.functions.invoke("send-digital-ilinguerelax", {
            body: {
              customerEmail,
              customerName,
              customerPhone: session.customer_details?.phone || undefined,
              customerCountry: session.customer_details?.address?.country || undefined,
              orderId: orderNumber,
              skus,
              amount: purchase.value,
              currency: purchase.currency,
              provider: "stripe",
              idempotencyKey: `digital:${session.id}`,
            },
          });
          if (digitalErr) console.error("send-digital-ilinguerelax webhook invoke failed:", digitalErr);
        } else {
          console.log("[stripe-webhook] no skus in metadata; skipping digital delivery");
        }
      } catch (digitalException) {
        console.error("digital delivery exception:", digitalException);
      }


      return new Response(
        JSON.stringify({ received: true, emailsSent: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Webhook error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
