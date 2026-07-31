import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import { BRAND, escapeHtml, renderBrandedEmail, formatLocalFromUsd } from '../_shared/emailBrand.ts'
import { assertInternalCall } from "../_shared/internalAuth.ts";

// -------- Sample data (mirrors production) --------
const SAMPLE_PRODUCT = {
  name: '5,000 Palabras en Inglés con Pronunciación',
  sku: '5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa',
  price_usd: 22,
  cover: 'https://ilinguerelax.com/placeholder.svg',
}

// -------- Digital delivery preview (mirrors send-digital-ilinguerelax) --------
function buildDigitalPreview() {
  const firstName = 'María'
  const orderRef = 'ILR-ST-20260710-ABC123'
  const products = [
    {
      name: SAMPLE_PRODUCT.name,
      price_usd: 22,
      drive_url: 'https://www.ilinguerelax.com/mi-descarga?t=EJEMPLO',
      access_key: null,
      cover: SAMPLE_PRODUCT.cover,
      bonuses: [
        { name: 'Bonus 1 — Guía de pronunciación UK/USA', drive_url: 'https://www.ilinguerelax.com/mi-descarga?t=EJEMPLO', access_key: null },
        { name: 'Bonus 2 — Diccionario básico PDF', drive_url: 'https://www.ilinguerelax.com/mi-descarga?t=EJEMPLO', access_key: null },
      ],
    },
    {
      name: '500 Preguntas en Inglés (adicional)',
      price_usd: 7,
      drive_url: 'https://www.ilinguerelax.com/mi-descarga?t=EJEMPLO',
      access_key: null,
      cover: SAMPLE_PRODUCT.cover,
      bonuses: [],
    },
  ]
  const hasMultiple = products.length > 1
  const blocks = products.map((p) => {
    const bonusHtml = p.bonuses.length
      ? `<div style="margin-top:14px;padding-top:14px;border-top:1px dashed ${BRAND.border};">
          <div style="font-size:11px;font-weight:bold;color:#166534;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">🎁 Bonos incluidos</div>
          ${p.bonuses.map((b, i) => `<div style="margin:6px 0;font-size:13px;color:#374151;"><strong>${escapeHtml(b.name || `Bonus ${i + 1}`)}:</strong> <a href="${escapeHtml(b.drive_url)}" style="color:${BRAND.primary};text-decoration:underline;">Descargar</a>${b.access_key ? ` · Clave: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:monospace;">${escapeHtml(b.access_key)}</code>` : ''}</div>`).join('')}
        </div>`
      : `<div style="margin-top:12px;font-size:12px;color:${BRAND.muted};font-style:italic;">Sin bonos adicionales para este producto.</div>`
    return `<div style="border:1px solid ${BRAND.border};border-radius:12px;padding:20px;margin:14px 0;background:${BRAND.bg};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="72" valign="top" style="padding-right:12px;"><img src="${escapeHtml(p.cover)}" alt="" width="64" height="64" style="border-radius:8px;object-fit:cover;display:block;"></td>
        <td valign="top"><div style="font-size:16px;font-weight:bold;color:${BRAND.text};">${escapeHtml(p.name)}</div><div style="font-size:12px;color:${BRAND.muted};margin-top:2px;">USD ${p.price_usd.toFixed(2)}</div></td>
      </tr></table>
      <div style="margin-top:12px;"><a href="${escapeHtml(p.drive_url)}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;font-size:14px;">⬇ Abrir mis descargas</a></div>

      ${bonusHtml}
    </div>`
  }).join('')
  const stepsHtml = `<div style="background:#eff6ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:14px 18px;margin:0 0 18px;font-size:13px;color:#1e40af;line-height:1.6;">📖 <strong>Cómo descargar cada producto:</strong><ol style="margin:8px 0 0;padding-left:20px;"><li>Haz clic en "Descargar / Ver en Drive" de cada producto.</li><li>Se abrirá Google Drive → pulsa ⬇ para guardar el PDF.</li><li>Si pide clave de acceso, cópiala del email.</li><li>Repite con el producto adicional (upsell).</li></ol></div>`
  const tipHtml = `<div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:20px 0;font-size:13px;color:#78350f;">💡 <strong>Consejo:</strong> guarda los PDFs en tu teléfono o computadora.</div>`
  return {
    subject: `Gracias por tu compra — ${orderRef} · enlaces de descarga (incluye producto adicional)`,
    html: renderBrandedEmail({
      preheader: `Enlaces de descarga de tu compra ${orderRef}`,
      headline: `¡Gracias por tu compra, ${firstName}! 🎉`,
      orderNumber: orderRef,
      intro: `Tu compra incluye <strong>${products.length} productos</strong> (principal + adicional). Abajo tienes el enlace de descarga y la clave de cada uno.`,
      bodyHtml: `${stepsHtml}${blocks}${tipHtml}`,
      lang: 'es',
    }),
  }
}

// -------- Abandoned cart preview (mirrors process-abandoned-carts) --------
const COUPON_CODE = 'NEW10'

