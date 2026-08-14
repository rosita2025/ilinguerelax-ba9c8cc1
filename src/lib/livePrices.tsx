/**
 * LivePricesProvider — hidrata precios en vivo desde `digital_products`
 * y los inyecta sobre el array estático `products` (data/products.ts).
 *
 * Cómo funciona:
 * - Al montarse, hace un fetch a la tabla `digital_products` y construye
 *   un mapa por SKU (que coincide con el slug de los productos estáticos).
 * - Muta en el sitio `products[i].price` cuando hay match por slug.
 * - Se resuscribe vía Realtime + BroadcastChannel (`subscribeCatalogUpdates`)
 *   y refetchea al ganar visibilidad la pestaña.
 * - Expone un contexto con la versión y un `getLivePrice(slug)` para páginas
 *   que quieran mostrar el precio USD base directamente desde la DB.
 *
 * Objetivo: al guardar un precio en /admin/productos/:sku, TODAS las cards,
 * cross-sells y páginas estáticas se refrescan automáticamente sin redeploy.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { products, type Product, type LangCode } from "@/data/products";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";

export type LivePrice = {
  price_usd: number;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
  price_pen: number | null;
  local_prices: Record<string, number> | null;
  local_usd_prices: Record<string, number> | null;
};

type Ctx = {
  version: number;
  prices: Record<string, LivePrice>;
  getLivePrice: (slugOrSku: string) => LivePrice | undefined;
  getLocalOverrides: (slugOrSku?: string | null) => { local_prices: Record<string, number> | null; local_usd_prices: Record<string, number> | null };
};

const LivePricesContext = createContext<Ctx>({
  version: 0,
  prices: {},
  getLivePrice: () => undefined,
  getLocalOverrides: () => ({ local_prices: null, local_usd_prices: null }),
});

export const useLivePrices = () => useContext(LivePricesContext);
export const useLivePrice = (slugOrSku?: string | null) => {
  const { getLivePrice } = useLivePrices();
  return slugOrSku ? getLivePrice(slugOrSku) : undefined;
};
/** Manual per-currency overrides for a sku/slug (set from admin/products/:sku). */
export const useLocalOverrides = (slugOrSku?: string | null) => {
  const { getLocalOverrides } = useLivePrices();
  return getLocalOverrides(slugOrSku);
};

// Fallback flag/country for auto-injected products (based on target language).
const LANG_META: Record<string, { flag: string; country: string }> = {
  en: { flag: "🇬🇧", country: "Inglés" },
  es: { flag: "🇪🇸", country: "Español" },
  fr: { flag: "🇫🇷", country: "Francés" },
  pt: { flag: "🇧🇷", country: "Portugués" },
  ko: { flag: "🇰🇷", country: "Coreano" },
  de: { flag: "🇩🇪", country: "Alemán" },
  it: { flag: "🇮🇹", country: "Italiano" },
  ja: { flag: "🇯🇵", country: "Japonés" },
  nl: { flag: "🇳🇱", country: "Neerlandés" },
  zh: { flag: "🇨🇳", country: "Chino" },
};

