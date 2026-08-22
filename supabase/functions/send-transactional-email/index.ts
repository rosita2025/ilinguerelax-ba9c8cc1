import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import { sendEmail } from '../_shared/brevo.ts'


// Configuration baked in at scaffold time — do NOT change these manually.
// To update, re-run the email domain setup flow.
const SITE_NAME = "ilinguerelax"
// SENDER_DOMAIN is the verified sender subdomain FQDN (e.g., "notify.example.com").
// It MUST match the subdomain delegated to Lovable's nameservers — never the root domain.
// The email API looks up this exact domain; a mismatch causes "No email domain record found".
const SENDER_DOMAIN = "notify.ilinguerelax.com"
// FROM_DOMAIN is the domain shown in the From: header (e.g., "example.com").
// When display_from_root is enabled, this can be the root domain for cleaner branding,
// even though actual sending uses the subdomain above.
const FROM_DOMAIN = "ilinguerelax.com"

// Generate a cryptographically random 32-byte hex token
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Auth: `verify_jwt = true` solo comprueba el JWT anónimo, que es PÚBLICO.
// Por eso aquí distinguimos dos tipos de llamada:
//   - interna (webhooks / cron / admin con service-role o CRON_SHARED_SECRET):
//     puede usar cualquier plantilla y cualquier destinatario.
//   - pública (navegador del comprador): SOLO puede disparar los avisos de
//     pago manual (Yape/Plin, Binance, SPEI, transferencia), con límite por IP.
// Esto impide que un tercero envíe correos con la marca del dominio.
const PUBLIC_TEMPLATES = new Set([
  'admin-manual-pending',
  'customer-manual-pending',
])

const PUBLIC_MAX_PER_WINDOW = 6
const PUBLIC_WINDOW_MS = 10 * 60 * 1000
const publicHits = new Map<string, { n: number; until: number }>()

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function isInternalCall(req: Request): boolean {
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const cronSecret = Deno.env.get('CRON_SHARED_SECRET') ?? ''
  const auth = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  const internalKey = (req.headers.get('x-internal-key') ?? '').trim()
  if (service && safeEqual(auth, service)) return true
  if (cronSecret && (safeEqual(internalKey, cronSecret) || safeEqual(auth, cronSecret))) return true
  return false
}

