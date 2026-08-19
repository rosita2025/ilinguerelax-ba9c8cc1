// Correos de envío para pedidos físicos:
//  1) aviso previo  → "tu digital ya está; el tracking va en camino"
//  2) tracking nuevo → número de seguimiento + enlace
//  3) tracking actualizado / entregado
//
// Todos los envíos quedan registrados en email_send_log y order_events, de modo
// que el panel muestre el estado REAL (antes se logueaba "enviado" aunque el
// proveedor rechazara el correo).
import { sendEmail } from "./brevo.ts";
import { BRAND, escapeHtml, renderBrandedEmail } from "./emailBrand.ts";

export type ShippingEmailKind = "pre_notice" | "tracking_new" | "tracking_updated" | "delivered";

const TEMPLATE_BY_KIND: Record<ShippingEmailKind, string> = {
  pre_notice: "shipping-pre-notice",
  tracking_new: "shipping-tracking",
  tracking_updated: "shipping-tracking-updated",
  delivered: "shipping-delivered",
};

/** Parámetros de URL que suelen contener el código de rastreo. */
const TRACKING_PARAMS = [
  "shipmentid", "trackingnumber", "tracking_number", "trknbr", "tracknum",
  "awb", "ptracking", "codigo", "code", "track", "tracking", "id", "n",
];

/**
 * Normaliza lo que el operador escribió en el panel:
 *  - si es un código, lo devuelve tal cual
 *  - si es una URL con el código dentro, extrae el código y guarda el enlace
 *  - si es una URL genérica sin código (ej. www.amazon.com/tracking) => error
 */
export function normalizeTracking(raw?: string | null): {
  code: string | null;
  url: string | null;
  error?: string;
} {
  const value = String(raw ?? "").trim();
  if (!value) return { code: null, url: null };

  const looksUrl = /^https?:\/\//i.test(value) || /^www\./i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}\//i.test(value);
  if (!looksUrl) {
    const code = value.replace(/\s+/g, "");
    if (!/[a-z0-9]/i.test(code) || code.replace(/[^a-z0-9]/gi, "").length < 6) {
      return { code: null, url: null, error: "El número de seguimiento debe tener al menos 6 caracteres alfanuméricos." };
    }
    return { code, url: null };
  }

  const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return { code: null, url: null, error: "El enlace de seguimiento no es válido." };
  }

  let code: string | null = null;
  for (const [k, v] of parsed.searchParams.entries()) {
    if (TRACKING_PARAMS.includes(k.toLowerCase()) && v.replace(/[^a-z0-9]/gi, "").length >= 6) {
      code = v.trim();
      break;
    }
  }
  if (!code) {
    const segments = parsed.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? "";
    if (/^[a-z0-9-]{8,}$/i.test(last) && /\d/.test(last)) code = last;
  }
  if (!code) {
    return {
      code: null,
      url: null,
      error: "Ese enlace no contiene un código de rastreo. Pega el número de seguimiento real (o el enlace completo que incluya el código).",
    };
  }
  return { code, url: href };
}

export function buildTrackingUrl(provider?: string | null, tracking?: string | null): string | null {
  const t = String(tracking ?? "").trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  const p = String(provider ?? "").toLowerCase();
  if (p.includes("amazon")) return `https://www.amazon.com/progress-tracker/package/ref=pt_redirect_from_gp?shipmentId=${encodeURIComponent(t)}`;
  if (p.includes("dhl")) return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(t)}`;
  if (p.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(t)}`;
  if (p.includes("ups")) return `https://www.ups.com/track?tracknum=${encodeURIComponent(t)}`;
  if (p.includes("serpost")) return `https://www.serpost.com.pe/Cliente/ConsultaEnvio?pTracking=${encodeURIComponent(t)}`;
  if (p.includes("olva")) return `https://www.olvacourier.com/rastrea-tu-envio/?codigo=${encodeURIComponent(t)}`;
  if (p.includes("correos") || p.includes("shalom") || p.includes("dpd")) return null;
  return null;
}

