import { useRegionTier } from "./useRegionTier";
import { detectCurrency, formatPrice, exchangeRates, type Currency } from "@/i18n";
import { useLocalOverrides } from "@/lib/livePrices";
import { CHECKOUT_CATALOG } from "@/config/checkoutCatalog";

/**
 * Moneda local aproximada del visitante (por IP). Delegamos el cálculo y el
 * formato a `@/i18n` (tabla `exchangeRates` + `formatPrice`) para que el sticky
 * bar del producto y el total del checkout muestren SIEMPRE el mismo valor.
 * La conversión REAL la hacen Stripe (adaptive_pricing) y Mercado Pago.
 *
 * `overrides` permite fijar el monto exacto por moneda desde el admin del
 * producto (columna `local_prices` en `digital_products`). Ejemplo:
 *   { COP: 33900, MXN: 199, ARS: 8500 }
 */

export type LocalPriceOverrides = Partial<Record<Currency, number>> | null | undefined;

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
  overrides?: LocalPriceOverrides,
): { formatted: string; isUsd: boolean } {
  const currency = detectCurrency((country || "US").toUpperCase());
  const isUsd = currency === "USD";
  return { formatted: formatPrice(usdAmount, currency, overrides ?? undefined), isUsd };
}

/** Convierte un monto USD a la moneda local aproximada del visitante (por IP). */
export function useLocalCurrency(usdAmount: number, overrides?: LocalPriceOverrides): LocalPrice {
  const { country, loading } = useRegionTier();
  const upper = (country || "").toUpperCase();
  const currency = detectCurrency(upper);
  const override = overrides && overrides[currency];
  const hasOverride = typeof override === "number" && override > 0;
  const rate = exchangeRates[currency] ?? 1;
  const amount = hasOverride ? (override as number) : usdAmount * rate;
  const isUsd = currency === "USD";
  const formatted = formatPrice(usdAmount, currency, overrides ?? undefined);

  return {
    country: upper,
    currency,
    symbol: currency === "USD" ? "$" : currency,
    amount,
    formatted,
    isUsd,
    loading,
  };
}
