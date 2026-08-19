/**
 * Validación de números de seguimiento en el panel admin.
 * Debe mantenerse alineada con `supabase/functions/_shared/shippingEmails.ts`.
 */

const TRACKING_PARAMS = [
  "shipmentid", "trackingnumber", "tracking_number", "trknbr", "tracknum",
  "awb", "ptracking", "codigo", "code", "track", "tracking", "id", "n",
];

export const SHIPPING_CARRIERS = [
  "Amazon",
  "DHL",
  "FedEx",
  "UPS",
  "USPS",
  "Serpost",
  "Olva Courier",
  "Shalom",
  "Correos",
  "Otro",
] as const;

export interface TrackingNormalization {
  code: string | null;
  url: string | null;
  error?: string;
}

export function normalizeTracking(raw?: string | null): TrackingNormalization {
  const value = String(raw ?? "").trim();
  if (!value) return { code: null, url: null };

  const looksUrl =
    /^https?:\/\//i.test(value) || /^www\./i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}\//i.test(value);

  if (!looksUrl) {
    const code = value.replace(/\s+/g, "");
    if (code.replace(/[^a-z0-9]/gi, "").length < 6) {
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
      error: "Ese enlace no tiene código de rastreo (ej. www.amazon.com/tracking). Pega el número real de seguimiento.",
    };
  }
  return { code, url: href };
}
