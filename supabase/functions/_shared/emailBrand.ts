// Shared branded email chrome for iLingue Relax transactional emails.
// Keeps the same header / colors / footer across order confirmation,
// digital delivery, and abandoned-cart sequences.

export const BRAND = {
  name: "iLingue Relax",
  primary: "#0f766e",       // teal
  primaryDark: "#0b5f58",
  accent: "#f97316",        // coral / CTA highlight
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#ffffff",
  soft: "#f9fafb",
  siteUrl: "https://ilinguerelax.com",
  supportEmail: "hola@ilinguerelax.com",
  whatsapp: "+1 251 272 4704",
  whatsappUrl: "https://wa.me/12512724704",
};

export const escapeHtml = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ));

// Currency map used when we don't have a real cart currency (abandoned cart).
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", MX: "MXN", PE: "PEN", CL: "CLP", CO: "COP", AR: "ARS",
  UY: "UYU", VE: "USD", BO: "BOB", EC: "USD", PY: "PYG", BR: "BRL",
  ES: "EUR", FR: "EUR", DE: "EUR", IT: "EUR", PT: "EUR", NL: "EUR", BE: "EUR",
  GB: "GBP", CH: "CHF", NO: "NOK", SE: "SEK", DK: "DKK",
  JP: "JPY", KR: "KRW", CN: "CNY", AU: "AUD", NZ: "NZD",
};

const LANG_TO_CURRENCY: Record<string, string> = {
  es: "USD", en: "USD", fr: "EUR", pt: "BRL", it: "EUR", de: "EUR",
};

// Rough conversion factors USD -> local (rounded for display in reminder emails).
// Real payment providers charge at their own live FX; this is display only.
const USD_TO: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.80, CAD: 1.36, MXN: 18.5, PEN: 3.75, CLP: 950,
  COP: 4100, ARS: 950, BRL: 5.4, UYU: 40, BOB: 6.9, PYG: 7300,
  CHF: 0.88, NOK: 10.5, SEK: 10.5, DKK: 6.9,
  JPY: 155, KRW: 1350, CNY: 7.2, AUD: 1.52, NZD: 1.65,
};

export function pickCurrency(opts: { country?: string; language?: string }): string {
  const c = opts.country?.toUpperCase();
  if (c && COUNTRY_TO_CURRENCY[c]) return COUNTRY_TO_CURRENCY[c];
  const l = opts.language?.toLowerCase();
  if (l && LANG_TO_CURRENCY[l]) return LANG_TO_CURRENCY[l];
  return "USD";
}

export function fmtMoney(amount: number, currency = "USD", locale = "es"): string {
  const c = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: c, maximumFractionDigits: c === "CLP" || c === "COP" || c === "PYG" || c === "JPY" || c === "KRW" ? 0 : 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${c}`;
  }
}

/** Convert a USD price to local currency using a rough table. Payment provider still charges live rates. */
export function convertFromUsd(usd: number, currency: string): number {
  const rate = USD_TO[currency.toUpperCase()] ?? 1;
  const raw = usd * rate;
  // Round to friendly numbers: JPY/KRW/CLP/COP/PYG whole units, others 2 decimals
  if (["JPY", "KRW", "CLP", "COP", "PYG"].includes(currency.toUpperCase())) {
    return Math.round(raw);
  }
  return Math.round(raw * 100) / 100;
}

/** Format a USD amount in the recipient's local currency for display. */
export function formatLocalFromUsd(
  usd: number,
  opts: { country?: string; language?: string } = {},
): string {
  const currency = pickCurrency(opts);
  const local = convertFromUsd(usd, currency);
  return fmtMoney(local, currency, opts.language || "es");
}

interface BrandedEmailOptions {
  preheader: string;
  headline: string;
  intro?: string;
  orderNumber?: string;
  bodyHtml: string;         // arbitrary HTML for the middle section
  ctaText?: string;
  ctaUrl?: string;
  secondaryNote?: string;   // small paragraph under the CTA
  lang?: string;            // 'es' | 'en'
}

/** Renders the shared iLingue Relax branded email shell. */
export function renderBrandedEmail(o: BrandedEmailOptions): string {
  const lang = o.lang || "es";
  const supportLabel = lang === "en" ? "Need help?" : "¿Alguna duda?";
  const orderLabel = lang === "en" ? "ORDER" : "PEDIDO";
  const cta = o.ctaText && o.ctaUrl
    ? `<div style="text-align:center;margin:28px 0 8px;">
         <a href="${o.ctaUrl}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:bold;box-shadow:0 4px 12px rgba(15,118,110,.25);">${escapeHtml(o.ctaText)}</a>
       </div>`
    : "";
  const orderTag = o.orderNumber
    ? `<div style="font-size:11px;color:${BRAND.muted};letter-spacing:1px;margin:6px 0 0;">${orderLabel} #${escapeHtml(o.orderNumber)}</div>`
    : "";
  const intro = o.intro
    ? `<p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 16px;">${o.intro}</p>`
    : "";
  const secondary = o.secondaryNote
    ? `<p style="text-align:center;font-size:13px;color:${BRAND.muted};margin:6px 0 0;">${o.secondaryNote}</p>`
    : "";

  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(o.headline)}</title></head>
<body style="background:${BRAND.bg};margin:0;padding:0;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(o.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;padding:32px 24px;">
        <tr><td style="border-bottom:2px solid ${BRAND.primary};padding-bottom:12px;">
          <div style="font-size:20px;font-weight:bold;color:${BRAND.primary};letter-spacing:1px;">${BRAND.name}</div>
          ${orderTag}
        </td></tr>
        <tr><td style="padding-top:24px;">
          <h1 style="font-size:24px;color:${BRAND.text};margin:0 0 12px;line-height:1.3;">${escapeHtml(o.headline)}</h1>
          ${intro}
          ${o.bodyHtml}
          ${cta}
          ${secondary}
        </td></tr>
        <tr><td style="padding-top:28px;border-top:1px solid ${BRAND.border};margin-top:24px;">
          <p style="font-size:13px;color:#4b5563;line-height:1.6;margin:16px 0 8px;">${supportLabel} <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.primary};text-decoration:underline;">${BRAND.supportEmail}</a> · WhatsApp <a href="${BRAND.whatsappUrl}" style="color:${BRAND.primary};text-decoration:underline;">${BRAND.whatsapp}</a></p>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin:16px 0 0;">© ${new Date().getFullYear()} ${BRAND.name} · <a href="${BRAND.siteUrl}" style="color:#9ca3af;text-decoration:underline;">ilinguerelax.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
