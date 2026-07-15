import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { upsertBrevoContact } from '../_shared/brevoContact.ts';
import { sendEmail } from '../_shared/brevo.ts';

const FROM = 'iLingue Relax <hola@ilinguerelax.com>';
const REPLY_TO = 'hola@ilinguerelax.com';

function buildWelcomeEmail(name?: string) {
  const hola = name ? `Hola ${name} 👋` : 'Hola 👋';
  const subject = `¡Bienvenidos a iLingue Relax! Te daré el cupón 10% de descuento 🎁`;
  const text = `${hola}

¡Bienvenid@ a iLingue Relax! Gracias por suscribirte.

Como regalo de bienvenida, aquí tienes tu cupón exclusivo del 10% de descuento:

    NEW10

Úsalo al finalizar tu compra en https://ilinguerelax.com/products

Si necesitas cualquier cosa, escríbenos a hola@ilinguerelax.com.

Un saludo,
El equipo de iLingue Relax`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:0;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2c5282 100%);padding:36px 30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">🎁 ¡Bienvenid@ a iLingue Relax!</h1>
    </div>
    <div style="padding:36px 30px;">
      <p style="font-size:18px;color:#333;margin:0 0 18px 0;">${hola}</p>
      <p style="font-size:16px;color:#555;line-height:1.6;margin:0 0 22px 0;">
        Gracias por suscribirte. Como regalo de bienvenida, te enviamos un cupón exclusivo del
        <strong style="color:#e53e3e;">10% de descuento</strong> en todos nuestros productos digitales.
      </p>
      <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border:3px dashed #d97706;border-radius:12px;padding:26px;text-align:center;margin:26px 0;">
        <p style="font-size:13px;color:#92400e;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:1px;">Tu código exclusivo:</p>
        <p style="font-size:36px;font-weight:800;color:#92400e;margin:0;letter-spacing:4px;">NEW10</p>
      </div>
      <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px 0;">
        Usa este código al momento de pagar en la tienda para obtener el descuento.
      </p>
      <div style="text-align:center;margin:30px 0;">
        <a href="https://ilinguerelax.com/products" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#2c5282 100%);color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:50px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(30,58,95,0.3);">
          🛒 Ver Productos
        </a>
      </div>
      <p style="font-size:13px;color:#888;margin-top:26px;text-align:center;">
        ⏰ Cupón por tiempo limitado. ¡Aprovéchalo!
      </p>
    </div>
    <div style="background:#1e3a5f;padding:22px;text-align:center;">
      <p style="color:#94a3b8;margin:0;font-size:13px;">© ${new Date().getFullYear()} iLingue Relax</p>
      <p style="color:#64748b;margin:8px 0 0 0;font-size:12px;">hola@ilinguerelax.com</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const name = body?.name ? String(body.name).trim() : undefined;
    const source = body?.source ? String(body.source).slice(0, 60) : 'popup';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'invalid_email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (name && name.length > 120) {
      return new Response(JSON.stringify({ error: 'invalid_name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await upsertBrevoContact({
      email,
      name,
      productName: `newsletter:${source}`,
      provider: 'popup',
    });

    // Enviar email de bienvenida sencillo (texto normal, sin colores)
    const { subject, text, html } = buildWelcomeEmail(name);
    const result = await sendEmail({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject,
      html,
      text,
    } as any);
    if ((result as any)?.error) {
      console.warn('welcome email send failed', (result as any).error);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('subscribe-newsletter error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
