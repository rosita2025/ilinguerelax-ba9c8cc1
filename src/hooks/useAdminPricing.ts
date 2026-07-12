import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminPricing {
  priceGlobalUsd: number;
  priceLatamUsd: number;
  pricePen: number | null;
  loaded: boolean;
}

/**
 * Fetches the latest pricing from digital_products (admin) by SKU.
 * Falls back to hardcoded values while the DB query resolves.
 * Use this on every product page to keep pricing in sync with the admin.
 */
export function useAdminPricing(
  sku: string,
  fallback: { global: number; latam?: number; pen?: number | null }
): AdminPricing {
  const [priceGlobalUsd, setGlobal] = useState<number>(fallback.global);
  const [priceLatamUsd, setLatam] = useState<number>(
    fallback.latam ?? fallback.global
  );
  const [pricePen, setPen] = useState<number | null>(fallback.pen ?? null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!sku) return;
    supabase
      .from("digital_products")
      .select("price_usd, price_usd_latam, price_pen")
      .eq("sku", sku)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          if (data.price_usd != null) setGlobal(Number(data.price_usd));
          if (data.price_usd_latam != null)
            setLatam(Number(data.price_usd_latam));
          else if (data.price_usd != null) setLatam(Number(data.price_usd));
          if (data.price_pen != null && Number(data.price_pen) > 0)
            setPen(Number(data.price_pen));
        }
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sku]);

  return { priceGlobalUsd, priceLatamUsd, pricePen, loaded };
}