function couponBlock(): string {
  return `<div style="background:#fff7ed;border:2px dashed ${BRAND.accent};border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center;">
    <div style="font-size:13px;color:#9a3412;margin-bottom:6px;">Usa este cupón al pagar y obtén un 10% de descuento extra:</div>
    <div style="font-size:26px;font-weight:900;letter-spacing:4px;color:${BRAND.accent};">${COUPON_CODE}</div>
  </div>`
}

function productCard(): string {
  const local = formatLocalFromUsd(SAMPLE_PRODUCT.price_usd, { language: 'es' })
  return `<div style="border:1px solid ${BRAND.border};border-radius:12px;padding:16px;margin:16px 0;background:${BRAND.soft};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="72" valign="top" style="padding-right:12px;"><img src="${escapeHtml(SAMPLE_PRODUCT.cover)}" alt="" width="64" height="64" style="border-radius:8px;object-fit:cover;display:block;"></td>
      <td valign="top"><div style="font-size:15px;font-weight:bold;color:${BRAND.text};line-height:1.35;">${escapeHtml(SAMPLE_PRODUCT.name)}</div><div style="margin-top:6px;font-size:14px;color:${BRAND.primary};font-weight:bold;">Precio: ${local}</div></td>
    </tr></table>
  </div>`
}

function buildAbandonedPreview(index: number) {
  const firstName = 'María'
  const productUrl = `${BRAND.siteUrl}/products/${SAMPLE_PRODUCT.sku}`
  const local = formatLocalFromUsd(SAMPLE_PRODUCT.price_usd, { language: 'es' })
  const priceInline = ` (${local})`
  const card = productCard()
  const templates = [
    {
      subject: `Tu carrito te espera — ${SAMPLE_PRODUCT.name}`,
      headline: '¡Tu material te está esperando!',
      intro: `Hola ${firstName}, notamos que estabas por llevar <strong>${escapeHtml(SAMPLE_PRODUCT.name)}</strong>${priceInline} y no completaste la compra.`,
      body: `${card}<p style="font-size:14px;color:#4b5563;line-height:1.6;">Tu selección sigue disponible. Aprende a tu ritmo, con descarga inmediata en PDF.</p>${couponBlock()}`,
      note: 'Este cupón puede caducar pronto.',
    },
    {
      subject: `${firstName}, sigue pendiente tu ${SAMPLE_PRODUCT.name}`,
      headline: 'Por qué miles ya aprenden con nosotros',
      intro: `Ayer viste <strong>${escapeHtml(SAMPLE_PRODUCT.name)}</strong>${priceInline}. Aquí lo que incluye:`,
      body: `<ul style="color:#4b5563;line-height:1.9;font-size:14px;padding-left:20px;"><li>✅ Contenido con pronunciación adaptada</li><li>✅ Bonos gratis incluidos</li><li>✅ Descarga inmediata en PDF</li><li>✅ Actualizaciones de por vida</li></ul>${card}${couponBlock()}`,
      note: 'Más de 1,200 estudiantes ya confían en el método Relax.',
    },
    {
      subject: `⏰ Última semana con descuento — ${SAMPLE_PRODUCT.name}`,
      headline: 'El tiempo corre',
      intro: `Han pasado varios días desde que viste <strong>${escapeHtml(SAMPLE_PRODUCT.name)}</strong>${priceInline}. El descuento es por tiempo limitado.`,
      body: `${card}<p style="font-size:14px;color:#4b5563;line-height:1.6;">Solo necesitas 10-15 minutos al día para avanzar. Sin estrés, a tu ritmo.</p>${couponBlock()}`,
      note: 'Recuerda: incluye bonos gratis.',
    },
    {
      subject: `Un último recordatorio — ${SAMPLE_PRODUCT.name}`,
      headline: 'Un último mensaje para ti',
      intro: `Ha pasado un mes desde que viste <strong>${escapeHtml(SAMPLE_PRODUCT.name)}</strong>. Este será nuestro último correo — te dejamos un cupón por si algún día decides dar el paso.`,
      body: `${card}${couponBlock()}<p style="font-size:14px;color:#4b5563;line-height:1.6;">Cuando estés listo, estaremos aquí para ayudarte. 💜</p>`,
      note: 'Este es nuestro último correo sobre este pedido.',
    },
  ]
  const t = templates[Math.max(0, Math.min(3, index))]
  return {
    subject: t.subject,
    html: renderBrandedEmail({
      preheader: t.intro.replace(/<[^>]+>/g, '').slice(0, 140),
      headline: t.headline,
      intro: t.intro,
      bodyHtml: t.body,
      ctaText: 'Completar mi compra →',
      ctaUrl: productUrl,
      secondaryNote: t.note,
      lang: 'es',
    }),
  }
}

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

  const __blocked = assertInternalCall(req);
  if (__blocked) return __blocked;
  try {
    const url = new URL(req.url)
    const kind = url.searchParams.get('kind') || 'order'
    const idx = Number(url.searchParams.get('index') || '0')

    let subject = ''
    let html = ''
    if (kind === 'order') ({ subject, html } = await renderTemplate('thank-you'))
    else if (kind === 'digital') ({ subject, html } = buildDigitalPreview())
    else if (kind === 'abandoned') ({ subject, html } = buildAbandonedPreview(idx))
    else throw new Error(`Unknown kind: ${kind}`)

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
