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

// ============================================
// PIXEL ID - ÚNICO PIXEL PARA TODOS LOS PRODUCTOS
// ============================================
const HOTMART_PIXEL_ID = "24959578143733255";

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate unique event ID for deduplication
const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Track which pixels have been initialized
const initializedPixels = new Set<string>();

// Initialize a specific pixel (without PageView to avoid duplication)
const initPixel = (pixelId: string) => {
  if (typeof window === "undefined" || !pixelId) return;
  
  // Prevent double initialization
  if (initializedPixels.has(pixelId)) return;
  
  // Check if pixel script already exists
  if (!document.getElementById(`fb-pixel-${pixelId}`)) {
    const script = document.createElement('script');
    script.id = `fb-pixel-${pixelId}`;
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
    `;
    document.head.appendChild(script);
    
    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.id = `fb-pixel-noscript-${pixelId}`;
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
    document.body.appendChild(noscript);
    
    initializedPixels.add(pixelId);
  }
};

// ============================================
// HOTMART PIXEL (Único pixel para todos los productos)
// ============================================

// Hook for ViewContent event
export const useHotmartPixel = (params: ViewContentParams) => {
  useEffect(() => {
    initPixel(HOTMART_PIXEL_ID);
    
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = generateEventId();
      window.fbq("track", "ViewContent", {
        ...params,
        eventID: eventId,
      });
    }
  }, [params.content_name]);
};

// Track any event for Hotmart pixel
export const trackHotmartEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  initPixel(HOTMART_PIXEL_ID);
  
  if (typeof window !== "undefined" && window.fbq) {
    const eventId = generateEventId();
    window.fbq("track", eventName, {
      ...params,
      eventID: eventId,
    });
  }
};

// Hook for PageView only (Home page)
export const useHotmartPixelPageView = () => {
  useEffect(() => {
    initPixel(HOTMART_PIXEL_ID);
    
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = generateEventId();
      window.fbq("track", "PageView", {
        eventID: eventId,
      });
    }
  }, []);
};

// Hook for Contact page
export const useHotmartPixelContact = () => {
  useEffect(() => {
    initPixel(HOTMART_PIXEL_ID);
    
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
// LEGACY EXPORTS (for backwards compatibility)
// ============================================
export const useMetaPixelViewContent = (params: ViewContentParams, _pixelId?: string) => {
  useEffect(() => {
    initPixel(HOTMART_PIXEL_ID);
    
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = generateEventId();
      window.fbq("track", "ViewContent", {
        ...params,
        eventID: eventId,
      });
    }
  }, [params.content_name]);
};

// Legacy aliases that now use the single Hotmart pixel
export const useSpanishRelaxPixel = useHotmartPixel;
export const trackSpanishRelaxEvent = trackHotmartEvent;
export const useSpanishRelaxPixelPageView = useHotmartPixelPageView;
export const useSpanishRelaxPixelContact = useHotmartPixelContact;
