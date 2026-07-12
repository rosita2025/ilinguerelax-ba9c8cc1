import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRegionTier } from "./useRegionTier";
import { detectCurrency, formatPrice } from "@/i18n";
import { LATAM_HOTMART_COUNTRIES, TIENDA_USD_COUNTRIES } from "./useCountryTierRouting";

/**
 * Bulk-fetches admin pricing for all active digital products (once per session)
 * and returns a formatter that renders card prices according to the 4-tier model:
 *
 *   - Peru (PE): native `S/ X.XX PEN` from admin `price_pen`.
 *   - Tienda USD (VE/CU/NI): USD from admin `price_usd_tienda` ($7 por defecto).
 *   - LATAM Hotmart: USD from admin `price_usd_latam` ($10).
 *   - Global (US/CA/EU/Asia/HT/resto): local currency from admin `price_usd` ($15).
 */
interface Row {
  sku: string;
  price_usd: number | null;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
  price_pen: number | null;
}

let cache: Record<string, Row> | null = null;
let inflight: Promise<Record<string, Row>> | null = null;

async function loadAll(): Promise<Record<string, Row>> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("digital_products")
      .select("sku, price_usd, price_usd_latam, price_usd_tienda, price_pen")
      .eq("active", true);
    const map: Record<string, Row> = {};
    for (const r of (data as Row[]) ?? []) map[r.sku] = r;
    cache = map;
    return map;
  })();
  return inflight;
}

export type RegionLabel = "PE" | "TiendaUSD" | "LATAM" | "Global";

export interface CardPriceFormatter {
  /** Formatted primary label (e.g. `$15.00`, `S/ 55.00`, `18,50 €`, `$7.00`). */
  format: (sku: string | null | undefined, fallbackUsd: number) => string;
  /** Currency badge (e.g. `USD`, `PEN`, `EUR`). */
  currencyLabel: (sku: string | null | undefined) => string;
  /** Region tier badge. */
  regionLabel: RegionLabel;
  ready: boolean;
}

export function useCardPrice(): CardPriceFormatter {
  const { country, loading } = useRegionTier();
  const [rows, setRows] = useState<Record<string, Row> | null>(cache);

  useEffect(() => {
    if (rows) return;
    let cancelled = false;
    loadAll().then((r) => {
      if (!cancelled) setRows(r);
    });
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const cc = (country || "").toUpperCase();
  const isPeru = cc === "PE";
  const isTiendaUsd = TIENDA_USD_COUNTRIES.has(cc);
  const isLatamHotmart = LATAM_HOTMART_COUNTRIES.has(cc);
  const isGlobal = !isPeru && !isTiendaUsd && !isLatamHotmart;

  const displayCurrency = isPeru
    ? "PEN"
    : isTiendaUsd
      ? "USD"
      : detectCurrency(cc || "US");

  const regionLabel: RegionLabel = isPeru
    ? "PE"
    : isTiendaUsd
      ? "TiendaUSD"
      : isLatamHotmart
        ? "LATAM"
        : "Global";

  const format = (sku: string | null | undefined, fallbackUsd: number): string => {
    const row = sku && rows ? rows[sku] : undefined;

    // Perú → PEN nativo desde admin
    if (isPeru) {
      const pen = row?.price_pen && row.price_pen > 0 ? Number(row.price_pen) : null;
      if (pen) return `S/ ${pen.toFixed(2)}`;
      return formatPrice(fallbackUsd, "PEN");
    }

    // VE / CU / NI → USD Tienda ($7 por defecto), sin conversión a moneda local
    if (isTiendaUsd) {
      const usd = row?.price_usd_tienda ?? row?.price_usd_latam ?? row?.price_usd ?? fallbackUsd;
      return `$${Number(usd).toFixed(2)}`;
    }

    // LATAM Hotmart → moneda local convertida desde USD LATAM
    if (isLatamHotmart) {
      const usd = row?.price_usd_latam ?? row?.price_usd ?? fallbackUsd;
      return formatPrice(Number(usd), displayCurrency as any);
    }

    // Global → moneda local convertida desde USD Global
    const usd = row?.price_usd ?? fallbackUsd;
    return formatPrice(Number(usd), displayCurrency as any);
  };

  const currencyLabel = (_sku: string | null | undefined): string => {
    if (isPeru) return "PEN";
    if (isTiendaUsd) return "USD";
    return displayCurrency;
  };

  return {
    format,
    currencyLabel,
    regionLabel,
    ready: !loading && rows !== null,
  };
}
