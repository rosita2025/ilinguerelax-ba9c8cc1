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
import { products } from "@/data/products";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";

export type LivePrice = {
  price_usd: number;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
  price_pen: number | null;
};

type Ctx = {
  version: number;
  prices: Record<string, LivePrice>;
  getLivePrice: (slugOrSku: string) => LivePrice | undefined;
};

const LivePricesContext = createContext<Ctx>({
  version: 0,
  prices: {},
  getLivePrice: () => undefined,
});

export const useLivePrices = () => useContext(LivePricesContext);
export const useLivePrice = (slugOrSku?: string | null) => {
  const { getLivePrice } = useLivePrices();
  return slugOrSku ? getLivePrice(slugOrSku) : undefined;
};

export function LivePricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const applyOverrides = (map: Record<string, LivePrice>) => {
      // Muta el array `products` en el sitio: los componentes que lo importan
      // por referencia leerán los valores frescos en el próximo render.
      for (const p of products) {
        // Match por slug (que suele coincidir con la columna `sku` en DB).
        const live = map[p.slug] ?? map[p.id];
        if (live && typeof live.price_usd === "number" && live.price_usd > 0) {
          p.price = live.price_usd;
        }
      }
    };

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("digital_products")
          .select("sku, price_usd, price_usd_latam, price_usd_tienda, price_pen, sku_aliases")
          .eq("active", true);
        if (error || !data) return;
        if (cancelled) return;

        const map: Record<string, LivePrice> = {};
        for (const row of data) {
          const entry: LivePrice = {
            price_usd: Number(row.price_usd) || 0,
            price_usd_latam: row.price_usd_latam != null ? Number(row.price_usd_latam) : null,
            price_usd_tienda: row.price_usd_tienda != null ? Number(row.price_usd_tienda) : null,
            price_pen: row.price_pen != null ? Number(row.price_pen) : null,
          };
          map[row.sku] = entry;
          for (const alias of row.sku_aliases ?? []) {
            if (alias) map[alias] = entry;
          }
        }
        applyOverrides(map);
        setPrices(map);
        setVersion((v) => v + 1);
      } catch (e) {
        console.warn("[livePrices] load failed", e);
      }
    };

    load();

    // Refresca cuando el admin guarda cambios en cualquier producto.
    const unsubscribe = subscribeCatalogUpdates({ onUpdate: load });

    // Realtime: escucha cualquier UPDATE/INSERT/DELETE en digital_products.
    const channel = supabase
      .channel("live_prices_all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "digital_products" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      version,
      prices,
      getLivePrice: (slugOrSku: string) => prices[slugOrSku],
    }),
    [version, prices],
  );

  return <LivePricesContext.Provider value={value}>{children}</LivePricesContext.Provider>;
}
