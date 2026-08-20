import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/clientId";
import { convertToUSD, type Currency } from "@/i18n";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    ttq: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      load: (id: string) => void;
    };
  }
}

interface ViewContentParams {
  content_name: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}

const HOTMART_PIXEL_ID = "24959578143733255";
const TIKTOK_PIXEL_ID = "DA38RORC77UFIU51BH10";

// Generate unique event ID for deduplication
const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Persistent session id (per browser) for funnel attribution
const FUNNEL_SESSION_KEY = "ilr_funnel_sid";
const FUNNEL_SESSION_TOUCHED_KEY = "ilr_funnel_sid_touched";
const FUNNEL_REF_KEY = "ilr_funnel_ref";
const LAST_CHECKOUT_KEY = "ilr_last_checkout";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const getSessionId = (): string => {
  if (typeof window === "undefined") return "ssr";
  try {
    const now = Date.now();
    let sid = localStorage.getItem(FUNNEL_SESSION_KEY);
    const lastSeen = Number(localStorage.getItem(FUNNEL_SESSION_TOUCHED_KEY) || "0");
    if (!sid || !lastSeen || now - lastSeen > SESSION_TIMEOUT_MS) {
      sid = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(FUNNEL_SESSION_KEY, sid);
    }
    localStorage.setItem(FUNNEL_SESSION_TOUCHED_KEY, String(now));
    return sid;
  } catch {
    return "anon";
  }
};

const FUNNEL_EVENTS = new Set(["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "BeginCheckout", "Purchase", "PaymentError", "Lead"]);
const CAPI_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout", "Lead", "Purchase"]);

// EU consent gating: in EU countries we must wait for explicit "accepted" before firing browser Pixel.
const EU_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH"
]);
const isEuUser = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const c = (localStorage.getItem("ilr_country") || "").toUpperCase();
    return EU_COUNTRIES.has(c);
  } catch { return false; }
};
// ---------------------------------------------------------------------------
// Tráfico interno (admin / pruebas propias): NO debe llegar al Pixel ni a CAPI.
// Se marca de forma permanente en el navegador para que, aunque el admin luego
// navegue por la tienda como usuario normal, sus visitas no ensucien Meta.
// ---------------------------------------------------------------------------
const INTERNAL_KEY = "ilr_internal_traffic";

const isInternalTraffic = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("notrack") === "1") localStorage.setItem(INTERNAL_KEY, "1");
    if (params.get("notrack") === "0") localStorage.removeItem(INTERNAL_KEY);

    // Rutas de administración
    if (window.location.pathname.startsWith("/admin")) {
      localStorage.setItem(INTERNAL_KEY, "1");
      return true;
    }
    // Sesión de admin activa (llave guardada por AdminGate)
    if (localStorage.getItem("ilr_admin_key") || sessionStorage.getItem("ilr_admin_key")) {
      localStorage.setItem(INTERNAL_KEY, "1");
      return true;
    }
    // Entornos que no son producción real
    const host = window.location.hostname;
    if (host === "localhost" || host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com")) return true;

    return localStorage.getItem(INTERNAL_KEY) === "1";
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Solo tráfico pagado de Meta (Facebook / Instagram ads).
// Orgánico, email marketing, enlaces externos y directo NO envían al Pixel.
// La atribución se guarda 28 días (ventana estándar de Meta) para que el
// usuario que llegó por un anuncio siga siendo medido hasta la compra.
// ---------------------------------------------------------------------------
const AD_ATTR_KEY = "ilr_ad_paid_until";
const AD_WINDOW_MS = 28 * 24 * 60 * 60 * 1000;
const META_SOURCES = new Set(["facebook", "fb", "instagram", "ig", "meta", "facebook_ads", "instagram_ads", "meta_ads", "an", "audience_network", "messenger"]);
const TIKTOK_SOURCES = new Set(["tiktok", "tiktok_ads", "tt"]);

const isAdPaidTraffic = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const src = (params.get("utm_source") || "").toLowerCase().trim();
    const medium = (params.get("utm_medium") || "").toLowerCase().trim();

    const hasFbclid = !!params.get("fbclid");
    const hasTtclid = !!params.get("ttclid");
    const isMetaSource = META_SOURCES.has(src) || (src.includes("facebook") || src.includes("instagram") || src.includes("meta"));
    const isTiktokSource = TIKTOK_SOURCES.has(src) || src.includes("tiktok");
    const isPaidMedium = /cpc|ppc|paid|ads?$/.test(medium);

    // Cookie _fbc o _ttp: las crean los Pixel cuando hubo un clic en anuncio.
    const hasFbc = document.cookie.includes("_fbc=");
    const hasTtp = document.cookie.includes("_ttp=");

    if (hasFbclid || hasTtclid || hasFbc || hasTtp || ((isMetaSource || isTiktokSource) && (isPaidMedium || hasFbclid || hasTtclid || !medium))) {
      localStorage.setItem(AD_ATTR_KEY, String(Date.now() + AD_WINDOW_MS));
      return true;
    }

    const until = Number(localStorage.getItem(AD_ATTR_KEY) || "0");
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
};


