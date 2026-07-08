// Shared Brevo email sender using Lovable Connector Gateway.
// Drop-in replacement for `resend.emails.send({ from, to, subject, html })`.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

interface SendArgs {
  from?: string; // e.g. "iLingue Relax <hola@ilinguerelax.com>"; optional when using templateId (Brevo template sender wins)
  to: string | string[];
  subject?: string;
  html?: string;
  replyTo?: string;
  templateId?: number;         // Brevo template ID (Marketing → Templates)
  params?: Record<string, unknown>; // Variables for {{ params.xxx }} in the template
}

interface SendResult {
  data?: { messageId?: string };
  error?: { message: string; status?: number; body?: string };
}

function parseAddress(input: string): { email: string; name?: string } {
  const m = input.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2] };
  return { email: input.trim() };
}

export async function sendBrevoEmail(args: SendArgs): Promise<SendResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  if (!LOVABLE_API_KEY || !BREVO_API_KEY) {
    return { error: { message: "Missing LOVABLE_API_KEY or BREVO_API_KEY" } };
  }

  const sender = parseAddress(args.from);
  const toList = Array.isArray(args.to) ? args.to : [args.to];
  const to = toList.map((t) => parseAddress(t));

  const body: Record<string, unknown> = {
    sender,
    to,
    subject: args.subject,
    htmlContent: args.html,
  };
  if (args.replyTo) body.replyTo = parseAddress(args.replyTo);

  const res = await fetch(`${GATEWAY_URL}/v3/smtp/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": BREVO_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Brevo send failed [${res.status}]: ${text}`);
    return { error: { message: "Brevo send failed", status: res.status, body: text } };
  }
  try {
    const parsed = JSON.parse(text);
    return { data: { messageId: parsed.messageId } };
  } catch {
    return { data: {} };
  }
}

// Resend-compatible shim so existing code `resend.emails.send({...})` keeps working.
export const resend = {
  emails: {
    send: (args: SendArgs) => sendBrevoEmail(args),
  },
};
