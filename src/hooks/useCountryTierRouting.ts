import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useRegionTier } from "@/hooks/useRegionTier";
import { detectCurrency, formatCurrencyAmount, exchangeRates, type Currency } from "@/i18n";
import { useLocalOverrides } from "@/lib/livePrices";

/**
 * Países que compran vía Hotmart LATAM (USD). El resto del mundo (incl. Perú y
 * VE/CU/NI) se envía a la tienda interna.
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
  /** Precio USD base a mostrar según el tier (Global, Latam o Tienda). */
  priceUsd: number;
  compareAtPriceUsd: number | null;
  /** Montos finales convertidos y formateados */
  priceLabel: string;
  originalLabel: string | null;
  currencyCode: string;
  isOnSale: boolean;
  discountPercentage: number;
  /** Propiedades heredadas del admin para componentes descendientes */
  hotmartUrl: string | null;
  priceGlobalUsd: number;
  priceLatamUsd: number;
  priceTiendaUsd: number;
  pricePen: number | null;
  compareAtPricePen: number | null;
  localUsdPrices: Record<string, number> | null;
  localCompareAtPrices: Record<string, number> | null;
}

interface Options {
  tiendaPath?: string;
  fallbackHotmartUrl?: string;
  fallbackPriceGlobalUsd?: number;
  fallbackPriceLatamUsd?: number;
  fallbackPriceTiendaUsd?: number;
  fallbackPricePen?: number;
}

/**
 * Lógica Única y Genérica para procesar precios globales.
 * Refactorización 100% dinámica basada en ISO sin condicionales por país.
 */
export function useCountryTierRouting(adminSku: string, opts: Options = {}): CountryTierRouting {
  const pricing = useAdminPricing(adminSku);
  const region = useRegionTier();
  const manualOverrides = useLocalOverrides(adminSku) as Partial<Record<Currency, number>> | null;
  
  const countryCode = (region.country || "US").toUpperCase();
  const currency = detectCurrency(countryCode);
  const rate = exchangeRates[currency] || 1;

  // 1. Determinar el Tier de Precios USD
  const useHotmartLatam = LATAM_HOTMART_COUNTRIES.has(countryCode);
  const isTiendaUsd = TIENDA_USD_COUNTRIES.has(countryCode);
  const useTiendaOnly = !useHotmartLatam;

  const basePriceGlobal = pricing.priceGlobalUsd ?? opts.fallbackPriceGlobalUsd ?? 0;
  const basePriceLatam = pricing.priceLatamUsd ?? opts.fallbackPriceLatamUsd ?? basePriceGlobal;
  const basePriceTienda = pricing.priceTiendaUsd ?? opts.fallbackPriceTiendaUsd ?? basePriceLatam;

  const baseCompareGlobal = pricing.compareAtPriceGlobalUsd ?? null;
  const baseCompareLatam = pricing.compareAtPriceLatamUsd ?? null ?? baseCompareGlobal;
  const baseCompareTienda = pricing.compareAtPriceTiendaUsd ?? null ?? baseCompareLatam;

  // Precio USD asignado según la región del usuario
  const priceUsd = isTiendaUsd ? basePriceTienda : useHotmartLatam ? basePriceLatam : basePriceGlobal;
  const compareAtPriceUsd = isTiendaUsd ? baseCompareTienda : useHotmartLatam ? baseCompareLatam : baseCompareGlobal;

  // 2. Calcular Precios Finales (Moneda Local)
  // Prioridad: Manual por Moneda (PEN, COP, etc) > (Manual USD Regional * Rate) > (Base Global * Rate)
  
  // Precio "Ahora"
  const manualFixed = manualOverrides?.[currency];
  const regionalUsdOverride = pricing.localUsdPrices?.[currency];
  
  const finalPriceAmount = typeof manualFixed === "number" && manualFixed > 0
    ? manualFixed
    : typeof regionalUsdOverride === "number" && regionalUsdOverride > 0
      ? regionalUsdOverride * rate
      : priceUsd * rate;

  // Precio "Antes" (Tachado)
  const manualCompareFixed = pricing.localCompareAtPrices?.[currency];
  
  const finalCompareAmount = typeof manualCompareFixed === "number" && manualCompareFixed > 0
    ? manualCompareFixed
    : compareAtPriceUsd && compareAtPriceUsd > 0
      ? compareAtPriceUsd * rate
      : null;

  // 3. Flags y Etiquetas
  const isOnSale = !!(finalCompareAmount && finalCompareAmount > finalPriceAmount);
  const discountPercentage = isOnSale 
    ? Math.round(((finalCompareAmount! - finalPriceAmount) / finalCompareAmount!) * 100) 
    : 0;

  const priceLabel = formatCurrencyAmount(finalPriceAmount, currency);
  const originalLabel = isOnSale ? formatCurrencyAmount(finalCompareAmount!, currency) : null;

  const hasFallback = (opts.fallbackPriceGlobalUsd ?? 0) > 0;
  const loaded = (pricing.loaded || hasFallback) && finalPriceAmount > 0;

  return {
    loaded,
    country: countryCode,
    isPeru: countryCode === "PE",
    isTiendaUsd,
    useHotmartLatam,
    useTiendaOnly,
    priceUsd,
    compareAtPriceUsd,
    priceLabel,
    originalLabel,
    currencyCode: currency,
    isOnSale,
    discountPercentage,
    hotmartUrl: pricing.hotmartUrl || opts.fallbackHotmartUrl || null,
    priceGlobalUsd: basePriceGlobal,
    priceLatamUsd: basePriceLatam,
    priceTiendaUsd: basePriceTienda,
    pricePen: pricing.pricePen,
    compareAtPricePen: pricing.compareAtPricePen,
    localUsdPrices: pricing.localUsdPrices,
    localCompareAtPrices: pricing.localCompareAtPrices,
  };
}