function publicRateLimited(ip: string): boolean {
  const now = Date.now()
  const cur = publicHits.get(ip)
  if (!cur || cur.until < now) {
    publicHits.set(ip, { n: 1, until: now + PUBLIC_WINDOW_MS })
    return false
  }
  cur.n += 1
  return cur.n > PUBLIC_MAX_PER_WINDOW
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const internal = isInternalCall(req)
  const callerIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'


  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Parse request body
  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (!templateName) {
    return new Response(
      JSON.stringify({ error: 'templateName is required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Puerta pública: desde el navegador solo se permiten los avisos de pago
  // manual, y con límite por IP. Todo lo demás exige llamada interna.
  if (!internal) {
    if (!PUBLIC_TEMPLATES.has(templateName)) {
      console.warn('[send-transactional-email] public call blocked', { templateName, callerIp })
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (publicRateLimited(callerIp)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    // Public callers: strict recipient validation + templateData allowlist.
    // Only fields the manual-pending templates actually use may pass through,
    // coerced to bounded primitives (react-email escapes strings in JSX).
    if (typeof recipientEmail !== 'string' || recipientEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipientEmail' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const PUBLIC_TEMPLATE_KEYS = new Set([
      'orderNumber', 'customerName', 'customerEmail', 'customerPhone',
      'customerCountry', 'productName', 'amount', 'currency', 'method', 'orderDate',
    ])
    const sanitized: Record<string, unknown> = {}
    for (const key of Object.keys(templateData)) {
      if (!PUBLIC_TEMPLATE_KEYS.has(key)) continue
      const value = templateData[key]
      if (typeof value === 'string') sanitized[key] = value.slice(0, 300)
      else if (typeof value === 'number' && Number.isFinite(value)) sanitized[key] = value
    }
    templateData = sanitized
  }



  // 1. Look up template from registry (early — needed to resolve recipient)
  const template = TEMPLATES[templateName]

  if (!template) {
    console.error('Template not found in registry', { templateName })
    return new Response(
      JSON.stringify({
        error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`,
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Resolve effective recipient: template-level `to` takes precedence over
  // the caller-provided recipientEmail. This allows notification templates
  // to always send to a fixed address (e.g., site owner from env var).
  const effectiveRecipient = template.to || recipientEmail

  if (!effectiveRecipient) {
    return new Response(
      JSON.stringify({
        error: 'recipientEmail is required (unless the template defines a fixed recipient)',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Idempotencia común para todos los correos. Webhook, conciliación y barrido
  // pueden descubrir el mismo pago casi al mismo tiempo; todos comparten esta
  // clave y solo el primer envío continúa. Un pending reciente también reserva
  // la clave mientras Brevo responde, evitando la carrera más habitual.
  if (idempotencyKey) {
    messageId = idempotencyKey
    const recentCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: priorSend, error: priorSendError } = await supabase
      .from('email_send_log')
      .select('status, created_at')
      .eq('message_id', idempotencyKey)
      .in('status', ['pending', 'sent'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (priorSendError) {
      console.error('Idempotency check failed — refusing to risk duplicate email', priorSendError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify email idempotency' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (priorSend && (priorSend.status === 'sent' || priorSend.created_at >= recentCutoff)) {
      return new Response(
        JSON.stringify({ success: true, sent: false, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
  }

  // 1.b Anti-duplicados del aviso de venta al admin.
  // Un mismo cliente puede generar 2 pedidos en la pasarela (reintento, doble
  // clic, webhook + página de éxito) con los mismos productos. El admin solo
  // debe recibir UN aviso por cliente y día.
  if (templateName === 'admin-sale') {
    const buyer = String(
      templateData?.customerEmail || templateData?.customer_email || recipientEmail || ''
    ).trim().toLowerCase()
    if (buyer) {
      const dayKey = new Date().toISOString().slice(0, 10)
      const dedupeId = `admin-sale:${buyer}:${dayKey}`
      const { data: priorNotice } = await supabase
        .from('email_send_log')
        .select('id, status, created_at')
        .eq('message_id', dedupeId)
        .in('status', ['pending', 'sent'])
        .limit(1)
        .maybeSingle()

      if (priorNotice) {
        console.log('Admin sale notice deduped', { buyer, dedupeId, priorAt: priorNotice.created_at })
        return new Response(
          JSON.stringify({ success: true, sent: false, duplicate: true, reason: 'admin_sale_already_notified' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Reservamos la clave del día: los siguientes intentos ven este registro.
      messageId = dedupeId
    }
  }


  // 2. Check suppression list (fail-closed: if we can't verify, don't send)
  const { data: suppressed, error: suppressionError } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', effectiveRecipient.toLowerCase())
    .maybeSingle()

  if (suppressionError) {
    console.error('Suppression check failed — refusing to send', {
      error: suppressionError,
      effectiveRecipient,
    })
    return new Response(
      JSON.stringify({ error: 'Failed to verify suppression status' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (suppressed) {
    // Log the suppressed attempt
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })

    console.log('Email suppressed', { effectiveRecipient, templateName })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 3. Get or create unsubscribe token (one token per email address)
  const normalizedEmail = effectiveRecipient.toLowerCase()
  let unsubscribeToken: string

  // Check for existing token for this email
  const { data: existingToken, error: tokenLookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (tokenLookupError) {
    console.error('Token lookup failed', {
      error: tokenLookupError,
      email: normalizedEmail,
    })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to look up unsubscribe token',
    })
    return new Response(
      JSON.stringify({ error: 'Failed to prepare email' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (existingToken && !existingToken.used_at) {
    // Reuse existing unused token
    unsubscribeToken = existingToken.token
  } else if (!existingToken) {
    // Create new token — upsert handles concurrent inserts gracefully
    unsubscribeToken = generateToken()
    const { error: tokenError } = await supabase
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (tokenError) {
      console.error('Failed to create unsubscribe token', {
        error: tokenError,
      })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: 'Failed to create unsubscribe token',
      })
      return new Response(
        JSON.stringify({ error: 'Failed to prepare email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If another request raced us, our upsert was silently ignored.
    // Re-read to get the actual stored token.
    const { data: storedToken, error: reReadError } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (reReadError || !storedToken) {
      console.error('Failed to read back unsubscribe token after upsert', {
        error: reReadError,
        email: normalizedEmail,
      })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: 'Failed to confirm unsubscribe token storage',
      })
      return new Response(
        JSON.stringify({ error: 'Failed to prepare email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    unsubscribeToken = storedToken.token
  } else {
    // Token exists but is already used — email should have been caught by suppression check above.
    // This is a safety fallback; log and skip sending.
    console.warn('Unsubscribe token already used but email not suppressed', {
      email: normalizedEmail,
    })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
      error_message:
        'Unsubscribe token used but email missing from suppressed list',
    })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 4. Render React Email template to HTML and plain text
  // El correo del cliente se inyecta para poder armar el enlace de seguimiento
  // https://www.ilinguerelax.com/mi-pedido?order=...&email=...
  if (!templateData.customerEmail && recipientEmail) {
    templateData = { ...templateData, customerEmail: recipientEmail }
  }
  const html = await renderAsync(
    React.createElement(template.component, templateData)
  )

  const plainText = await renderAsync(
    React.createElement(template.component, templateData),
    { plainText: true }
  )

  // 4b. Pre-send validation: guard against regressions in critical payment data.
  // If the customer-manual-pending email mentions Yape/Plin, the ONLY valid
  // holder number is +51 972 119 741. Any other Peruvian mobile is blocked.
  if (templateName === 'customer-manual-pending') {
    const method = String(templateData?.method || '').toLowerCase()
    const mentionsYape = /yape|plin/.test(html.toLowerCase())
    if (method.includes('yape') || method.includes('plin') || mentionsYape) {
      const REQUIRED = '+51 972 119 741'
      const forbidden = /\+?51\s?9(?!72\s?119\s?741)\d{2}\s?\d{3}\s?\d{3}/
      const hasRequired = html.includes(REQUIRED)
      const hasForbidden = forbidden.test(html.replace(/\u00a0/g, ' '))
      if (!hasRequired || hasForbidden) {
        console.error('Yape number validation FAILED — email blocked', {
          templateName, hasRequired, hasForbidden,
        })
        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: effectiveRecipient,
          status: 'failed',
          error_message: `Pre-send guard: Yape number mismatch (required ${REQUIRED})`,
        })
        return new Response(
          JSON.stringify({
            error: 'Pre-send validation failed',
            reason: `Yape/Plin holder number must be exactly ${REQUIRED}`,
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }
  }

  // Resolve subject — supports static string or dynamic function
  const resolvedSubject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  // 5. Send directly via Brevo (hola@ilinguerelax.com — dominio ya verificado).
  // Se omite la cola de Lovable Emails porque notify.ilinguerelax.com no está verificado.

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const sendResult = await sendEmail({
    to: effectiveRecipient,
    subject: resolvedSubject,
    html,
    replyTo: 'hola@ilinguerelax.com',
    entityRef: messageId,
  })

  if (sendResult.error) {
    console.error('Failed to send email via Brevo', {
      error: sendResult.error,
      templateName,
      effectiveRecipient,
    })

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: sendResult.error.message,
    })

    return new Response(JSON.stringify({ error: 'Failed to send email', details: sendResult.error }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'sent',
  })

  console.log('Transactional email sent via Brevo', { templateName, effectiveRecipient, provider: sendResult.data?.provider })

  return new Response(
    JSON.stringify({ success: true, sent: true, provider: sendResult.data?.provider }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )

})
