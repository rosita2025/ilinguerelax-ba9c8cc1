import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRegionTier } from "./useRegionTier";
import { detectCurrency, formatPrice } from "@/i18n";

/**
 * Bulk-fetches admin pricing for all active digital products (once per session)
 * and returns a formatter that renders card prices according to the 3-tier model:
 *
 *   - Peru (country === "PE"): native `S/ X.XX PEN` from admin `price_pen`.
 *   - LATAM (non-PE): USD from admin `price_usd_latam` (Hotmart tier).
 *   - Global: local currency (EUR, MXN, CAD, GBP, …) converted from admin
 *     `price_usd` via `formatPrice`.
 *
 * If a SKU has no admin row, falls back to the provided `fallbackUsd` using the
 * same tier logic (converted for global, USD for LATAM, PEN conversion for PE).
 */
interface Row {
  sku: string;
  price_usd: number | null;
  price_usd_latam: number | null;
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
      .select("sku, price_usd, price_usd_latam, price_pen")
      .eq("active", true);
    const map: Record<string, Row> = {};
    for (const r of (data as Row[]) ?? []) map[r.sku] = r;
    cache = map;
    return map;
  })();
  return inflight;
}

export interface CardPriceFormatter {
  /** Formatted primary label (e.g. `$15.00`, `S/ 55.00`, `18,50 €`). */
  format: (sku: string | null | undefined, fallbackUsd: number) => string;
  /** Currency badge to display next to the price (e.g. `USD`, `PEN`, `EUR`). */
  currencyLabel: (sku: string | null | undefined) => string;
  ready: boolean;
}

export function useCardPrice(): CardPriceFormatter {
  const { tier, country, loading } = useRegionTier();
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

  const isPeru = country.toUpperCase() === "PE";
  const displayCurrency = isPeru ? "PEN" : detectCurrency(country || "US");

  const format = (sku: string | null | undefined, fallbackUsd: number): string => {
    const row = sku && rows ? rows[sku] : undefined;

    // Peru → native PEN when admin has it
    if (isPeru) {
      const pen = row?.price_pen && row.price_pen > 0 ? Number(row.price_pen) : null;
      if (pen) return `S/ ${pen.toFixed(2)}`;
      return formatPrice(fallbackUsd, "PEN");
    }

    // LATAM (non-PE) → local currency (MXN, ARS, CLP, COP, BRL…) converted from USD LATAM tier
    if (tier === "latam") {
      const usd = row?.price_usd_latam ?? row?.price_usd ?? fallbackUsd;
      return formatPrice(Number(usd), displayCurrency as any);
    }

    // Global → local currency converted from USD
    const usd = row?.price_usd ?? fallbackUsd;
    return formatPrice(Number(usd), displayCurrency as any);
  };

  const currencyLabel = (sku: string | null | undefined): string => {
    if (isPeru) return "PEN";
    return displayCurrency;
  };

  return {
    format,
    currencyLabel,
    ready: !loading && rows !== null,
  };
}
