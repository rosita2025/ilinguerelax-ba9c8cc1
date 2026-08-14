import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";

export interface AdminPricing {
  /** USD price for Tier-1 / global regions. `null` until the DB responds. */
  priceGlobalUsd: number | null;
  /** USD price for LATAM regions. `null` until the DB responds. */
  priceLatamUsd: number | null;
  /** USD price for the internal store tier (VE/CU/NI). `null` when not configured. */
  priceTiendaUsd: number | null;
  /** Native PEN price for Peru buyers. `null` when not configured. */
  pricePen: number | null;
  /** Product display name from admin. `null` until loaded. */
  name: string | null;
  /** Product description from admin. `null` until loaded. */
  description: string | null;
  /** Hotmart checkout URL from admin. `null` if not configured. */
  hotmartUrl: string | null;
  /** Whether the internal store checkout is enabled. */
  storeEnabled: boolean;
  /** Cover image URL from admin. `null` until loaded. */
  coverImageUrl: string | null;
  /** Whether the product is active (published). */
  active: boolean;
  /** `true` once the query has resolved (successfully or not). */
  loaded: boolean;
  /** `true` if the SKU has no active row in `digital_products`. */
  missing: boolean;
  /** Average rating (0-5) from admin. Defaults to 4.8. */
  rating: number | null;
  /** Number of reviews from admin. Defaults to 120. */
  reviewCount: number | null;
  /** Regional USD overrides for specific currencies. */
  localUsdPrices: Record<string, number> | null;
}

const INITIAL: AdminPricing = {
  priceGlobalUsd: null,
  priceLatamUsd: null,
  priceTiendaUsd: null,
  pricePen: null,
  name: null,
  description: null,
  hotmartUrl: null,
  storeEnabled: true,
  coverImageUrl: null,
  active: true,
  loaded: false,
  missing: false,
  rating: null,
  reviewCount: null,
};

/**
 * Single source of truth for product data.
 *
 * Reads pricing, title, description, hotmart URL and store toggle from
 * `digital_products` (managed via `/admin/products/:sku`) for the given SKU.
 */
export function useAdminPricing(sku: string): AdminPricing {
  const [state, setState] = useState<AdminPricing>(INITIAL);

  useEffect(() => {
    if (!sku) {
      setState({ ...INITIAL, loaded: true, missing: true });
      return;
    }
    let cancelled = false;

    const fetchOne = async () => {
      setState((s) => ({ ...s, loaded: s.loaded, missing: false }));
      let data: {
        price_usd: number | null;
        price_usd_latam: number | null;
        price_usd_tienda: number | null;
        price_pen: number | null;
        name: string | null;
        description: string | null;
        hotmart_url: string | null;
        store_enabled: boolean | null;
        cover_image_url: string | null;
        active: boolean | null;
        rating: number | null;
        review_count: number | null;
      } | null = null;
      try {
        const result = await supabase
          .from("digital_products")
          .select("price_usd, price_usd_latam, price_usd_tienda, price_pen, name, description, hotmart_url, store_enabled, cover_image_url, active, rating, review_count")
          .eq("sku", sku)
          .maybeSingle();
        data = result.data as typeof data;
      } catch {
        data = null;
      }
      if (cancelled) return;
      if (!data) {
        setState({ ...INITIAL, loaded: true, missing: true });
        return;
      }
      const global = data.price_usd != null ? Number(data.price_usd) : null;
      const latam = data.price_usd_latam != null ? Number(data.price_usd_latam) : global;
      const tienda = (data as any).price_usd_tienda != null && Number((data as any).price_usd_tienda) > 0
        ? Number((data as any).price_usd_tienda)
        : latam;
      const pen = data.price_pen != null && Number(data.price_pen) > 0 ? Number(data.price_pen) : null;
      setState({
        priceGlobalUsd: global,
        priceLatamUsd: latam,
        priceTiendaUsd: tienda,
        pricePen: pen,
        name: (data as any).name ?? null,
        description: (data as any).description ?? null,
        hotmartUrl: (data as any).hotmart_url ?? null,
        storeEnabled: (data as any).store_enabled !== false,
        coverImageUrl: (data as any).cover_image_url ?? null,
        active: (data as any).active !== false,
        rating: (data as any).rating != null ? Number((data as any).rating) : null,
        reviewCount: (data as any).review_count != null ? Number((data as any).review_count) : null,
        loaded: true,
        missing: false,
      });
    };

    fetchOne();

    // Refetch when the admin publishes an edit (cross-tab broadcast, focus, bfcache, poll).
    // Realtime fue desactivado por seguridad: la fila completa incluía los enlaces.
    const unsubscribeLocal = subscribeCatalogUpdates({ sku, onUpdate: fetchOne, pollMs: 60000 });

    return () => {
      cancelled = true;
      unsubscribeLocal();
    };
  }, [sku]);

  return state;
}