export function LivePricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const applyOverrides = (map: Record<string, LivePrice>, rows: any[]) => {
      // 1) Muta precio de productos existentes (match por slug o id).
      for (const p of products) {
        const live = map[p.slug] ?? map[p.id];
        if (live && typeof live.price_usd === "number" && live.price_usd > 0) {
          p.price = live.price_usd;
        }
      }
      // 2) Inserta productos nuevos creados desde /admin/productos/:sku
      //    que aún no existen en el catálogo estático, para que aparezcan
      //    en /products, cross-sells, blog cards, etc.
      const knownSlugs = new Set(products.map((p) => p.slug));
      const knownIds = new Set(products.map((p) => p.id));
      for (const row of rows) {
        if (row.is_upsell) continue; // upsells no van al catálogo público
        if (row.is_physical) continue; // los físicos viven en el catálogo estático
        const slug: string = row.sku;
        if (!slug || knownSlugs.has(slug) || knownIds.has(slug)) continue;
        const target = (row.target_language || "en") as LangCode;
        const learner = (row.learner_language || "es") as LangCode;
        const meta = LANG_META[target] ?? LANG_META.en;
        const priceUsd = Number(row.price_usd) || 0;
        const injected: Product = {
          id: slug,
          slug,
          name: row.name || slug,
          flag: meta.flag,
          country: meta.country,
          image: row.cover_image_url || "/images/product-generic.webp",
          title: row.name || slug,
          subtitle: row.description?.slice(0, 100) || "",
          description: row.description || "",
          rating: 5,
          reviews: 0,
          price: priceUsd,
          originalPrice: null,
          discount: null,
          badge: "🆕 Nuevo",
          features: [],
          isPhysical: false,
          learnerLanguage: learner,
          targetLanguage: target,
        };
        products.push(injected);
        knownSlugs.add(slug);
      }
    };

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("digital_products")
          .select("sku, name, description, target_language, learner_language, cover_image_url, is_upsell, is_physical, price_usd, price_usd_latam, price_usd_tienda, price_pen, sku_aliases, local_prices, local_usd_prices")
          .eq("active", true);
        if (error || !data) return;
        if (cancelled) return;

        const map: Record<string, LivePrice> = {};
        for (const row of data) {
          const rawLocal = (row as any).local_prices;
          const local_prices: Record<string, number> | null =
            rawLocal && typeof rawLocal === "object" && !Array.isArray(rawLocal)
              ? Object.fromEntries(
                  Object.entries(rawLocal)
                    .map(([k, v]) => [String(k).toUpperCase(), Number(v)])
                    .filter(([, v]) => Number.isFinite(v as number) && (v as number) > 0),
                ) as Record<string, number>
              : null;

          const rawLocalUsd = (row as any).local_usd_prices;
          const local_usd_prices: Record<string, number> | null =
            rawLocalUsd && typeof rawLocalUsd === "object" && !Array.isArray(rawLocalUsd)
              ? Object.fromEntries(
                  Object.entries(rawLocalUsd)
                    .map(([k, v]) => [String(k).toUpperCase(), Number(v)])
                    .filter(([, v]) => Number.isFinite(v as number) && (v as number) > 0),
                ) as Record<string, number>
              : null;

          const entry: LivePrice = {
            price_usd: Number(row.price_usd) || 0,
            price_usd_latam: row.price_usd_latam != null ? Number(row.price_usd_latam) : null,
            price_usd_tienda: row.price_usd_tienda != null ? Number(row.price_usd_tienda) : null,
            price_pen: row.price_pen != null ? Number(row.price_pen) : null,
            local_prices: local_prices && Object.keys(local_prices).length ? local_prices : null,
            local_usd_prices: local_usd_prices && Object.keys(local_usd_prices).length ? local_usd_prices : null,
          };
          map[row.sku] = entry;
          for (const alias of row.sku_aliases ?? []) {
            if (alias) map[alias] = entry;
          }
        }
        applyOverrides(map, data as any[]);
        setPrices(map);
        setVersion((v) => v + 1);
      } catch (e) {
        console.warn("[livePrices] load failed", e);
      }
    };

    load();

    // Realtime sobre `digital_products` fue desactivado por seguridad (enviaba
    // la fila completa, con los enlaces de descarga, a cualquier visitante).
    // La frescura se mantiene con broadcast entre pestañas + sondeo ligero.
    const unsubscribe = subscribeCatalogUpdates({ onUpdate: load, pollMs: 60000 });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      version,
      prices,
      getLivePrice: (slugOrSku: string) => prices[slugOrSku],
      getLocalOverrides: (slugOrSku?: string | null) => {
        if (!slugOrSku) return { local_prices: null, local_usd_prices: null };
        return {
          local_prices: prices[slugOrSku]?.local_prices ?? null,
          local_usd_prices: prices[slugOrSku]?.local_usd_prices ?? null,
        };
      },
    }),
    [version, prices],
  );

  return <LivePricesContext.Provider value={value}>{children}</LivePricesContext.Provider>;
}

