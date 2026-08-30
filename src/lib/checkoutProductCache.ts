import { supabase } from "@/integrations/supabase/client";
import type { CatalogItem } from "@/config/checkoutCatalog";

export type CheckoutProductPayload = {
  item: CatalogItem | null;
  upsells: CatalogItem["upsells"] | null;
  /** true when the SKU has no active row in the admin catalog */
  missing: boolean;
};

const TTL_MS = 15 * 60 * 1000; // 15 min: fresh enough for pricing, fast for ads traffic

const cacheKey = (adminSku: string) => `ilr_prod_cache_${adminSku}`;

/** Instant (sync) read used to paint the checkout without a skeleton. */
export function readCheckoutCache(adminSku: string): CheckoutProductPayload | null {
  try {
    const raw =
      localStorage.getItem(cacheKey(adminSku)) ?? sessionStorage.getItem(cacheKey(adminSku));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.ts && Date.now() - parsed.ts > TTL_MS) return null;
    if (!parsed?.item) return null;
    return { item: parsed.item as CatalogItem, upsells: parsed.upsells ?? null, missing: false };
  } catch {
    return null;
  }
}

function writeCheckoutCache(adminSku: string, payload: CheckoutProductPayload) {
  if (!payload.item) return;
  const body = JSON.stringify({ item: payload.item, upsells: payload.upsells, ts: Date.now() });
  try {
    localStorage.setItem(cacheKey(adminSku), body);
  } catch {
    /* quota */
  }
  try {
    sessionStorage.setItem(cacheKey(adminSku), body);
  } catch {
    /* quota */
  }
}

/**
 * Loads a checkout product (+ its upsells) from the admin catalog.
 * Shared by the checkout page and by the product-page prefetch so ad traffic
 * lands on an already-warm cache instead of waiting on the network.
 */
export async function loadCheckoutProduct(adminSku: string): Promise<CheckoutProductPayload> {
  const cb = Date.now();

  const [{ data, error }, { data: upRows }] = await Promise.all([
    (async () => {
      try {
        return await supabase
          .from("digital_products")
          .select(
            "sku, name, description, price_usd, price_usd_latam, price_usd_tienda, price_pen, cover_image_url, updated_at, is_physical, local_prices, local_usd_prices",
          )
          .eq("sku", adminSku)
          .eq("active", true)
          .maybeSingle();
      } catch {
        return { data: null, error: new Error("catalog offline") } as const;
      }
    })(),
    (async () => {
      try {
        return await supabase
          .from("product_upsells")
          .select("upsell_sku, discount_pct, sort_order")
          .eq("product_sku", adminSku)
          .order("sort_order", { ascending: true });
      } catch {
        return { data: [] as Array<{ upsell_sku: string; discount_pct: number; sort_order: number }> };
      }
    })(),
  ]);

  let upsells: CatalogItem["upsells"] | null = [];
  if (upRows && upRows.length) {
    const skus = upRows.map((u) => u.upsell_sku);
    let upProducts: Array<{
      sku: string;
      name: string;
      description: string | null;
      price_usd: number;
      local_prices: Record<string, number> | null;
      cover_image_url: string | null;
    }> = [];
    try {
      const result = await supabase
        .from("digital_products")
        .select("sku, name, description, price_usd, local_prices, cover_image_url")
        .in("sku", skus)
        .eq("active", true);
      upProducts = (result.data ?? []) as typeof upProducts;
    } catch {
      upProducts = [];
    }
    const bySku = new Map(upProducts.map((p) => [p.sku, p]));
    upsells = upRows
      .map((u) => {
        const p = bySku.get(u.upsell_sku);
        if (!p) return null;
        const original = Number(p.price_usd);
        const discountPct = Number(u.discount_pct) || 0;
        const price = Math.round(original * (1 - discountPct / 100) * 100) / 100;
        const rawPen = p.price_pen != null ? Number(p.price_pen) : null;
        const pricePen =
          rawPen != null && rawPen > 0
            ? Math.round(rawPen * (1 - discountPct / 100) * 100) / 100
            : undefined;
        const bust = `?v=${cb}`;
        return {
          id: p.sku,
          name: p.name,
          price,
          pricePen,
          originalPrice: u.discount_pct ? original : undefined,
          image: (p.cover_image_url || "/placeholder.svg") + (p.cover_image_url ? bust : ""),
          description: p.description || undefined,
          badge: u.discount_pct ? `-${u.discount_pct}%` : undefined,
        };
      })
      .filter(Boolean) as CatalogItem["upsells"];
  }

  if (error || !data) {
    return { item: null, upsells, missing: true };
  }

  const imgBust = data.cover_image_url ? `?v=${cb}` : "";
  const priceGlobal = Number(data.price_usd);
  const priceLatam = data.price_usd_latam != null ? Number(data.price_usd_latam) : null;
  const rowWithTienda = data as typeof data & { price_usd_tienda?: number | string | null };
  const priceTienda =
    rowWithTienda.price_usd_tienda != null && Number(rowWithTienda.price_usd_tienda) > 0
      ? Number(rowWithTienda.price_usd_tienda)
      : null;
  const pricePen = data.price_pen != null && Number(data.price_pen) > 0 ? Number(data.price_pen) : undefined;

  const item = {
    id: data.sku,
    name: data.name,
    price: priceGlobal,
    image: (data.cover_image_url || "/placeholder.svg") + imgBust,
    description: data.description || undefined,
    productPath: `/products/${data.sku}`,
    adminSku: data.sku,
    upsells: upsells ?? undefined,
    isPhysical: Boolean(data.is_physical),
    ...(pricePen != null && { pricePen }),
    regionPrices: {
      latam: priceLatam ?? priceGlobal,
      global: priceGlobal,
      tienda: priceTienda ?? priceLatam ?? priceGlobal,
    },
    localPrices: data.local_prices,
    localUsdPrices: data.local_usd_prices,
  } as CatalogItem;

  const payload: CheckoutProductPayload = { item, upsells, missing: false };
  writeCheckoutCache(adminSku, payload);
  return payload;
}

/** Fire-and-forget warm-up called from product pages while the user reads. */
export function prefetchCheckoutProduct(adminSku?: string | null) {
  if (!adminSku) return;
  if (readCheckoutCache(adminSku)) return;
  loadCheckoutProduct(adminSku).catch(() => {});
}
