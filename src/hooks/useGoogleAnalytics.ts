/**
 * Google Analytics 4 (GA4) tracking helper.
 * GA4 tag is loaded in index.html (G-0RJ3QZNYKJ).
 * All events also push to dataLayer for GTM (GTM-T3MZNK99).
 */
import { useEffect, useRef } from "react";
import { convertToUSD, type Currency } from "@/i18n";

type GAParams = Record<string, unknown>;

export function trackGAEvent(eventName: string, params: GAParams = {}) {
  // Normalización forzada a USD para Google Ads/Analytics
  if (params.value && params.currency && params.currency !== "USD") {
    try {
      params.value = convertToUSD(
        Number(params.value),
        params.currency as Currency
      );
      params.currency = "USD";
    } catch {}
  }
  try {
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", eventName, params);
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: eventName, ...params });
    }
  } catch (e) {
    console.warn("[GA] event failed:", eventName, e);
  }
}

/**
 * Fires a `product_view` event once per mount.
 * Use on product detail pages.
 */
export function useTrackProductView(params: {
  productId: string;
  productName: string;
  price?: number;
  currency?: string;
  category?: string;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackGAEvent("product_view", {
      item_id: params.productId,
      item_name: params.productName,
      item_category: params.category || "Product",
      currency: params.currency || "USD",
      value: params.price ?? 0,
    });
    // GA4 standard ecommerce event
    trackGAEvent("view_item", {
      currency: params.currency || "USD",
      value: params.price ?? 0,
      items: [
        {
          item_id: params.productId,
          item_name: params.productName,
          item_category: params.category || "Product",
          price: params.price ?? 0,
          quantity: 1,
        },
      ],
    });
  }, [params.productId, params.productName, params.price, params.currency, params.category]);
}

/**
 * Fires `scroll_depth` events at time-based intervals (15s, 30s, 60s, 120s)
 * AND at scroll percentage milestones (25%, 50%, 75%, 100%).
 * Auto-cleans on unmount.
 */
export function useScrollTimeTracking(pageName: string) {
  useEffect(() => {
    const startTime = Date.now();
    const timeMilestones = [15, 30, 60, 120]; // seconds
    const firedTimes = new Set<number>();
    const scrollMilestones = [25, 50, 75, 100]; // percent
    const firedScrolls = new Set<number>();

    // Time-based tracking
    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timeMilestones.forEach((m) => {
        if (elapsed >= m && !firedTimes.has(m)) {
          firedTimes.add(m);
          trackGAEvent("scroll_time", {
            page_name: pageName,
            time_on_page_seconds: m,
          });
        }
      });
      if (firedTimes.size === timeMilestones.length) clearInterval(timeInterval);
    }, 5000);

    // Scroll % tracking
    const onScroll = () => {
      const scrolled = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.min(100, Math.round((scrolled / docHeight) * 100));
      scrollMilestones.forEach((m) => {
        if (pct >= m && !firedScrolls.has(m)) {
          firedScrolls.add(m);
          trackGAEvent("scroll_depth", {
            page_name: pageName,
            percent_scrolled: m,
          });
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pageName]);
}