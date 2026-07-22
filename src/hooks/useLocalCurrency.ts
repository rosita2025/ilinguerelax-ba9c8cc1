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

/** Resolve a checkout item id (or product slug) to the digital_products admin sku. */
export function resolveAdminSku(idOrSku?: string | null): string | null {
  if (!idOrSku) return null;
  const cat = CHECKOUT_CATALOG[idOrSku as keyof typeof CHECKOUT_CATALOG];
  if (cat?.adminSku) return cat.adminSku;
  for (const c of Object.values(CHECKOUT_CATALOG)) {
    if (c.id === idOrSku) return c.adminSku ?? c.id;
  }
  return idOrSku;
}

/**
 * Same as `useLocalCurrency` but pulls the manual per-currency overrides for
 * the given sku/slug from LivePricesProvider (set at /admin/products/:sku).
 */
export function useLocalCurrencyForSku(usdAmount: number, skuOrId?: string | null): LocalPrice {
  const overrides = useLocalOverrides(resolveAdminSku(skuOrId)) as LocalPriceOverrides;
  return useLocalCurrency(usdAmount, overrides);
}