const hasPixelConsent = (): boolean => {
  if (typeof window === "undefined") return false;
  // Tráfico interno (admin / pruebas / lovable) NUNCA envía eventos al Pixel.
  if (isInternalTraffic()) return false; 
  // Solo se reportan eventos si el usuario llegó por un anuncio de Meta o TikTok (Paid Traffic).
  // El tráfico orgánico, directo o de otras fuentes no se reporta para no ensuciar el ROAS.
  if (!isAdPaidTraffic()) return false; 
  
  if (!isEuUser()) return true; // non-EU: implicit consent
  try { return localStorage.getItem("ilr_cookie_consent") === "accepted"; } catch { return false; }
};




// Fire-and-forget Conversions API call (deduped via event_id with browser Pixel)
const sendCapiEvent = (eventName: string, eventId: string, params: Record<string, unknown>, email?: string) => {
  if (!CAPI_EVENTS.has(eventName) && eventName !== "ViewContent" && eventName !== "AddToCart" && eventName !== "InitiateCheckout") return;
  if (typeof window === "undefined") return;
  // For EU users without consent, skip CAPI as well (no cookies/IP profiling).
  if (!hasPixelConsent() || isInternalTraffic()) return;
  try {
    const { content_name, content_ids, content_type, value, currency, num_items } = params as Record<string, unknown>;
    void supabase.functions.invoke("meta-capi-event", {
      body: {
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        custom_data: { content_name, content_ids, content_type, value, currency, num_items },
        email: email || undefined,
      },
    });
  } catch (e) {
    console.error("CAPI invoke error:", e);
  }
};

const getCountry = (): string | null => {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("ilr_country"); } catch { return null; }
};

const getAttributionReferrer = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    if (utmSource) {
      const ref = `utm:${utmSource}:${params.get("utm_campaign") || ""}`;
      localStorage.setItem(FUNNEL_REF_KEY, ref);
      return ref;
    }
    const saved = localStorage.getItem(FUNNEL_REF_KEY);
    if (saved) return saved;
    const referrer = document.referrer || null;
    if (referrer) {
      const refHost = new URL(referrer).hostname.replace(/^www\./, "");
      const ownHost = window.location.hostname.replace(/^www\./, "");
      if (refHost !== ownHost && !refHost.includes("lovable")) {
        localStorage.setItem(FUNNEL_REF_KEY, referrer);
        return referrer;
      }
    }
  } catch { /* noop */ }
  return null;
};

const logFunnelEvent = (eventName: string, params: Record<string, unknown>) => {
  if (!FUNNEL_EVENTS.has(eventName)) return;
  if (typeof window === "undefined") return;
  try {
    const productId = Array.isArray(params.content_ids) && params.content_ids.length
      ? String((params.content_ids as unknown[])[0])
      : (params.content_name ? String(params.content_name) : null);
    if (eventName === "InitiateCheckout") {
      try {
        const checkoutMemory = {
          content_name: params.content_name || null,
          content_ids: Array.isArray(params.content_ids) ? params.content_ids : [],
          content_category: params.content_category || null,
          content_type: params.content_type || null,
          value: typeof params.value === "number" ? params.value : null,
          currency: typeof params.currency === "string" ? params.currency : null,
          page_path: window.location.pathname,
          session_id: getSessionId(),
          referrer: getAttributionReferrer(),
          country: getCountry(),
          created_at: new Date().toISOString(),
        };
        sessionStorage.setItem(LAST_CHECKOUT_KEY, JSON.stringify(checkoutMemory));
        localStorage.setItem(LAST_CHECKOUT_KEY, JSON.stringify(checkoutMemory));
      } catch { /* noop */ }
    }

    void supabase.functions.invoke("log-funnel-event", {
      body: {
        event_name: eventName,
        product_id: productId,
        value: typeof params.value === "number" ? params.value : null,
        currency: typeof params.currency === "string" ? params.currency : null,
        session_id: getSessionId(),
        client_id: getClientId(),
        page_path: window.location.pathname,
        country: getCountry(),
        referrer: getAttributionReferrer(),
        // Diagnóstico de pagos fallidos: método usado y mensaje de error.
        provider: typeof params.provider === "string" ? params.provider : null,
        reason: typeof params.reason === "string" ? params.reason : null,
      },

    });
  } catch (e) {
    console.error("funnel log error:", e);
  }
};

