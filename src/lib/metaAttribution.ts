// Atribución de Meta (Facebook/Instagram Ads).
// Solo el tráfico que llegó por un anuncio debe reportarse al Pixel / CAPI.
// Aquí guardamos los identificadores de clic (fbc/fbp) para poder enviarlos
// desde el servidor cuando la compra se confirma en un webhook.

import { supabase } from "@/integrations/supabase/client";

const META_ATTR_KEY = "ilr_meta_paid_until";
const FBCLID_KEY = "ilr_meta_fbc";
const WINDOW_MS = 28 * 24 * 60 * 60 * 1000;

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
};

/** Captura fbclid de la URL y lo guarda en formato fbc (fb.1.<ts>.<fbclid>). */
export const captureMetaClickId = (): void => {
  if (typeof window === "undefined") return;
  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (!fbclid) return;
    localStorage.setItem(FBCLID_KEY, `fb.1.${Date.now()}.${fbclid}`);
    localStorage.setItem(META_ATTR_KEY, String(Date.now() + WINDOW_MS));
  } catch { /* noop */ }
};

export interface MetaAttribution {
  attributed: boolean;
  fbc: string | null;
  fbp: string | null;
}

export const getMetaAttribution = (): MetaAttribution => {
  if (typeof window === "undefined") return { attributed: false, fbc: null, fbp: null };
  try {
    const fbc = readCookie("_fbc") || localStorage.getItem(FBCLID_KEY);
    const fbp = readCookie("_fbp");
    const until = Number(localStorage.getItem(META_ATTR_KEY) || "0");
    const attributed = !!fbc || (Number.isFinite(until) && until > Date.now());
    return { attributed, fbc, fbp };
  } catch {
    return { attributed: false, fbc: null, fbp: null };
  }
};

/**
 * Guarda la atribución asociada al correo del comprador para que los webhooks
 * (Stripe, PayPal, Mercado Pago, Hotmart) sepan si la venta vino de un anuncio.
 * Si no hay atribución de Meta, no guarda nada (orgánico, email, referidos).
 */
export const saveMetaAttribution = async (email: string, country?: string | null): Promise<void> => {
  const attr = getMetaAttribution();
  if (!attr.attributed) return;
  const clean = (email || "").trim().toLowerCase();
  if (!clean.includes("@")) return;
  try {
    await supabase.functions.invoke("save-meta-attribution", {
      body: { email: clean, fbc: attr.fbc, fbp: attr.fbp, country: country || null },
    });
  } catch { /* fire and forget */ }
};
