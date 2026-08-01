// Confirmación de pedido. SOLO uso interno (service-role o CRON_SHARED_SECRET).
//
// Seguridad:
//  - nunca incluye enlaces de Google Drive ni claves de acceso
//  - los productos se entregan mediante el token privado del comprador
//    (/mi-descarga?t=<token>), con redirecciones firmadas de 15 minutos
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resend } from "../_shared/brevo.ts";
import { assertInternalCall, internalCors } from "../_shared/internalAuth.ts";
import { randomToken } from "../_shared/downloadToken.ts";

const corsHeaders = internalCors;
const SITE = "https://www.ilinguerelax.com";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderRequest {
  customerEmail: string;
  customerName?: string;
  orderId?: string;
  /** Underlying provider transaction id (PaymentIntent, PayPal order, MP payment). */
  paymentReference?: string;
  total?: number;
  currency?: string;
  paymentProvider?: string;
  items: OrderItem[];
}

const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

/** Crea (o reutiliza) el token de descarga del pedido y devuelve su URL privada. */
// deno-lint-ignore no-explicit-any
async function buildDownloadUrl(admin: any, orderNumber: string, email: string, skus: string[]) {
  try {
    if (!orderNumber || !email) return null;
    const { data: existing } = await admin
      .from("download_tokens")
      .select("token, skus, revoked")
      .eq("order_number", orderNumber)
      .eq("email", email)
      .maybeSingle();

    if (existing && !existing.revoked) {
      const merged = [...new Set([...(existing.skus ?? []), ...skus])];
      if (merged.length !== (existing.skus ?? []).length) {
        await admin.from("download_tokens").update({ skus: merged }).eq("token", existing.token);
      }
      return `${SITE}/mi-descarga?t=${existing.token}`;
    }

    if (!skus.length) return null;
    const token = randomToken();
    const { error } = await admin.from("download_tokens").insert({
      token, order_number: orderNumber, email, skus,
    });
    if (error) throw error;
    return `${SITE}/mi-descarga?t=${token}`;
  } catch (e) {
    console.error("[send-order-confirmation] token", e);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const blocked = await assertInternalCall(req);
  if (blocked) return blocked;

  try {
    const body: OrderRequest = await req.json();
    const { customerEmail, customerName, orderId, paymentReference, total, currency = "USD", paymentProvider, items } = body;

    if (!customerEmail || !items?.length) {
      return new Response(JSON.stringify({ error: "customerEmail and items are required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const email = String(customerEmail).trim().toLowerCase();
    const name = customerName?.trim() || "there";
    const firstName = name.split(" ")[0];
    const orderRef = orderId
      ? (orderId.startsWith("ILR-") ? orderId : `#${String(orderId).slice(-8).toUpperCase()}`)
      : "";
    const providerLabel = paymentProvider
      ? paymentProvider.charAt(0).toUpperCase() + paymentProvider.slice(1)
      : "";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const skus = [...new Set(items.map((i) => String(i.id ?? "").trim().toLowerCase()).filter(Boolean))];
    const orderNumber = String(orderId ?? "").trim().toUpperCase();
    const downloadUrl = await buildDownloadUrl(admin, orderNumber, email, skus);
    const accessUrl = downloadUrl ?? `${SITE}/mi-pedido`;
    const accessLabel = downloadUrl ? "⬇ Abrir mis descargas" : "Ver el estado de mi pedido";

    const itemsHtml = items.map((i) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#111827;font-size:15px;">${escapeHtml(i.name)}</div>
            <div style="color:#6b7280;font-size:13px;margin:4px 0 0;">Qty ${escapeHtml(i.quantity)} · $${(i.price * i.quantity).toFixed(2)} ${escapeHtml(currency)}</div>
          </td>
        </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:0;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:16px 16px 0 0;padding:36px;text-align:center;">
      <div style="font-size:44px;line-height:1;">✅</div>
      <h1 style="color:#fff;margin:12px 0 0;font-size:26px;">Thanks for your purchase, ${escapeHtml(firstName)}!</h1>
      ${orderRef ? `<p style="color:rgba(255,255,255,.9);margin:8px 0 0;font-size:13px;letter-spacing:1px;">Order ${escapeHtml(orderRef)}</p>` : ""}
    </div>
    <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px rgba(0,0,0,.08);">
      <p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">
        Your order is confirmed. Open your private download page below — it is linked to your order and only works with your personal link.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(accessUrl)}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;">${accessLabel}</a>
      </div>

      <h2 style="font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:24px 0 4px;">Your products</h2>
      <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>

      ${typeof total === "number" ? `
      <div style="display:flex;justify-content:space-between;padding:16px 0;margin-top:8px;font-size:16px;font-weight:700;color:#111827;">
        <span>Total paid</span><span>$${total.toFixed(2)} ${escapeHtml(currency)}</span>
      </div>` : ""}

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 18px;margin:8px 0 4px;font-size:13px;color:#374151;">
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Transaction details</div>
        ${orderRef ? `<div style="margin:2px 0;"><strong style="color:#111827;">Order number:</strong> <span style="font-family:monospace;">${escapeHtml(orderRef)}</span></div>` : ""}
        ${providerLabel ? `<div style="margin:2px 0;"><strong style="color:#111827;">Payment method:</strong> ${escapeHtml(providerLabel)}</div>` : ""}
        ${paymentReference ? `<div style="margin:2px 0;word-break:break-all;"><strong style="color:#111827;">Transaction ID:</strong> <span style="font-family:monospace;font-size:12px;color:#4b5563;">${escapeHtml(paymentReference)}</span></div>` : ""}
        <div style="margin-top:8px;font-size:12px;color:#6b7280;">Keep this reference in case you need to contact support.</div>
      </div>

      <div style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:8px;padding:20px;margin:28px 0;">
        <h3 style="margin:0 0 12px;color:#065f46;font-size:15px;">🚀 Steps to get started</h3>
        <ol style="margin:0;padding-left:20px;color:#065f46;font-size:14px;line-height:1.8;">
          <li>Open your private download page with the green button above.</li>
          <li>Download each product and save the file to your device.</li>
          <li>Start with just 10–15 minutes a day — consistency beats speed.</li>
          <li>Have any question? Reply to this email or message us on WhatsApp.</li>
        </ol>
      </div>

      <div style="text-align:center;margin:24px 0;">
        <a href="https://wa.me/12512724704" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">💬 WhatsApp support</a>
      </div>

      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:24px 0 0;text-align:center;">
        Need help? Email <a href="mailto:hola@ilinguerelax.com" style="color:#10b981;">hola@ilinguerelax.com</a>
      </p>
    </div>
    <div style="text-align:center;padding:20px;color:#9ca3af;font-size:12px;">
      © ${new Date().getFullYear()} iLingue Relax · Learn languages the stress-free way
    </div>
  </div>
</body></html>`;

    const customerRes = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: [email],
      subject: `🎉 Your order is confirmed ${orderRef} — access inside`,
      html,
    });

    // Internal notification
    const internalRes = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: ["hola@ilinguerelax.com"],
      subject: `🛒 New order ${orderRef} — ${email}`,
      html: `<h2>New order</h2>
        <p><strong>Customer:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        <p><strong>Provider:</strong> ${escapeHtml(paymentProvider || "n/a")}</p>
        <p><strong>Order number:</strong> ${escapeHtml(orderId || "n/a")}</p>
        <p><strong>Transaction ID:</strong> <code>${escapeHtml(paymentReference || "n/a")}</code></p>
        <p><strong>Total:</strong> $${(total ?? 0).toFixed(2)} ${escapeHtml(currency)}</p>
        <ul>${items.map((i) => `<li>${escapeHtml(i.quantity)}× ${escapeHtml(i.name)} — $${(i.price * i.quantity).toFixed(2)}</li>`).join("")}</ul>`,
    });

    if (customerRes.error) {
      console.error("Customer email failed", customerRes.error);
      return new Response(
        JSON.stringify({ success: false, error: "send_failed" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(JSON.stringify({ success: true, hasDownloadLink: Boolean(downloadUrl), internal: Boolean(internalRes) }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-order-confirmation error:", msg);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
