// Shared "Thank you for your purchase" email — used by stripe-webhook and paypal-webhook.
// Simple confirmation: name + product + amount. No downloads, no upsell logic.
import { resend } from "./brevo.ts";

interface Args {
  customerEmail: string;
  customerName?: string;
  productName?: string;
  amount?: number;
  currency?: string;
  provider: "stripe" | "paypal" | "mercadopago";
}

export async function sendThankYouEmail(a: Args): Promise<void> {
  if (!a.customerEmail) return;
  const name = a.customerName?.trim() || "Cliente";
  const product = a.productName || "tu pedido";
  const amountLine = a.amount
    ? `<p style="margin:8px 0;color:#4b5563"><strong>Monto:</strong> ${a.amount.toFixed(2)} ${(a.currency || "USD").toUpperCase()}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html><body style="font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f4f4f5">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="background:linear-gradient(135deg,#0ea5a4 0%,#0f766e 100%);border-radius:16px 16px 0 0;padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:26px">¡Gracias por tu compra! 🎉</h1>
    </div>
    <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px rgba(0,0,0,.08)">
      <p style="font-size:18px;color:#111827;margin:0 0 16px">Hola ${name},</p>
      <p style="font-size:16px;color:#4b5563;line-height:1.6;margin:0 0 16px">
        Hemos recibido tu pago correctamente. ¡Bienvenido/a a la familia <strong>ILINGUE RELAX</strong>!
      </p>
      <div style="background:#f0fdfa;border-left:4px solid #0ea5a4;padding:16px 20px;border-radius:8px;margin:20px 0">
        <p style="margin:0 0 6px;color:#0f766e;font-weight:bold">Detalle del pedido</p>
        <p style="margin:8px 0;color:#4b5563"><strong>Producto:</strong> ${product}</p>
        ${amountLine}
      </div>
      <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:16px 0">
        En breve recibirás un correo con los enlaces y accesos a tu producto. Si necesitas ayuda, responde a este correo o escríbenos a
        <a href="mailto:hola@ilinguerelax.com" style="color:#0ea5a4">hola@ilinguerelax.com</a>
        o por WhatsApp al <a href="https://wa.me/12512724704" style="color:#0ea5a4">+1 251 272 4704</a>.
      </p>
      <p style="font-size:15px;color:#4b5563;margin-top:24px">
        ¡Un abrazo!<br><strong style="color:#0f766e">El equipo de ILINGUE RELAX</strong>
      </p>
    </div>
    <div style="text-align:center;padding:20px;color:#9ca3af;font-size:12px">
      © ${new Date().getFullYear()} ILINGUE RELAX · ilinguerelax.com
    </div>
  </div>
</body></html>`;

  try {
    await resend.emails.send({
      from: "ILINGUE RELAX <hola@ilinguerelax.com>",
      to: [a.customerEmail],
      subject: "🎉 ¡Gracias por tu compra en ILINGUE RELAX!",
      html,
    });
  } catch (e) {
    console.error(`[thankyou-email] send failed (${a.provider}):`, e);
  }

  // Admin notification
  try {
    await resend.emails.send({
      from: "Ventas ILINGUE <hola@ilinguerelax.com>",
      to: ["hola@ilinguerelax.com"],
      subject: `🛒 Nueva venta (${a.provider}) — ${product}`,
      html: `<h2>Nueva compra vía ${a.provider}</h2>
        <p><b>Cliente:</b> ${name}</p>
        <p><b>Email:</b> ${a.customerEmail}</p>
        <p><b>Producto:</b> ${product}</p>
        ${a.amount ? `<p><b>Monto:</b> ${a.amount.toFixed(2)} ${(a.currency || "USD").toUpperCase()}</p>` : ""}
        <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>`,
    });
  } catch (e) {
    console.error(`[thankyou-email] admin notify failed (${a.provider}):`, e);
  }
}
