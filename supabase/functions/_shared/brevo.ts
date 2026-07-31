// Email sender — routes purchase/order emails through Brevo via the Lovable
// connector gateway. Falls back to Resend if Brevo is unavailable, so
// existing callers using `resend.emails.send({...})` don't break.

interface SendArgs {
  from?: string;              // "Name <email@domain>" or just "email@domain"
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  replyTo?: string;
  /** Ignored (kept for legacy Brevo template compatibility). */
  templateId?: number;
  params?: Record<string, unknown>;
  /** Force a specific provider for this send, bypassing EMAIL_PROVIDER env. */
  provider?: 'brevo' | 'resend';
  /** Extra RFC headers (merged after the deliverability defaults). */
  headers?: Record<string, string>;
  /** Stable id used for List-Unsubscribe / references (order number, idem key). */
  entityRef?: string;
}

interface SendResult {
  data?: { messageId?: string; id?: string; provider?: string };
  error?: { message: string; status?: number; body?: string };
}

const DEFAULT_FROM_NAME = "iLingue Relax";
const DEFAULT_FROM_EMAIL = "hola@ilinguerelax.com";
const DEFAULT_FROM = `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`;

const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

// ---------------------------------------------------------------------------
// Entregabilidad (Outlook/Hotmail marcaba estos correos como "no deseados").
// Motivos típicos y su arreglo aquí:
//  1) Solo parte HTML → añadimos siempre una alternativa de texto plano.
//  2) Sin cabeceras de baja → añadimos List-Unsubscribe + One-Click.
//  3) Sin Reply-To real → respondemos siempre desde/hacia hola@ilinguerelax.com.
// ---------------------------------------------------------------------------
const UNSUBSCRIBE_URL = "https://www.ilinguerelax.com/mi-pedido";

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|tr|li|h[1-6]|table)\s*>/gi, "\n")
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) =>
      `${String(label).replace(/<[^>]+>/g, "").trim()} (${href})`)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function deliverabilityHeaders(args: SendArgs): Record<string, string> {
  const ref = args.entityRef ? String(args.entityRef).slice(0, 120) : undefined;
  return {
    "List-Unsubscribe": `<mailto:${DEFAULT_FROM_EMAIL}?subject=unsubscribe>, <${UNSUBSCRIBE_URL}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    ...(ref ? { "X-Entity-Ref-ID": ref } : {}),
    ...(args.headers ?? {}),
  };
}

function withDefaults(args: SendArgs): SendArgs {
  return {
    ...args,
    replyTo: args.replyTo || DEFAULT_FROM_EMAIL,
    text: args.text || (args.html ? htmlToPlainText(args.html) : undefined),
  };
}


function parseFrom(from?: string): { name: string; email: string } {
  const raw = (from ?? DEFAULT_FROM).trim();
  const m = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1] || DEFAULT_FROM_NAME, email: m[2] };
  return { name: DEFAULT_FROM_NAME, email: raw || DEFAULT_FROM_EMAIL };
}

async function sendViaBrevo(args: SendArgs): Promise<SendResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  if (!LOVABLE_API_KEY || !BREVO_API_KEY) {
    return { error: { message: "Brevo not configured (missing LOVABLE_API_KEY or BREVO_API_KEY)" } };
  }

  const to = (Array.isArray(args.to) ? args.to : [args.to]).map((email) => ({ email }));
  const sender = parseFrom(args.from);

  const payload: Record<string, unknown> = {
    sender,
    to,
    subject: args.subject ?? "",
    htmlContent: args.html ?? "",
  };
  if (args.text) payload.textContent = args.text;
  if (args.replyTo) payload.replyTo = { email: args.replyTo };
  payload.headers = deliverabilityHeaders(args);

  const res = await fetch(`${GATEWAY_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Brevo send failed [${res.status}]: ${text}`);
    return { error: { message: "Brevo send failed", status: res.status, body: text } };
  }
  try {
    const parsed = JSON.parse(text);
    return { data: { messageId: parsed.messageId, id: parsed.messageId, provider: "brevo" } };
  } catch {
    return { data: { provider: "brevo" } };
  }
}

async function sendViaResend(args: SendArgs): Promise<SendResult> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return { error: { message: "Missing RESEND_API_KEY" } };
  }

  const to = Array.isArray(args.to) ? args.to : [args.to];
  const body: Record<string, unknown> = {
    from: args.from ?? DEFAULT_FROM,
    to,
    subject: args.subject ?? "",
    html: args.html ?? "",
  };
  if (args.text) body.text = args.text;
  if (args.replyTo) body.reply_to = args.replyTo;
  body.headers = deliverabilityHeaders(args);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Resend send failed [${res.status}]: ${text}`);
    return { error: { message: "Resend send failed", status: res.status, body: text } };
  }
  try {
    const parsed = JSON.parse(text);
    return { data: { messageId: parsed.id, id: parsed.id, provider: "resend" } };
  } catch {
    return { data: { provider: "resend" } };
  }
}

export async function sendEmail(rawArgs: SendArgs): Promise<SendResult> {
  const args = withDefaults(rawArgs);
  // Explicit per-call override wins (used for newsletters to avoid Brevo click tracking).
  if (args.provider === 'resend') return sendViaResend(args);
  if (args.provider === 'brevo') {
    const p = await sendViaBrevo(args);
    if (!p.error) return p;
    return sendViaResend(args);
  }
  // Provider selection: EMAIL_PROVIDER = "brevo" (default) | "resend" | "auto"
  const provider = (Deno.env.get("EMAIL_PROVIDER") ?? "brevo").toLowerCase();

  if (provider === "resend") return sendViaResend(args);

  // Brevo primary; on failure fall back to Resend so a purchase email never gets lost.
  const primary = await sendViaBrevo(args);
  if (!primary.error) return primary;

  console.warn("Brevo failed, falling back to Resend:", primary.error);
  const fallback = await sendViaResend(args);
  if (!fallback.error) return fallback;

  // Both failed — surface Brevo's error (it was the intended provider).
  return primary;
}

// Backwards-compatible shim: existing code uses `resend.emails.send({...})`.
export const resend = {
  emails: {
    send: (args: SendArgs) => sendEmail(args),
  },
};
