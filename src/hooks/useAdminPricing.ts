import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";

export interface AdminPricing {
  /** USD price for LATAM regions. `null` until the DB responds. */
  priceLatamUsd: number | null;
  /** USD price for Anglosphere / USA / Europe regions. `null` until the DB responds. */
  priceGlobalUsd: number | null;
  /** USD price for Rest of World (Asia / Africa / etc) tier. `null` when not configured. */
  priceTiendaUsd: number | null;
  /** Native PEN price for Peru buyers. DEPRECATED - use local_prices['PEN'] */
  pricePen: number | null;

  // Compare at prices (strikethrough) - DEPRECATED for manual regional control
  compareAtPriceGlobalUsd: number | null;
  compareAtPriceLatamUsd: number | null;
  compareAtPriceTiendaUsd: number | null;
  compareAtPricePen: number | null;

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
  /** Regional comparison prices overrides for specific currencies. */
  localCompareAtPrices: Record<string, number> | null;
  /** Gallery images from admin. */
  galleryImages: string[] | null;
  /** Gallery metadata from admin. */
  galleryMetadata: Record<string, any> | null;
}

const INITIAL: AdminPricing = {
  priceGlobalUsd: null,
  priceLatamUsd: null,
  priceTiendaUsd: null,
  pricePen: null,
  compareAtPriceGlobalUsd: null,
  compareAtPriceLatamUsd: null,
  compareAtPriceTiendaUsd: null,
  compareAtPricePen: null,
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
  localUsdPrices: null,
  localCompareAtPrices: null,
  galleryImages: null,
  galleryMetadata: null,
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
        local_prices: Record<string, number> | null;
        compare_at_price_usd: number | null;
        compare_at_price_usd_latam: number | null;
        compare_at_price_usd_tienda: number | null;
        compare_at_price_pen: number | null;
        name: string | null;
        description: string | null;
        hotmart_url: string | null;
        store_enabled: boolean | null;
        cover_image_url: string | null;
        active: boolean | null;
        rating: number | null;
        review_count: number | null;
        local_usd_prices: Record<string, number> | null;
        local_compare_at_prices: Record<string, number> | null;
        gallery_images: string[] | null;
        gallery_metadata: Record<string, any> | null;
      } | null = null;
      try {
        const result = await supabase
          .from("digital_products")
          .select("price_usd, price_usd_latam, price_usd_tienda, local_prices, compare_at_price_usd, compare_at_price_usd_latam, compare_at_price_usd_tienda, compare_at_price_pen, name, description, hotmart_url, store_enabled, cover_image_url, active, rating, review_count, local_usd_prices, local_compare_at_prices, gallery_images, gallery_metadata")

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
      const manualPen = data.local_prices?.PEN;
      const pen = manualPen != null && Number(manualPen) > 0 ? Number(manualPen) : null;

      const compareGlobal = data.compare_at_price_usd != null ? Number(data.compare_at_price_usd) : null;
      const compareLatam = data.compare_at_price_usd_latam != null ? Number(data.compare_at_price_usd_latam) : compareGlobal;
      const compareTienda = data.compare_at_price_usd_tienda != null ? Number(data.compare_at_price_usd_tienda) : compareLatam;
      const comparePen = data.compare_at_price_pen != null ? Number(data.compare_at_price_pen) : null;

      setState({
        priceGlobalUsd: global,
        priceLatamUsd: latam,
        priceTiendaUsd: tienda,
        pricePen: pen,
        compareAtPriceGlobalUsd: compareGlobal,
        compareAtPriceLatamUsd: compareLatam,
        compareAtPriceTiendaUsd: compareTienda,
        compareAtPricePen: comparePen,
        name: (data as any).name ?? null,
        description: (data as any).description ?? null,
        hotmartUrl: (data as any).hotmart_url ?? null,
        storeEnabled: (data as any).store_enabled !== false,
        coverImageUrl: (data as any).cover_image_url ?? null,
        active: (data as any).active !== false,
        rating: (data as any).rating != null ? Number((data as any).rating) : null,
        reviewCount: (data as any).review_count != null ? Number((data as any).review_count) : null,
        localUsdPrices: (data as any).local_usd_prices ?? null,
        localCompareAtPrices: (data as any).local_compare_at_prices ?? null,
        galleryImages: (data as any).gallery_images ?? null,
        galleryMetadata: (data as any).gallery_metadata ?? null,
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
