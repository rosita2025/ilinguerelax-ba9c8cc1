import { useRegionTier } from "./useRegionTier";
import { detectCurrency, formatPrice, exchangeRates, type Currency } from "@/i18n";

/**
 * Moneda local aproximada del visitante (por IP). Delegamos el cálculo y el
 * formato a `@/i18n` (tabla `exchangeRates` + `formatPrice`) para que el sticky
 * bar del producto y el total del checkout muestren SIEMPRE el mismo valor.
 * La conversión REAL la hacen Stripe (adaptive_pricing) y Mercado Pago.
 */

export interface LocalPrice {
  country: string;
  currency: Currency;
  symbol: string;
  amount: number;
  formatted: string;
  isUsd: boolean;
  loading: boolean;
}

/** Formatea un monto USD a la moneda local del país (no-hook, útil dentro de .map()). */
export function formatLocalAmount(
  usdAmount: number,
  country: string,
): { formatted: string; isUsd: boolean } {
  const currency = detectCurrency((country || "US").toUpperCase());
  const isUsd = currency === "USD";
  return { formatted: formatPrice(usdAmount, currency), isUsd };
}

/** Convierte un monto USD a la moneda local aproximada del visitante (por IP). */
export function useLocalCurrency(usdAmount: number): LocalPrice {
  const { country, loading } = useRegionTier();
  const upper = (country || "").toUpperCase();
  const currency = detectCurrency(upper);
  const rate = exchangeRates[currency] ?? 1;
  const amount = usdAmount * rate;
  const isUsd = currency === "USD";
  const formatted = formatPrice(usdAmount, currency);

  return {
    country: upper,
    currency,
    // Símbolo referencial (el formateo real ya viene en `formatted`).
    symbol: currency === "USD" ? "$" : currency,
    amount,
    formatted,
    isUsd,
    loading,
  };
}
