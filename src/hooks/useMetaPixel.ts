import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
const getSessionId = (): string => {
  if (typeof window === "undefined") return "ssr";
  try {
    let sid = localStorage.getItem(FUNNEL_SESSION_KEY);
    if (!sid) {
      sid = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(FUNNEL_SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
};

const FUNNEL_EVENTS = new Set(["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase", "Lead"]);
const CAPI_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout", "Lead", "Purchase"]);

// Fire-and-forget Conversions API call (deduped via event_id with browser Pixel)
const sendCapiEvent = (eventName: string, eventId: string, params: Record<string, unknown>, email?: string) => {
  if (!CAPI_EVENTS.has(eventName)) return;
  if (typeof window === "undefined") return;
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

const logFunnelEvent = (eventName: string, params: Record<string, unknown>) => {
  if (!FUNNEL_EVENTS.has(eventName)) return;
  if (typeof window === "undefined") return;
  try {
    const productId = Array.isArray(params.content_ids) && params.content_ids.length
      ? String((params.content_ids as unknown[])[0])
      : (params.content_name ? String(params.content_name) : null);
    void supabase.functions.invoke("log-funnel-event", {
      body: {
        event_name: eventName,
        product_id: productId,
        value: typeof params.value === "number" ? params.value : null,
        currency: typeof params.currency === "string" ? params.currency : null,
        session_id: getSessionId(),
        page_path: window.location.pathname,
        country: getCountry(),
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
      },
    });
  } catch (e) {
    console.error("funnel log error:", e);
  }
};

// Initialize pixel ONCE globally
let pixelInitialized = false;

const ensurePixelReady = () => {
  if (typeof window === "undefined") return;
  
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

export const useHotmartPixel = (params: ViewContentParams) => {
  useEffect(() => {
    ensurePixelReady();
    const eventId = generateEventId();
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", { ...params, eventID: eventId });
    }
    sendCapiEvent("ViewContent", eventId, params as unknown as Record<string, unknown>);
    logFunnelEvent("ViewContent", params as unknown as Record<string, unknown>);
  }, [params.content_name]);
};

export const trackHotmartEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  ensurePixelReady();
  const eventId = generateEventId();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, { ...params, eventID: eventId });
  }
  sendCapiEvent(eventName, eventId, params);
  logFunnelEvent(eventName, params);
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
  }, [params.content_name]);
};

export const useSpanishRelaxPixel = useHotmartPixel;
export const trackSpanishRelaxEvent = trackHotmartEvent;
export const useSpanishRelaxPixelPageView = useHotmartPixelPageView;
export const useSpanishRelaxPixelContact = useHotmartPixelContact;
