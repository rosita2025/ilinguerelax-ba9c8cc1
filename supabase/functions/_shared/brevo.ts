// Email sender — uses Resend directly.
// Brevo gateway currently returns 404 on all routes (API key rejected), so we
// route through the working Resend key while keeping the `resend.emails.send`
// shape so existing callers don't have to change.

interface SendArgs {
  from?: string;
  to: string | string[];
  subject?: string;
  html?: string;
  replyTo?: string;
  /** Ignored (kept for Brevo API compatibility). */
  templateId?: number;
  params?: Record<string, unknown>;
}

interface SendResult {
  data?: { messageId?: string; id?: string };
  error?: { message: string; status?: number; body?: string };
}

const DEFAULT_FROM = "iLingue Relax <hola@ilinguerelax.com>";

export async function sendEmail(args: SendArgs): Promise<SendResult> {
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
  if (args.replyTo) body.reply_to = args.replyTo;

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
    return { data: { messageId: parsed.id, id: parsed.id } };
  } catch {
    return { data: {} };
  }
}

// Backwards-compatible shim: existing code uses `resend.emails.send({...})`.
export const resend = {
  emails: {
    send: (args: SendArgs) => sendEmail(args),
  },
};
