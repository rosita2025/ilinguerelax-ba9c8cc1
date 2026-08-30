import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";
import { useRegionTier } from "./useRegionTier";
import {
  detectCurrency,
  formatPrice,
  formatCurrencyAmount,
  exchangeRates,
  type Currency,
} from "@/i18n";
import { REGIONS } from "@/lib/countryRegions";
import { CHECKOUT_CATALOG } from "@/config/checkoutCatalog";

/**
 * Bulk-fetches admin pricing for all active digital products and returns a
 * formatter that renders card prices with EXACTLY the same rules as the product
 * page (`/products/:sku`) and the checkout:
 *
 *   - Peru (PE): native PEN from admin `price_pen`.
 *   - Tienda (VE/CU/NI): local currency from admin `price_usd_tienda`.
 *   - LATAM Hotmart: local currency from admin `price_usd_latam`.
 *   - Global (US/CA/EU/Asia/resto): local currency from admin `price_usd`.
 *
 * When the admin sets an exact amount for the visitor's currency in
 * `local_prices` (e.g. `{ MXN: 199 }`), that amount wins over the automatic
 * USD→local conversion — same behaviour as the product page.
 */
interface Row {
  sku: string;
  price_usd: number | null;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
  price_pen: number | null;
  local_prices: Record<string, number> | null;
  local_usd_prices: Record<string, number> | null;
  compare_at_price_usd: number | null;
  compare_at_price_usd_latam: number | null;
  compare_at_price_usd_tienda: number | null;
  compare_at_price_pen: number | null;
  local_compare_at_prices: Record<string, number> | null;
}

type Rows = Record<string, Row>;

// Some legacy cards still identify a product with a short static id rather
// than the canonical SKU used by /admin/products/:sku. Resolve those ids here
// so every card reads the same admin row as the product page.
const LEGACY_CARD_SKUS: Record<string, string> = {
  "5000": "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  "8000": "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
};

function resolveCardSku(value: string | null | undefined, rows: Rows | null): string | null {
  const candidate = String(value ?? "").trim();
  if (!candidate) return null;
  if (rows?.[candidate]) return candidate;

  const legacySku = LEGACY_CARD_SKUS[candidate];
  if (legacySku && rows?.[legacySku]) return legacySku;

  const directCatalogItem = CHECKOUT_CATALOG[candidate];
  if (directCatalogItem?.adminSku && rows?.[directCatalogItem.adminSku]) {
    return directCatalogItem.adminSku;
  }

  for (const item of Object.values(CHECKOUT_CATALOG)) {
    const productSlug = item.productPath?.split("/").filter(Boolean).pop();
    if (item.id === candidate || item.adminSku === candidate || productSlug === candidate) {
      const adminSku = item.adminSku ?? productSlug ?? item.id;
      if (rows?.[adminSku]) return adminSku;
    }
  }

  return candidate;
}

let cache: Rows | null = null;
let cacheFetchedAt = 0;
let inflight: Promise<Rows> | null = null;
// Ventana máxima que la caché de precios de las tarjetas puede quedarse
// "vieja" sin que nadie la refresque. Antes no había límite: si el admin
// cambiaba un precio desde OTRO dispositivo/navegador, y el usuario ya tenía
// el sitio abierto, la tarjeta podía seguir mostrando el precio anterior
// indefinidamente (hasta que la pestaña recuperara el foco o pasaran los 2
// minutos del poll) — mientras la ficha de producto y el sticky bar, que
// piden el precio de nuevo en cada carga, ya mostraban el correcto. Esto
// generaba precios distintos para el mismo producto en el mismo momento.
const CACHE_TTL_MS = 60_000;

async function fetchRows(): Promise<Rows> {
  let data: Row[] | null = null;
  try {
    const result = await supabase
      .from("digital_products")
      .select("sku, price_usd, price_usd_latam, price_usd_tienda, price_pen, local_prices, local_usd_prices, compare_at_price_usd, compare_at_price_usd_latam, compare_at_price_usd_tienda, compare_at_price_pen, local_compare_at_prices");
    // Sin filtro `active`: el homepage/listados también muestran productos que
    // el admin dejó inactivos, y la ficha de producto (/products/:sku) SÍ lee
    // sus precios. Al filtrarlos aquí, la tarjeta se quedaba sin fila y caía al
    // precio base del catálogo estático (ignorando el tier regional), mostrando
    // un precio distinto al de la página del producto.

    data = result.data as unknown as Row[] | null;
  } catch {
    data = [];
  }
  const map: Rows = {};
  for (const r of data ?? []) {
    const rawLocal = (r as any).local_prices;
    const local_prices =
      rawLocal && typeof rawLocal === "object" && !Array.isArray(rawLocal)
        ? (rawLocal as Record<string, number>)
        : null;
        
    const rawLocalUsd = (r as any).local_usd_prices;
    const local_usd_prices =
      rawLocalUsd && typeof rawLocalUsd === "object" && !Array.isArray(rawLocalUsd)
        ? (rawLocalUsd as Record<string, number>)
        : null;
        
    const rawCompare = (r as any).local_compare_at_prices;
    const local_compare_at_prices =
      rawCompare && typeof rawCompare === "object" && !Array.isArray(rawCompare)
        ? (rawCompare as Record<string, number>)
        : null;

    map[r.sku] = { ...r, local_prices, local_usd_prices, local_compare_at_prices };
  }
  cache = map;
  cacheFetchedAt = Date.now();
  return map;
}

