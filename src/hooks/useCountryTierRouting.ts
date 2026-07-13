import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useRegionTier } from "@/hooks/useRegionTier";

/**
 * Países que compran vía Hotmart LATAM (USD). El resto del mundo (incl. Perú y
 * VE/CU/NI) se envía a la tienda interna. Perú paga en soles, VE/CU/NI en USD
 * tienda ($7 por defecto), Global en USD Global ($15 por defecto).
 */
export const LATAM_HOTMART_COUNTRIES = new Set([
  "AR", "BO", "BR", "CL", "CO", "CR", "DO", "EC", "SV",
  "GT", "HN", "MX", "PA", "PY", "PR", "UY",
]);

export const TIENDA_USD_COUNTRIES = new Set(["VE", "CU", "NI"]);

export interface CountryTierRouting {
  loaded: boolean;
  country: string;
  isPeru: boolean;
  isTiendaUsd: boolean;
  useHotmartLatam: boolean;
  /** true cuando NO se usa Hotmart (Perú, VE/CU/NI, Global). */
  useTiendaOnly: boolean;
  /** Precio USD a mostrar/cobrar según el tier. */
  priceUsd: number;
  priceGlobalUsd: number;
  priceLatamUsd: number;
  priceTiendaUsd: number;
  pricePen: number | null;
  hotmartUrl: string | null;
  /** Label listo para renderizar en hero y sticky bar. */
  priceLabel: string;
  currencyCode: "PEN" | "USD";
  originalLabel: string;
}

interface Options {
  /** Ruta interna al checkout de este producto (informativa, opcional). */
  tiendaPath?: string;
  /** URL Hotmart de fallback si el admin no la tiene cargada. */
  fallbackHotmartUrl?: string;
  /** Multiplicador para el precio "antes" tachado (default 2.5x). */
  originalMultiplier?: number;
  fallbackPriceGlobalUsd?: number;
  fallbackPriceLatamUsd?: number;
  fallbackPriceTiendaUsd?: number;
  fallbackPricePen?: number;
}

export function useCountryTierRouting(adminSku: string, opts: Options = {}): CountryTierRouting {
  const pricing = useAdminPricing(adminSku);
  const region = useRegionTier();
  const country = (region.country || "").toUpperCase();
  const isPeru = country === "PE";
  const isTiendaUsd = TIENDA_USD_COUNTRIES.has(country);
  const useHotmartLatam = LATAM_HOTMART_COUNTRIES.has(country);
  const useTiendaOnly = !useHotmartLatam;

  const priceGlobalUsd = pricing.priceGlobalUsd ?? opts.fallbackPriceGlobalUsd ?? 0;
  const priceLatamUsd = pricing.priceLatamUsd ?? opts.fallbackPriceLatamUsd ?? priceGlobalUsd;
  const priceTiendaUsd = pricing.priceTiendaUsd ?? opts.fallbackPriceTiendaUsd ?? priceLatamUsd;
  const pricePen = pricing.pricePen ?? opts.fallbackPricePen ?? null;

  const priceUsd = isTiendaUsd
    ? priceTiendaUsd
    : useHotmartLatam
      ? priceLatamUsd
      : priceGlobalUsd;

  const mult = opts.originalMultiplier ?? 2.5;
  const priceLabel = isPeru && pricePen
    ? `S/ ${pricePen.toFixed(2)}`
    : `$${priceUsd.toFixed(2)} USD`;
  const originalLabel = isPeru && pricePen
    ? `S/ ${(pricePen * mult).toFixed(2)}`
    : `$${(priceGlobalUsd * mult).toFixed(2)} USD`;

  const hasFallback = (opts.fallbackPriceGlobalUsd ?? 0) > 0;
  const loaded = (pricing.loaded || hasFallback) && (isPeru ? (pricePen ?? 0) > 0 : priceUsd > 0);

  return {
    loaded,
    country,
    isPeru,
    isTiendaUsd,
    useHotmartLatam,
    useTiendaOnly,
    priceUsd,
    priceGlobalUsd,
    priceLatamUsd,
    priceTiendaUsd,
    pricePen,
    hotmartUrl: pricing.hotmartUrl || opts.fallbackHotmartUrl || null,
    priceLabel,
    currencyCode: isPeru ? "PEN" : "USD",
    originalLabel,
  };
}
