import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { upsertBrevoContact } from '../_shared/brevoContact.ts';
import { sendEmail } from '../_shared/brevo.ts';

const FROM = 'iLingue Relax <hola@ilinguerelax.com>';
const REPLY_TO = 'hola@ilinguerelax.com';

function buildWelcomeEmail(name?: string) {
  const hola = name ? `Hola ${name},` : 'Hola,';
  const subject = `¡Bienvenidos a iLingue Relax! Te daré el cupón 10% de descuento 🎁`;
  const text = `${hola}

Bienvenid@ a iLingue Relax. Gracias por suscribirte.

Como regalo de bienvenida, aquí tienes tu cupón del 10% de descuento:

    NEW10

Úsalo al finalizar tu compra en la tienda.

Si necesitas cualquier cosa, escríbenos a hola@ilinguerelax.com.

Un saludo,
El equipo de iLingue Relax
hola@ilinguerelax.com`;

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #111;">
  <p>${hola}</p>
  <p>Bienvenid@ a <strong>iLingue Relax</strong>. Gracias por suscribirte.</p>
  <p>Como regalo de bienvenida, aquí tienes tu cupón del <strong>10% de descuento</strong>:</p>
  <p style="font-family: monospace; font-size: 18px; padding: 8px 0;"><strong>NEW10</strong></p>
  <p>Úsalo al finalizar tu compra en la tienda.</p>
  <p>Si necesitas cualquier cosa, escríbenos a <a href="mailto:hola@ilinguerelax.com">hola@ilinguerelax.com</a>.</p>
  <p>Un saludo,<br/>El equipo de iLingue Relax<br/>hola@ilinguerelax.com</p>
</div>`;

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