interface BuildInput {
  kind: ShippingEmailKind;
  orderNumber: string;
  name?: string | null;
  email: string;
  trackingNumber?: string | null;
  /** Enlace directo de rastreo (si el operador pegó una URL con el código). */
  trackingUrl?: string | null;
  shippingProvider?: string | null;
}

function orderStatusUrl(orderNumber: string, email: string) {
  return `${BRAND.siteUrl}/mi-pedido?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`;
}

export function buildShippingEmail(input: BuildInput): { subject: string; html: string } {
  const rawName = (input.name || "").trim();
  const greeting = rawName ? `Hola ${escapeHtml(rawName)}` : "Hola";
  const order = escapeHtml(input.orderNumber);
  const statusUrl = orderStatusUrl(input.orderNumber, input.email);
  const trackingUrl = (input.trackingUrl && String(input.trackingUrl).trim())
    || buildTrackingUrl(input.shippingProvider, input.trackingNumber);
  const carrierRaw = (input.shippingProvider || "").trim();
  const carrier = escapeHtml(carrierRaw);
  const tracking = escapeHtml((input.trackingNumber || "").trim());

  const trackingBox = `
    <div style="background:${BRAND.soft};border:1px solid ${BRAND.border};padding:18px;border-radius:12px;margin:18px 0;">
      <p style="margin:0;font-size:13px;color:${BRAND.muted};">Número de seguimiento</p>
      <p style="margin:4px 0 14px;font-size:18px;font-weight:bold;color:${BRAND.text};word-break:break-all;">${tracking}</p>
      ${carrierRaw ? `<p style="margin:0;font-size:13px;color:${BRAND.muted};">Transportista</p>
      <p style="margin:4px 0 0;font-size:15px;font-weight:bold;color:${BRAND.text};">${carrier}</p>` : ""}
    </div>`;


  if (input.kind === "pre_notice") {
    return {
      subject: `✅ Pedido ${input.orderNumber} confirmado · tu libro físico está en preparación`,
      html: renderBrandedEmail({
        preheader: "Tu material digital ya está en tu correo. El tracking del libro llega en breve.",
        headline: "¡Gracias por tu compra!",
        orderNumber: input.orderNumber,
        intro: `Hola ${name}, tu pedido <strong>${order}</strong> ya está confirmado.`,
        bodyHtml: `
          <div style="background:${BRAND.soft};border:1px solid ${BRAND.border};padding:18px;border-radius:12px;margin:18px 0;">
            <p style="margin:0 0 10px;font-size:15px;color:${BRAND.text};"><strong>1. Material digital:</strong> ya fue enviado a este mismo correo. Puedes empezar a estudiar hoy mismo.</p>
            <p style="margin:0;font-size:15px;color:${BRAND.text};"><strong>2. Libro físico:</strong> lo estamos preparando para el despacho. En cuanto salga, te enviamos el número de seguimiento a este correo.</p>
          </div>
          <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0;">No necesitas hacer nada más: nosotros te avisamos. Si no ves el correo con tu material digital, revisa la carpeta de spam o escríbenos.</p>`,
        ctaText: "Ver el estado de mi pedido",
        ctaUrl: statusUrl,
        secondaryNote: "Gracias por tu paciencia y por confiar en iLingue Relax.",
      }),
    };
  }

  if (input.kind === "delivered") {
    return {
      subject: `📬 Tu pedido ${input.orderNumber} fue entregado`,
      html: renderBrandedEmail({
        preheader: "Tu pedido figura como entregado.",
        headline: "Tu pedido fue entregado",
        orderNumber: input.orderNumber,
        intro: `Hola ${name}, el transportista marcó tu pedido <strong>${order}</strong> como entregado.`,
        bodyHtml: `${tracking ? trackingBox : ""}
          <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0;">Si aún no lo recibiste, respóndenos a este correo y lo revisamos contigo.</p>`,
        ctaText: "Ver mi pedido",
        ctaUrl: statusUrl,
      }),
    };
  }

  const updated = input.kind === "tracking_updated";
  return {
    subject: updated
      ? `🔄 Actualizamos el seguimiento de tu pedido ${input.orderNumber}`
      : `📦 Tu pedido ${input.orderNumber} ha sido enviado`,
    html: renderBrandedEmail({
      preheader: updated
        ? "Tu número de seguimiento cambió."
        : "Ya tienes tu número de seguimiento.",
      headline: updated ? "Seguimiento actualizado" : "¡Tu pedido está en camino!",
      orderNumber: input.orderNumber,
      intro: updated
        ? `Hola ${name}, actualizamos los datos de envío de tu pedido <strong>${order}</strong>.`
        : `Hola ${name}, tu pedido <strong>${order}</strong> ya fue despachado.`,
      bodyHtml: `${trackingBox}
        ${trackingUrl ? "" : `<p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0;">Puedes rastrearlo ingresando el número anterior en la web del transportista.</p>`}`,
      ctaText: trackingUrl ? "Rastrear mi pedido" : "Ver mi pedido",
      ctaUrl: trackingUrl ?? statusUrl,
      secondaryNote: `También puedes seguirlo en <a href="${statusUrl}" style="color:${BRAND.primary};">ilinguerelax.com/mi-pedido</a>`,
    }),
  };
}

