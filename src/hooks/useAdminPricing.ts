import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminPricing {
  /** USD price for Tier-1 / global regions. `null` until the DB responds. */
  priceGlobalUsd: number | null;
  /** USD price for LATAM regions. `null` until the DB responds. */
  priceLatamUsd: number | null;
  /** Native PEN price for Peru buyers. `null` when not configured. */
  pricePen: number | null;
  /** `true` once the query has resolved (successfully or not). */
  loaded: boolean;
  /** `true` if the SKU has no active row in `digital_products`. */
  missing: boolean;
}

/**
 * Single source of truth for product pricing.
 *
 * Reads `price_usd`, `price_usd_latam`, and `price_pen` from
 * `digital_products` (managed via `/admin/products/:sku`) for the given SKU.
 *
 * No hardcoded fallbacks: consumers must handle the `loaded === false` state
 * (skeleton, disabled buttons) and the `missing === true` state (SKU not
 * configured in admin).
 */
export function useAdminPricing(sku: string): AdminPricing {
  const [state, setState] = useState<AdminPricing>({
    priceGlobalUsd: null,
    priceLatamUsd: null,
    pricePen: null,
    loaded: false,
    missing: false,
  });

  useEffect(() => {
    if (!sku) {
      setState({ priceGlobalUsd: null, priceLatamUsd: null, pricePen: null, loaded: true, missing: true });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loaded: false, missing: false }));
    supabase
      .from("digital_products")
      .select("price_usd, price_usd_latam, price_pen")
      .eq("sku", sku)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data) {
          setState({ priceGlobalUsd: null, priceLatamUsd: null, pricePen: null, loaded: true, missing: true });
          return;
        }
        const global = data.price_usd != null ? Number(data.price_usd) : null;
        const latam = data.price_usd_latam != null ? Number(data.price_usd_latam) : global;
        const pen = data.price_pen != null && Number(data.price_pen) > 0 ? Number(data.price_pen) : null;
        setState({ priceGlobalUsd: global, priceLatamUsd: latam, pricePen: pen, loaded: true, missing: false });
      });
    return () => {
      cancelled = true;
    };
  }, [sku]);

  return state;
}
