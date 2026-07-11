import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

// ------- Abandoned cart preview (mirrors process-abandoned-carts) -------
const COUPON_CODE = 'NEW10'

function buildEmail(p: { name: string; headline: string; body: string; ctaText: string; ctaUrl: string; footer: string; color: string }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:0;background-color:#f4f4f5;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="background:linear-gradient(135deg,${p.color} 0%,${p.color}dd 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;">${p.headline}</h1>
  </div>
  <div style="background:white;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <p style="font-size:18px;color:#1f2937;margin-bottom:24px;">Hola ${p.name}!</p>
    <div style="font-size:16px;color:#4b5563;line-height:1.6;">${p.body}</div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${p.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,${p.color} 0%,${p.color}dd 100%);color:white;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:18px;font-weight:bold;box-shadow:0 4px 14px ${p.color}66;">${p.ctaText}</a>
    </div>
    <p style="font-size:14px;color:#9ca3af;text-align:center;margin-top:24px;">${p.footer}</p>
  </div>
  <div style="text-align:center;padding:24px;color:#9ca3af;font-size:12px;">
    <p style="margin:0;">© ${new Date().getFullYear()} iLingue Relax · ilinguerelax.com</p>
    <p style="margin:8px 0 0 0;">Si no deseas recibir más correos, simplemente ignora este mensaje.</p>
  </div>
</div></body></html>`
}

function cupon() {
  return `<div style="background:linear-gradient(135deg,#f3e8ff,#ede9fe);border:2px dashed #8b5cf6;border-radius:12px;padding:16px 24px;margin:24px 0;text-align:center;">
    <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">Usa este cupón al pagar y obtén un 10% de descuento extra:</p>
    <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:4px;color:#7c3aed;">${COUPON_CODE}</p>
  </div>`
}

const productUrl = 'https://ilinguerelax.com/products/ingles-relax-5000-palabras'
const productName = '5,000 Palabras'
const name = 'María'

const abandonedEmails = [
  {
    day: 'Día 1',
    subject: `Tu carrito está esperando - iLingue Relax ${productName} 🛒`,
    html: buildEmail({
      name, headline: '¡Tu libro te está esperando!',
      body: `<p>Notamos que estabas a punto de conseguir <strong>"Inglés Relax - 5,000 Palabras"</strong> pero no completaste la compra.</p>
      <p>¡No te preocupes! Tu selección sigue disponible al <strong>precio especial de $12</strong> (antes $54).</p>${cupon()}`,
      ctaText: 'Completar mi compra →', ctaUrl: productUrl,
      footer: 'Este precio especial podría no estar disponible por mucho tiempo.', color: '#8b5cf6',
    }),
  },
  {
    day: 'Día 7',
    subject: `Tu carrito está esperando - iLingue Relax ${productName} 🧠`,
    html: buildEmail({
      name, headline: '¿Por qué miles ya aprenden con nosotros?',
      body: `<p>Hace unos días estuviste viendo <strong>"Inglés Relax - 5,000 Palabras"</strong>. Estos son los beneficios:</p>
      <ul style="color:#4b5563;line-height:2;"><li>✅ 5,000 palabras con pronunciación en español</li><li>✅ Fonética UK y USA</li><li>✅ 52 capítulos temáticos</li><li>✅ 4 Bonus GRATIS</li><li>✅ Descarga inmediata</li></ul>
      <p>Todo por solo <strong>$12</strong> en lugar de $54. ¡78% de descuento!</p>${cupon()}`,
      ctaText: '¡Quiero mi libro ahora! 📚', ctaUrl: productUrl,
      footer: 'Más de 1,200 personas ya confían en el método Relax.', color: '#6366f1',
    }),
  },
  {
    day: 'Día 15',
    subject: `⏰ Tu carrito está esperando - iLingue Relax ${productName}`,
    html: buildEmail({
      name, headline: '¡Última oportunidad!',
      body: `<p>Han pasado 15 días desde que visitaste <strong>"Inglés Relax - 5,000 Palabras"</strong>.</p>
      <p>El precio especial de <strong>$12</strong> (ahorro del 78%) es por tiempo limitado.</p>${cupon()}`,
      ctaText: 'Aprovechar el descuento →', ctaUrl: productUrl,
      footer: 'Esta podría ser tu última oportunidad a este precio.', color: '#ef4444',
    }),
  },
  {
    day: 'Día 30',
    subject: `Tu carrito está esperando - iLingue Relax ${productName} 🎁`,
    html: buildEmail({
      name, headline: 'Un último mensaje',
      body: `<p>Ha pasado un mes desde que visitaste nuestra página. Este será nuestro último correo sobre <strong>"Inglés Relax - 5,000 Palabras"</strong>.</p>
      <p>Antes de despedirnos, aquí tienes un cupón especial del 10% por si algún día decides dar el paso:</p>${cupon()}
      <p>Aprender inglés no tiene que ser difícil. Cuando estés lista, aquí estaremos. 💜</p>`,
      ctaText: 'Guardar mi enlace de compra →', ctaUrl: productUrl,
      footer: '¡Te deseamos lo mejor! Este es nuestro último correo.', color: '#8b5cf6',
    }),
  },
]

async function renderTemplate(name: string): Promise<{ subject: string; html: string }> {
  const entry = TEMPLATES[name]
  if (!entry) throw new Error(`Unknown template: ${name}`)
  const data = entry.previewData || {}
  const subject = typeof entry.subject === 'function' ? entry.subject(data) : entry.subject
  const html = await renderAsync(React.createElement(entry.component, data))
  return { subject, html }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const url = new URL(req.url)
    const kind = url.searchParams.get('kind') || 'order'
    const idx = Number(url.searchParams.get('index') || '0')

    let subject = ''
    let html = ''
    if (kind === 'order') ({ subject, html } = await renderTemplate('thank-you'))
    else if (kind === 'digital') ({ subject, html } = await renderTemplate('material-delivery'))
    else if (kind === 'abandoned') {
      const e = abandonedEmails[Math.max(0, Math.min(3, idx))]
      subject = e.subject; html = e.html
    } else throw new Error(`Unknown kind: ${kind}`)

    if (url.searchParams.get('format') === 'json') {
      return new Response(JSON.stringify({ subject, html }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    return new Response(html, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