export interface ShippingEmailResult {
  sent: boolean;
  skipped?: string;
  error?: string;
  messageId?: string;
}

/**
 * Envía el correo y registra el resultado real (email_send_log + order_events).
 * `once` evita duplicados usando el message_id como llave de idempotencia.
 */
export async function sendShippingEmail(
  admin: any,
  input: BuildInput & { once?: boolean },
): Promise<ShippingEmailResult> {
  const email = String(input.email ?? "").trim().toLowerCase();
  const orderNumber = String(input.orderNumber ?? "").trim();
  if (!email || !orderNumber) return { sent: false, skipped: "missing_email_or_order" };

  const templateName = TEMPLATE_BY_KIND[input.kind];
  const messageId = `${templateName}-${orderNumber}`;

  if (input.once) {
    const { data: prev } = await admin
      .from("email_send_log")
      .select("id")
      .eq("message_id", messageId)
      .eq("status", "sent")
      .limit(1);
    if ((prev ?? []).length > 0) return { sent: false, skipped: "already_sent" };
  }

  const { subject, html } = buildShippingEmail({ ...input, email });

  const res = await sendEmail({
    to: email,
    subject,
    html,
    entityRef: orderNumber,
  });

  const ok = !res.error;
  const errorMessage = res.error ? `${res.error.message}${res.error.body ? `: ${String(res.error.body).slice(0, 300)}` : ""}` : null;

  try {
    await admin.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: email,
      status: ok ? "sent" : "failed",
      error_message: errorMessage,
      metadata: {
        order_number: orderNumber,
        kind: input.kind,
        tracking_number: input.trackingNumber ?? null,
        shipping_provider: input.shippingProvider ?? null,
        provider: res.data?.provider ?? null,
      },
    });
  } catch (e) {
    console.error("[shipping-email] log failed:", e);
  }

  try {
    await admin.from("order_events").insert({
      order_number: orderNumber,
      customer_email: email,
      provider: "shipping",
      event: ok ? "delivery_sent" : "delivery_failed",
      status: ok ? "EMAIL_SENT" : "EMAIL_ERROR",
      method: input.kind,
      reference: input.trackingNumber ? String(input.trackingNumber).slice(0, 120) : null,
      detail: ok
        ? `Correo de envío (${input.kind}) enviado a ${email}`
        : `Fallo al enviar correo de envío (${input.kind}): ${errorMessage}`,
      metadata: { kind: input.kind, template: templateName },
    });
  } catch (e) {
    console.error("[shipping-email] order event failed:", e);
  }

  if (!ok) {
    console.error(`[shipping-email] ${templateName} failed for ${email}:`, errorMessage);
    return { sent: false, error: errorMessage ?? "send_failed" };
  }
  console.log(`[shipping-email] ${templateName} sent to ${email} (${orderNumber})`);
  return { sent: true, messageId: res.data?.messageId };
}