export const getLastCheckoutForPurchase = (): Record<string, unknown> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_CHECKOUT_KEY) || localStorage.getItem(LAST_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const createdAt = typeof parsed.created_at === "string" ? Date.parse(parsed.created_at) : 0;
    if (Number.isFinite(createdAt) && Date.now() - createdAt > 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
};

// Initialize pixel ONCE globally
let pixelInitialized = false;

const ensurePixelReady = () => {
  if (typeof window === "undefined") return;
  // EU consent gate: do not load fbevents.js until user accepts.
  if (!hasPixelConsent()) return;

  if (pixelInitialized) return;
  
  // If fbq already exists (script loaded), just ensure our pixel is init'd
  if (window.fbq) {
    pixelInitialized = true;
    return;
  }

  // Load fbevents.js and init pixel
  const script = document.createElement('script');
  script.id = 'fb-pixel-script';
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${HOTMART_PIXEL_ID}');
  `;
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${HOTMART_PIXEL_ID}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);

  pixelInitialized = true;
};

// ============================================
// HOTMART PIXEL
// ============================================

const markViewContentFired = (params: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __vcFired?: Record<string, boolean> };
  if (!w.__vcFired) w.__vcFired = {};
  const path = typeof window.location !== "undefined" ? window.location.pathname : "";
  if (path) w.__vcFired[path] = true;
  const ids = (params as { content_ids?: unknown }).content_ids;
  if (Array.isArray(ids)) for (const id of ids) if (typeof id === "string") w.__vcFired![`sku:${id}`] = true;
  const pid = (params as { product_id?: unknown }).product_id;
  if (typeof pid === "string") w.__vcFired[`sku:${pid}`] = true;
};

export const useHotmartPixel = (params: ViewContentParams) => {
  useEffect(() => {
    ensurePixelReady();
    const eventId = generateEventId();
    
    // Normalización forzada a USD para Ads (Facebook/Google/Pinterest)
    // Se asegura que el campo 'value' tenga exactamente 2 decimales para el Pixel.
    const normalizedParams = { ...params };
    if (normalizedParams.value && normalizedParams.currency && normalizedParams.currency !== "USD") {
      try {
        const usdVal = convertToUSD(
          Number(normalizedParams.value),
          normalizedParams.currency as Currency
        );
        normalizedParams.value = Number(usdVal.toFixed(2));
        normalizedParams.currency = "USD";
      } catch {}
    } else if (normalizedParams.value !== undefined) {
      // Forzado estricto a 2 decimales para evitar el error de precisión en el debugger
      normalizedParams.value = Number(Number(normalizedParams.value).toFixed(2));
    }

    if (typeof window !== "undefined" && hasPixelConsent()) {
      if (window.fbq) window.fbq("track", "ViewContent", { ...normalizedParams, eventID: eventId });
      if (window.ttq) window.ttq.track("ViewContent", { 
        content_id: normalizedParams.content_ids?.[0],
        content_type: "product",
        content_name: normalizedParams.content_name,
        value: normalizedParams.value,
        currency: "USD"
      });
    }
    sendCapiEvent("ViewContent", eventId, normalizedParams as unknown as Record<string, unknown>);
    logFunnelEvent("ViewContent", normalizedParams as unknown as Record<string, unknown>);
    markViewContentFired(normalizedParams as unknown as Record<string, unknown>);
  }, [params.content_name]);
};

export const trackHotmartEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  ensurePixelReady();
  const { __skipFunnelLog, email: userEmail, ...pixelParams } = params;

  // Normalización forzada a USD para Meta Pixel (Ads) según solicitud del usuario.
  // El Pixel debe recibir SIEMPRE el valor en USD para mantener consistencia en ROAS.
  // Note: conversion values are forced to 2 decimals for precision.
  if (pixelParams.value !== undefined && pixelParams.currency && pixelParams.currency !== "USD") {
    try {
      const usdVal = convertToUSD(
        Number(pixelParams.value),
        pixelParams.currency as Currency
      );
      pixelParams.value = Number(usdVal.toFixed(2));
      pixelParams.currency = "USD";
    } catch (e) {
      console.warn("[Pixel] Fallback USD conversion failed:", e);
    }
  } else if (pixelParams.value !== undefined) {
    // Forzado estricto a 2 decimales para evitar el error de precisión en el debugger
    pixelParams.value = Number(Number(pixelParams.value).toFixed(2));
  }

  // Purchase: usar un event_id determinista basado en el número de orden para
  // que Meta pueda desduplicar con el evento enviado por el servidor (CAPI).
  const orderId = typeof pixelParams.order_id === "string" ? pixelParams.order_id : "";
  const eventId = eventName === "Purchase" && orderId
    ? `Purchase_${orderId}`
    : generateEventId();
  if (typeof window !== "undefined" && hasPixelConsent()) {
    if (window.fbq) window.fbq("track", eventName, { ...pixelParams, eventID: eventId });
    if (window.ttq && (eventName === "AddToCart" || eventName === "InitiateCheckout" || eventName === "CompleteRegistration" || eventName === "Purchase")) {
      window.ttq.track(eventName, {
        content_id: pixelParams.content_ids?.[0] || pixelParams.product_id,
        content_type: "product",
        content_name: pixelParams.content_name,
        value: pixelParams.value,
        currency: "USD"
      });
    }

  }
  sendCapiEvent(eventName, eventId, pixelParams, typeof userEmail === "string" ? userEmail : undefined);
  if (!__skipFunnelLog) logFunnelEvent(eventName, pixelParams);
  if (eventName === "ViewContent") markViewContentFired(pixelParams);
};


export const useHotmartPixelPageView = () => {
  useEffect(() => {
    ensurePixelReady();
    if (typeof window !== "undefined" && window.fbq && hasPixelConsent()) {
      const eventId = generateEventId();
      window.fbq("track", "PageView", { eventID: eventId });
    }
    // No logging for internal traffic to avoid polluting funnel stats
    if (!isInternalTraffic()) {
      logFunnelEvent("PageView", {});
    }
  }, []);
};

export const useHotmartPixelContact = () => {
  useEffect(() => {
    ensurePixelReady();
    if (typeof window !== "undefined" && window.fbq && hasPixelConsent()) {
      const eventId = generateEventId();
      window.fbq("track", "ViewContent", {
        content_name: "Contact Page",
        content_category: "Page",
        eventID: eventId,
      });
    }
  }, []);
};

// Track Lead (newsletter / coupon email subscriptions). Fires browser Pixel + CAPI with hashed email.
export const trackLead = (
  email: string,
  params: Record<string, unknown> = {}
) => {
  ensurePixelReady();
  const eventId = generateEventId();
  if (typeof window !== "undefined" && window.fbq && hasPixelConsent()) {
    window.fbq("track", "Lead", { ...params, eventID: eventId });
  }
  sendCapiEvent("Lead", eventId, params, email);
  logFunnelEvent("Lead", params);
};

// Track BeginCheckout — GA4-style alias for the moment the user reaches the
// checkout page. Complements InitiateCheckout (Meta name) so /admin/debug
// muestra ambos y podemos armar el embudo completo por SKU.
export const trackBeginCheckout = (params: Record<string, unknown> = {}) => {
  logFunnelEvent("BeginCheckout", params);
};

// Track PaymentError — dispara cuando falla un intento de pago (Stripe, PayPal,
// Mercado Pago, Yape/Plin). Se enlaza al SKU vía content_ids para que
// /admin/debug muestre el error junto al resto del embudo.
export const trackPaymentError = (params: {
  sku?: string | null;
  skus?: string[];
  provider: string;
  reason?: string;
  value?: number | null;
  currency?: string | null;
  content_name?: string;
}) => {
  const ids = params.skus?.length ? params.skus : params.sku ? [params.sku] : [];
  logFunnelEvent("PaymentError", {
    content_name: params.content_name || params.provider,
    content_ids: ids,
    content_type: "product",
    provider: params.provider,
    reason: (params.reason || "").slice(0, 200),
    value: typeof params.value === "number" ? params.value : null,
    currency: params.currency || null,
  });
};

// ============================================
// LEGACY EXPORTS
// ============================================
export const useMetaPixelViewContent = (params: ViewContentParams, _pixelId?: string) => {
  useEffect(() => {
    ensurePixelReady();
    if (typeof window !== "undefined" && window.fbq && hasPixelConsent()) {
      const eventId = generateEventId();
      window.fbq("track", "ViewContent", { ...params, eventID: eventId });
    }
    logFunnelEvent("ViewContent", params as unknown as Record<string, unknown>);
    markViewContentFired(params as unknown as Record<string, unknown>);
  }, [params.content_name]);
};


export const useSpanishRelaxPixel = useHotmartPixel;
export const trackSpanishRelaxEvent = trackHotmartEvent;
export const useSpanishRelaxPixelPageView = useHotmartPixelPageView;
export const useSpanishRelaxPixelContact = useHotmartPixelContact;
