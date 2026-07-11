import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resend } from "../_shared/brevo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Map item IDs → product access link (download / access page)
const ACCESS_LINKS: Record<string, { url: string; label: string }> = {
  "prueba-1": { url: "https://drive.google.com/file/d/1KA1IQ-WEB7a_dw3BKVWaU0pImfGsdV3i/view?usp=sharing", label: "Download your PDF" },
  "prueba-patrones-es": { url: "https://ilinguerelax.com/descarga/patrones-ingles", label: "Access your product (password: 123A)" },
  "spanish-5000-digital": { url: "https://drive.google.com/file/d/1KA1IQ-WEB7a_dw3BKVWaU0pImfGsdV3i/view?usp=sharing", label: "Download your PDF" },
};

const DEFAULT_ACCESS = {
  url: "https://wa.me/15752160934",
  label: "Contact support on WhatsApp to receive your access link",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: OrderRequest = await req.json();
    const { customerEmail, customerName, orderId, paymentReference, total, currency = "USD", paymentProvider, items } = body;

    if (!customerEmail || !items?.length) {
      return new Response(JSON.stringify({ error: "customerEmail and items are required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const name = customerName?.trim() || "there";
    const firstName = name.split(" ")[0];
    // Use the friendly order number as-is when provided (e.g. ILR-ST-A1B2C3);
    // fall back to a short tail only if we don't have one.
    const orderRef = orderId
      ? (orderId.startsWith("ILR-") ? orderId : `#${String(orderId).slice(-8).toUpperCase()}`)
      : "";
    const providerLabel = paymentProvider
      ? paymentProvider.charAt(0).toUpperCase() + paymentProvider.slice(1)
      : "";

    const itemsHtml = items.map((i) => {
      const link = ACCESS_LINKS[i.id] ?? DEFAULT_ACCESS;
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#111827;font-size:15px;">${i.name}</div>
            <div style="color:#6b7280;font-size:13px;margin:4px 0 10px;">Qty ${i.quantity} · $${(i.price * i.quantity).toFixed(2)} ${currency}</div>
            <a href="${link.url}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600;">${link.label}</a>
          </td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:0;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:16px 16px 0 0;padding:36px;text-align:center;">
      <div style="font-size:44px;line-height:1;">✅</div>
      <h1 style="color:#fff;margin:12px 0 0;font-size:26px;">Thanks for your purchase, ${firstName}!</h1>
      ${orderRef ? `<p style="color:rgba(255,255,255,.9);margin:8px 0 0;font-size:13px;letter-spacing:1px;">Order ${orderRef}</p>` : ""}
    </div>
    <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px rgba(0,0,0,.08);">
      <p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">
        Your order is confirmed. Below you'll find your access links — click each button to download or open your product.
      </p>

      <h2 style="font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:24px 0 4px;">Your products</h2>
      <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>

      ${typeof total === "number" ? `
      <div style="display:flex;justify-content:space-between;padding:16px 0;margin-top:8px;font-size:16px;font-weight:700;color:#111827;">
        <span>Total paid</span><span>$${total.toFixed(2)} ${currency}</span>
      </div>` : ""}

      <div style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:8px;padding:20px;margin:28px 0;">
        <h3 style="margin:0 0 12px;color:#065f46;font-size:15px;">🚀 Steps to get started</h3>
        <ol style="margin:0;padding-left:20px;color:#065f46;font-size:14px;line-height:1.8;">
          <li>Click the green button above to download or open your product.</li>
          <li>Save the file to your device so you can access it anytime, offline.</li>
          <li>Start with just 10–15 minutes a day — consistency beats speed.</li>
          <li>Have any question? Reply to this email or message us on WhatsApp.</li>
        </ol>
      </div>

      <div style="text-align:center;margin:24px 0;">
        <a href="https://wa.me/15752160934" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">💬 WhatsApp support · +1 575 216 0934</a>
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
      to: [customerEmail],
      subject: `🎉 Your order is confirmed ${orderRef} — access inside`,
      html,
    });

    // Internal notification
    await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: ["hola@ilinguerelax.com"],
      subject: `🛒 New order ${orderRef} — ${customerEmail}`,
      html: `<h2>New order</h2>
        <p><strong>Customer:</strong> ${name} &lt;${customerEmail}&gt;</p>
        <p><strong>Provider:</strong> ${paymentProvider || "n/a"}</p>
        <p><strong>Order:</strong> ${orderId || "n/a"}</p>
        <p><strong>Total:</strong> $${(total ?? 0).toFixed(2)} ${currency}</p>
        <ul>${items.map((i) => `<li>${i.quantity}× ${i.name} — $${(i.price * i.quantity).toFixed(2)}</li>`).join("")}</ul>`,
    });

    return new Response(JSON.stringify({ success: true, customerRes }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-order-confirmation error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
