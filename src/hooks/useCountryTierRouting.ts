import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useRegionTier } from "@/hooks/useRegionTier";
import { detectCurrency, formatPrice, formatCurrencyAmount, exchangeRates, type Currency } from "@/i18n";
import { useLocalOverrides } from "@/lib/livePrices";

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
  currencyCode: string;
  originalLabel: string;
  /** Regional USD overrides for specific currencies. */
  localUsdPrices: Record<string, number> | null;
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
  // Montos exactos por moneda fijados en /admin/productos/:sku. Se aplican aquí
  // para que cualquier página que use este hook muestre el MISMO importe que
  // la ficha de producto y el checkout.
  const overrides = useLocalOverrides(adminSku) as Partial<Record<Currency, number>> | null;
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
  const displayCurrency = isPeru ? "PEN" : detectCurrency(country || "US");
  const priceLabel = isPeru && pricePen
    ? formatCurrencyAmount(pricePen, "PEN")
    : formatPrice(priceUsd, displayCurrency, overrides ?? undefined);
  const originalLabel = isPeru && pricePen
    ? formatCurrencyAmount(pricePen * mult, "PEN")
    : formatCurrencyAmount(
        (overrides?.[displayCurrency] ?? 0) > 0
          ? (overrides![displayCurrency] as number) * mult
          : priceUsd * mult * (exchangeRates[displayCurrency] ?? 1),
        displayCurrency,
      );

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
    currencyCode: displayCurrency,
    originalLabel,
    localUsdPrices: pricing.localUsdPrices,
  };
}
