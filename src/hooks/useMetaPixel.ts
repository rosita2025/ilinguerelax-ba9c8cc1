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

// Spanish Relax pixel
const SPANISH_PIXEL_ID = "1844523252813381";

// Generate unique event ID for deduplication
const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Initialize a specific pixel (without PageView to avoid duplication)
const initPixel = (pixelId: string) => {
  if (typeof window === "undefined" || !pixelId) return;
  
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
  }
};

// Hook specifically for Spanish Relax pixel - ViewContent event with deduplication
export const useSpanishRelaxPixel = (params: ViewContentParams) => {
  useEffect(() => {
    initPixel(SPANISH_PIXEL_ID);
    
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = generateEventId();
      window.fbq("track", "ViewContent", {
        ...params,
        eventID: eventId,
      });
    }
  }, [params.content_name]);
};

// Hook for PageView only (Home page) with deduplication
export const useSpanishRelaxPixelPageView = () => {
  useEffect(() => {
    initPixel(SPANISH_PIXEL_ID);
    
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = generateEventId();
      window.fbq("track", "PageView", {
        eventID: eventId,
      });
    }
  }, []);
};

// Hook for Contact page with deduplication
export const useSpanishRelaxPixelContact = () => {
  useEffect(() => {
    initPixel(SPANISH_PIXEL_ID);
    
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

// Export for use in other components (InitiateCheckout, Purchase, etc.)
export const trackSpanishRelaxEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  initPixel(SPANISH_PIXEL_ID);
  
  if (typeof window !== "undefined" && window.fbq) {
    const eventId = generateEventId();
    window.fbq("track", eventName, {
      ...params,
      eventID: eventId,
    });
  }
};

// Legacy exports for backwards compatibility
export const useMetaPixelViewContent = (params: ViewContentParams, pixelId?: string) => {
  useEffect(() => {
    const targetPixelId = pixelId || SPANISH_PIXEL_ID;
    
    if (targetPixelId) {
      initPixel(targetPixelId);
    }
    
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = generateEventId();
      window.fbq("track", "ViewContent", {
        ...params,
        eventID: eventId,
      });
    }
  }, [params.content_name, pixelId]);
};
