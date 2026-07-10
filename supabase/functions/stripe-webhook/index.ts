import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resend } from "../_shared/brevo.ts";
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

      const downloadUrl = "https://drive.google.com/file/d/1KA1IQ-WEB7a_dw3BKVWaU0pImfGsdV3i/view?usp=sharing";

      // Send email to customer with download link
      const customerEmailResponse = await resend.emails.send({
        from: "iLingue Relax <hola@ilinguerelax.com>",
        to: [customerEmail],
        subject: "🎉 Thank You for Your Purchase! Here's Your Digital Download",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Purchase! 🎉</h1>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px;">
                  Hello ${customerName}!
                </p>
                
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                  Welcome to the <strong>Spanish Relax</strong> family! We're thrilled you've chosen to learn Spanish with us.
                </p>
                
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                  Your digital PDF is ready for immediate download. Click the button below to get your eBook!
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                    📚 Download Your PDF Now
                  </a>
                </div>
                
                <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin: 32px 0;">
                  <h3 style="color: #92400e; margin: 0 0 16px 0; font-size: 16px;">💡 Pro Tip</h3>
                  <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
                    Start with just 10-15 words per day. Consistency is key! The stress-free method works best when you learn at your own pace.
                  </p>
                </div>
                
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 8px;">
                  If you have any questions, just reply to this email or contact us at <a href="mailto:hola@ilinguerelax.com" style="color: #8b5cf6;">hola@ilinguerelax.com</a>
                </p>
                
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 32px;">
                  ¡Buena suerte! (Good luck!)<br>
                  <strong style="color: #8b5cf6;">The iLingue Relax Team</strong>
                </p>
              </div>
              
              <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
                <p style="margin: 0;">© 2024 iLingue Relax. All rights reserved.</p>
                <p style="margin: 8px 0 0 0;">Learn Spanish the stress-free way.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Customer email sent:", customerEmailResponse);

      // Send notification email to the business
      const notificationEmailResponse = await resend.emails.send({
        from: "iLingue Relax <hola@ilinguerelax.com>",
        to: ["hola@ilinguerelax.com"],
        subject: `🛒 New Purchase! Spanish Relax Digital - ${customerEmail}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #8b5cf6;">🎉 New Purchase Alert!</h2>
            <p><strong>Product:</strong> Spanish Relax - 5,000 Words (Digital PDF)</p>
            <p><strong>Customer Email:</strong> ${customerEmail}</p>
            <p><strong>Customer Name:</strong> ${customerName}</p>
            <p><strong>Amount:</strong> $${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280;">The customer has received their digital download link automatically.</p>
          </body>
          </html>
        `,
      });

      console.log("Notification email sent:", notificationEmailResponse);

      return new Response(
        JSON.stringify({ received: true, emailsSent: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
