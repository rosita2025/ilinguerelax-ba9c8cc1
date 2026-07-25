import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/clientId";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
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
const hasPixelConsent = (): boolean => {
  if (typeof window === "undefined") return false;
  if (!isEuUser()) return true; // non-EU: implicit consent
  try { return localStorage.getItem("ilr_cookie_consent") === "accepted"; } catch { return false; }
};

// Fire-and-forget Conversions API call (deduped via event_id with browser Pixel)
const sendCapiEvent = (eventName: string, eventId: string, params: Record<string, unknown>, email?: string) => {
  if (!CAPI_EVENTS.has(eventName)) return;
  if (typeof window === "undefined") return;
  // For EU users without consent, skip CAPI as well (no cookies/IP profiling).
  if (!hasPixelConsent()) return;
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
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", { ...params, eventID: eventId });
    }
    sendCapiEvent("ViewContent", eventId, params as unknown as Record<string, unknown>);
    logFunnelEvent("ViewContent", params as unknown as Record<string, unknown>);
    markViewContentFired(params as unknown as Record<string, unknown>);
  }, [params.content_name]);
};

export const trackHotmartEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  ensurePixelReady();
  const { __skipFunnelLog, ...pixelParams } = params;
  // Purchase: usar un event_id determinista basado en el número de orden para
  // que Meta pueda desduplicar con el evento enviado por el servidor (CAPI).
  const orderId = typeof pixelParams.order_id === "string" ? pixelParams.order_id : "";
  const eventId = eventName === "Purchase" && orderId
    ? `Purchase_${orderId}`
    : generateEventId();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, { ...pixelParams, eventID: eventId });
  }
  sendCapiEvent(eventName, eventId, pixelParams, typeof pixelParams.email === "string" ? pixelParams.email : undefined);
  if (!__skipFunnelLog) logFunnelEvent(eventName, pixelParams);
  if (eventName === "ViewContent") markViewContentFired(pixelParams);
};


export const useHotmartPixelPageView = () => {
  useEffect(() => {
    ensurePixelReady();
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = generateEventId();
      window.fbq("track", "PageView", { eventID: eventId });
    }
    logFunnelEvent("PageView", {});
  }, []);
};

export const useHotmartPixelContact = () => {
  useEffect(() => {
    ensurePixelReady();
    if (typeof window !== "undefined" && window.fbq) {
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
  if (typeof window !== "undefined" && window.fbq) {
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
    if (typeof window !== "undefined" && window.fbq) {
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
