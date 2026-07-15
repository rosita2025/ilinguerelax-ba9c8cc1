import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";

/**
 * Fallback tracker: fires ViewContent on any /products/:slug (and /checkouts/:slug)
 * route that hasn't already fired it. Guarantees every product — legacy pages,
 * ProductDynamic, and any new SKU — logs a per-SKU ViewContent event to
 * funnel_events (visible in /admin/live).
 */
export const ProductViewTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = pathname.match(/^\/(?:products|checkouts)\/([^/?#]+)/);
    if (!match) return;
    const sku = decodeURIComponent(match[1]);

    // Wait for page-level pixel hooks to run first, then only fire if none did.
    const timer = window.setTimeout(() => {
      const w = window as unknown as { __vcFired?: Record<string, boolean> };
      const fired = w.__vcFired || {};
      if (fired[pathname] || fired[`sku:${sku}`]) return;
      trackHotmartEvent("ViewContent", {
        content_ids: [sku],
        content_type: "product",
        product_id: sku,
      });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
};

export default ProductViewTracker;
