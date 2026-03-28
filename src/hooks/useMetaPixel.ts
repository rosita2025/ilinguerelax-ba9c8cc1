import { useEffect } from "react";

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
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = generateEventId();
      window.fbq("track", "ViewContent", { ...params, eventID: eventId });
    }
  }, [params.content_name]);
};

export const trackHotmartEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  ensurePixelReady();
  if (typeof window !== "undefined" && window.fbq) {
    const eventId = generateEventId();
    window.fbq("track", eventName, { ...params, eventID: eventId });
  }
};

export const useHotmartPixelPageView = () => {
  useEffect(() => {
    ensurePixelReady();
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = generateEventId();
      window.fbq("track", "PageView", { eventID: eventId });
    }
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
