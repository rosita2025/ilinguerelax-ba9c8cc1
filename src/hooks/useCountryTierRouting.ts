import { useEffect, useState } from "react";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useRegionTier } from "@/hooks/useRegionTier";
import { detectCurrency, formatCurrencyAmount, exchangeRates, type Currency } from "@/i18n";
import { useLocalOverrides } from "@/lib/livePrices";
import { REGIONS } from "@/lib/countryRegions";

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
  /** Monto numérico final en moneda local para procesamiento de pagos. */
  finalPriceAmount: number;
  /** Tasa de cambio utilizada para este país. */
  exchangeRate: number;
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
  const [refreshTick, setRefreshTick] = useState(0);

  // Escuchar actualizaciones globales para refrescar precios sin F5
  useEffect(() => {
    const handleUpdate = () => setRefreshTick(v => v + 1);
    window.addEventListener('pricing_updated', handleUpdate);
    return () => window.removeEventListener('pricing_updated', handleUpdate);
  }, []);

  
  const countryCode = (region.country || "US").toUpperCase();
  const currency = detectCurrency(countryCode);
  const rate = exchangeRates[currency] || 1;

  // 1. Determinar el Tier de Región
  const isLatam = REGIONS.latam.codes.includes(countryCode);
  const isAnglosphereOrEurope = REGIONS.english_speaking.codes.includes(countryCode) || REGIONS.europe.codes.includes(countryCode);
  const isAsiaOrRest = !isLatam && !isAnglosphereOrEurope;
  const isTiendaUsd = TIENDA_USD_COUNTRIES.has(countryCode);

  // Mapeo según la solicitud:
  // LATAM -> price_usd_latam ($45)
  // Angloparlantes / USA / Europa -> price_usd ($72.99)
  // Resto del Mundo / Asia / África -> price_usd_tienda ($68)
  const basePriceGlobal = pricing.priceGlobalUsd ?? opts.fallbackPriceGlobalUsd ?? 0;
  const basePriceLatam = pricing.priceLatamUsd ?? opts.fallbackPriceLatamUsd ?? basePriceGlobal;
  const basePriceRestOfWorld = pricing.priceTiendaUsd ?? opts.fallbackPriceTiendaUsd ?? basePriceGlobal;

  // Precio USD asignado según la región del usuario
  const regionUsdPrice = isLatam ? basePriceLatam : isAnglosphereOrEurope ? basePriceGlobal : basePriceRestOfWorld;

  // 2. Calcular Precios Finales (Moneda Local)
  // Prioridad: Manual por Moneda (local_prices) > (Base USD de Región * Rate)
  
  // Precio "Ahora"
  const manualFixed = manualOverrides?.[currency];
  const finalPriceAmount = typeof manualFixed === "number" && manualFixed > 0
    ? manualFixed
    : regionUsdPrice * rate;

  // Precio "Antes" (Tachado)
  // Prioridad:
  // 1) local_compare_at_prices[moneda] (manual por moneda en el admin)
  // 2) compare_at_price_pen (solo Perú)
  // 3) compare_at_price_usd_* del tier de la región * tasa
  // 4) Fallback automático: precio actual * ORIGINAL_MULTIPLIER
  const ORIGINAL_MULTIPLIER = 2.5;
  const manualCompareFixed = pricing.localCompareAtPrices?.[currency];
  const globalCompareUsd = pricing.compareAtPriceGlobalUsd;
  const regionCompareUsd = isLatam
    ? pricing.compareAtPriceLatamUsd
    : isAnglosphereOrEurope
      ? pricing.compareAtPriceGlobalUsd
      : pricing.compareAtPriceTiendaUsd;

  let finalCompareAmount: number | null = null;
  if (typeof manualCompareFixed === "number" && manualCompareFixed > 0) {
    finalCompareAmount = manualCompareFixed;
  } else if (currency === "PEN" && pricing.compareAtPricePen && pricing.compareAtPricePen > 0) {
    finalCompareAmount = pricing.compareAtPricePen;
  } else if (regionCompareUsd && regionCompareUsd > 0) {
    finalCompareAmount = regionCompareUsd * rate;
  } else if (finalPriceAmount > 0) {
    finalCompareAmount = finalPriceAmount * ORIGINAL_MULTIPLIER;
  }

  // Nunca mostrar un tachado menor o igual al precio actual
  if (finalCompareAmount !== null && finalCompareAmount <= finalPriceAmount) {
    finalCompareAmount = finalPriceAmount * ORIGINAL_MULTIPLIER;
  }


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
    useHotmartLatam: LATAM_HOTMART_COUNTRIES.has(countryCode),
    useTiendaOnly: !LATAM_HOTMART_COUNTRIES.has(countryCode),
    priceUsd: regionUsdPrice,
    compareAtPriceUsd: globalCompareUsd,
    priceLabel,
    originalLabel,
    currencyCode: currency,
    isOnSale,
    discountPercentage,
    finalPriceAmount,
    exchangeRate: rate,
    hotmartUrl: pricing.hotmartUrl || opts.fallbackHotmartUrl || null,
    priceGlobalUsd: basePriceGlobal,
    priceLatamUsd: basePriceLatam,
    priceTiendaUsd: basePriceRestOfWorld,
    pricePen: pricing.pricePen,
    compareAtPricePen: pricing.compareAtPricePen,
    localUsdPrices: pricing.localUsdPrices,
    localCompareAtPrices: pricing.localCompareAtPrices,
  };
}