/** Deduped load. `force` bypasses the cache when the admin publishes an edit. */
async function loadAll(force = false): Promise<Rows> {
  const isFresh = cache !== null && Date.now() - cacheFetchedAt < CACHE_TTL_MS;
  if (!force) {
    if (isFresh) return cache as Rows;
    if (inflight) return inflight;
  }
  inflight = fetchRows().finally(() => {
    inflight = null;
  });
  return inflight;
}

export type RegionLabel = "PE" | "TiendaUSD" | "LATAM" | "Global";

export interface CardPriceFormatter {
  /** Formatted primary label (e.g. `$15,00`, `S/ 55,00`, `18,50 €`). */
  format: (sku: string | null | undefined, fallbackUsd: number) => string;
  /**
   * Formats a "before" (crossed-out) price in the SAME currency as `format`,
   * so cards never mix a local amount with a raw USD figure.
   */
  formatOriginal: (sku: string | null | undefined, originalUsd: number, currentUsd?: number) => string;
  /** Currency badge (e.g. `USD`, `PEN`, `EUR`). */
  currencyLabel: (sku: string | null | undefined) => string;
  /** Region tier badge. */
  regionLabel: RegionLabel;
  ready: boolean;
}

export function useCardPrice(): CardPriceFormatter {
  const { country, loading } = useRegionTier();
  const [rows, setRows] = useState<Rows | null>(cache);

  useEffect(() => {
    let cancelled = false;
    const apply = (r: Rows) => {
      if (!cancelled) setRows(r);
    };
    // loadAll() decide internamente si la caché sigue vigente (ver
    // CACHE_TTL_MS) o si hay que pedir los precios de nuevo — así una
    // caché vieja-pero-presente ya no se queda pegada hasta el próximo
    // aviso/poll.
    loadAll().then(apply);
    // Refresh when the admin publishes a price change (broadcast, focus, poll)
    // so cards never keep a stale amount for the rest of the session.
    const unsubscribe = subscribeCatalogUpdates({
      onUpdate: () => loadAll(true).then(apply),
      pollMs: 120000,
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const cc = (country || "").toUpperCase();
  const isPeru = cc === "PE";
  // MISMA clasificación de 3 tiers que la ficha de producto
  // (useCountryTierRouting / ProductDynamic):
  //   LATAM (REGIONS.latam)          -> price_usd_latam
  //   Angloparlantes + Europa        -> price_usd
  //   Asia / África / resto del mundo -> price_usd_tienda
  // Antes las tarjetas usaban otra lista (solo VE/CU/NI iban al tier "tienda"),
  // así que un visitante de Asia veía en la tarjeta el precio GLOBAL mientras
  // la página de producto mostraba el precio TIENDA — precios distintos para
  // el mismo producto en el mismo momento.
  const isLatamTier = REGIONS.latam.codes.includes(cc);
  const isAngloEuTier =
    REGIONS.english_speaking.codes.includes(cc) || REGIONS.europe.codes.includes(cc);
  const isTiendaUsd = !isLatamTier && !isAngloEuTier;

  const displayCurrency: Currency = isPeru ? "PEN" : (detectCurrency(cc || "US") as Currency);

  const regionLabel: RegionLabel = isPeru
    ? "PE"
    : isTiendaUsd
      ? "TiendaUSD"
      : isLatamTier
        ? "LATAM"
        : "Global";

  /** USD price for the visitor's tier, from admin data when available. */
  const tierUsd = useCallback(
    (row: Row | undefined, fallbackUsd: number): number => {
      const regionalUsd = row?.local_usd_prices?.[displayCurrency];
      if (typeof regionalUsd === "number" && regionalUsd > 0) return regionalUsd;

      if (isTiendaUsd) {
        return Number(row?.price_usd_tienda ?? row?.price_usd ?? fallbackUsd);
      }
      if (isLatamTier) {
        return Number(row?.price_usd_latam ?? row?.price_usd ?? fallbackUsd);
      }
      return Number(row?.price_usd ?? fallbackUsd);
    },
    [isTiendaUsd, isLatamTier, displayCurrency],
  );

  const format = (sku: string | null | undefined, fallbackUsd: number): string => {
    // Never expose a provisional static/global price while either the country
    // or the admin prices are still loading; that was the visible price jump.
    if (loading || rows === null) return "—";
    const resolvedSku = resolveCardSku(sku, rows);
    const row = resolvedSku ? rows[resolvedSku] : undefined;

    // Perú → PEN nativo desde admin.
    if (isPeru) {
      // Prioridad: monto manual PEN del admin (local_prices) > columna legacy price_pen.
      const overridePen = row?.local_prices?.["PEN"];
      if (typeof overridePen === "number" && overridePen > 0) return formatCurrencyAmount(overridePen, "PEN");

      const pen = row?.price_pen && Number(row.price_pen) > 0 ? Number(row.price_pen) : null;
      if (pen) return formatCurrencyAmount(pen, "PEN");

      // Si no hay PEN manual, convertimos el USD regional al PEN actual
      const tierUsdValForPen = tierUsd(row, fallbackUsd);
      return formatPrice(tierUsdValForPen, "PEN", row?.local_prices, row?.local_usd_prices);
    }

    // Resto → USD del tier convertido, respetando el monto manual por moneda.
    const tierUsdVal = tierUsd(row, fallbackUsd);
    return formatPrice(tierUsdVal, displayCurrency, row?.local_prices, row?.local_usd_prices);
  };

  // El precio "antes" usa la MISMA regla que la ficha de producto y el sticky
  // bar (precio mostrado x 1.54, ~35% de descuento creíble) para que no haya
  // diferencias entre tarjeta y página. Solo si el producto aún no existe en
  // el admin se usa el precio tachado del catálogo estático.
  const ORIGINAL_MULTIPLIER = 1.54;

  const formatOriginal = (
    sku: string | null | undefined,
    originalUsd: number,
    currentUsd?: number,
  ): string => {
    if (loading || rows === null) return "—";
    const resolvedSku = resolveCardSku(sku, rows);
    const row = resolvedSku ? rows[resolvedSku] : undefined;
    const override = row?.local_prices?.[displayCurrency];
    // MISMA prioridad que la ficha de producto: precio "antes" manual del
    // admin (por moneda, o PEN, o USD por tier) antes del multiplicador
    // automático — así el tachado de la tarjeta y el de /products/:sku
    // coinciden exactamente.
    const manualCompareLocal = row?.local_compare_at_prices?.[isPeru ? "PEN" : displayCurrency];
    if (typeof manualCompareLocal === "number" && manualCompareLocal > 0) {
      return formatCurrencyAmount(manualCompareLocal, isPeru ? "PEN" : displayCurrency);
    }
    if (isPeru && row?.compare_at_price_pen && Number(row.compare_at_price_pen) > 0) {
      return formatCurrencyAmount(Number(row.compare_at_price_pen), "PEN");
    }
    const regionCompareUsd = isTiendaUsd
      ? row?.compare_at_price_usd_tienda
      : isLatamTier
        ? row?.compare_at_price_usd_latam
        : row?.compare_at_price_usd;
    if (regionCompareUsd && Number(regionCompareUsd) > 0) {
      const compareRate = isPeru ? (exchangeRates["PEN"] ?? 3.75) : (exchangeRates[displayCurrency] ?? 1);
      return formatCurrencyAmount(Number(regionCompareUsd) * compareRate, isPeru ? "PEN" : displayCurrency);
    }
    // Precio mostrado actual (mismo cálculo que `format`), para que el tachado
    // sea siempre 1.54x ese importe aunque el producto no tenga fila en admin.
    const fallbackCurrentUsd =
      typeof currentUsd === "number" && currentUsd > 0 ? currentUsd : originalUsd / ORIGINAL_MULTIPLIER;

    if (isPeru) {
      const overridePen = row?.local_prices?.["PEN"];
      if (typeof overridePen === "number" && overridePen > 0) return formatCurrencyAmount(overridePen * ORIGINAL_MULTIPLIER, "PEN");

      const pen = row?.price_pen && Number(row.price_pen) > 0 ? Number(row.price_pen) : null;
      if (pen) return formatCurrencyAmount(pen * ORIGINAL_MULTIPLIER, "PEN");

      const tierUsdValForPen = tierUsd(row, fallbackCurrentUsd);
      return formatCurrencyAmount(tierUsdValForPen * ORIGINAL_MULTIPLIER * (exchangeRates["PEN"] ?? 3.75), "PEN");
    }

    if (typeof override === "number" && override > 0) {
      return formatCurrencyAmount(override * ORIGINAL_MULTIPLIER, displayCurrency);
    }

    const rate = exchangeRates[displayCurrency] ?? 1;
    const current = tierUsd(row, fallbackCurrentUsd);
    if (current > 0) return formatCurrencyAmount(current * ORIGINAL_MULTIPLIER * rate, displayCurrency);
    return formatCurrencyAmount(originalUsd * rate, displayCurrency);
  };


  const currencyLabel = (_sku: string | null | undefined): string => displayCurrency;

  return {
    format,
    formatOriginal,
    currencyLabel,
    regionLabel,
    ready: !loading && rows !== null,
  };
}
