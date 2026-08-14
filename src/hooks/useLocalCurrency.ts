import { useRegionTier } from "./useRegionTier";
import { detectCurrency, formatPrice, exchangeRates, type Currency } from "@/i18n";
import { useLocalOverrides, useLivePrices } from "@/lib/livePrices";
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
  localUsdPrices?: LocalPriceOverrides
): { formatted: string; isUsd: boolean } {
  const currency = detectCurrency((country || "US").toUpperCase());
  const isUsd = currency === "USD";
  
  const regionalUsd = localUsdPrices && localUsdPrices[currency];
  const activeUsd = typeof regionalUsd === "number" && regionalUsd > 0 ? regionalUsd : usdAmount;
  
  return { formatted: formatPrice(activeUsd, currency, overrides ?? undefined), isUsd };
}

/** Convierte un monto USD a la moneda local aproximada del visitante (por IP). */
export function useLocalCurrency(usdAmount: number, overrides?: LocalPriceOverrides, localUsdPrices?: LocalPriceOverrides): LocalPrice {
  const { country, loading } = useRegionTier();
  const upper = (country || "").toUpperCase();
  const currency = detectCurrency(upper);
  const override = overrides && overrides[currency];
  const hasOverride = typeof override === "number" && override > 0;
  
  // New: Check for regional USD price override
  const regionalUsdOverride = localUsdPrices && localUsdPrices[currency];
  const activeUsdAmount = typeof regionalUsdOverride === "number" && regionalUsdOverride > 0
    ? regionalUsdOverride
    : usdAmount;

  const rate = exchangeRates[currency] ?? 1;
  const amount = hasOverride ? (override as number) : activeUsdAmount * rate;
  const isUsd = currency === "USD";
  const formatted = formatPrice(activeUsdAmount, currency, overrides ?? undefined);

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
  return useLocalCurrency(usdAmount, overrides, overrides.local_usd_prices);
}

/**
 * Returns a resolver `(idOrSku) => overrides` for use inside .map() loops
 * without breaking React hook rules. Backed by LivePricesProvider.
 */
export function useSkuOverridesResolver(): (idOrSku?: string | null) => { local_prices: LocalPriceOverrides; local_usd_prices: LocalPriceOverrides } {
  const { prices } = useLivePrices();
  return (idOrSku?: string | null) => {
    const sku = resolveAdminSku(idOrSku);
    if (!sku) return { local_prices: null, local_usd_prices: null };
    return {
      local_prices: (prices[sku]?.local_prices ?? null) as LocalPriceOverrides,
      local_usd_prices: (prices[sku]?.local_usd_prices ?? null) as LocalPriceOverrides,
    };
  };
}

/**
 * Format an already-computed LOCAL amount (not USD) in the visitor's currency.
 * Use when totals were summed per-item in local currency (e.g. mixing manual
 * overrides with USD*rate items), so the label reflects the exact sum.
 */
export function formatLocalDirect(localAmount: number, country: string): string {
  const currency = detectCurrency((country || "US").toUpperCase());
  return formatPrice(0, currency, { [currency]: localAmount } as any);
}

/**
 * Sum a list of items into the visitor's local currency, honoring per-sku
 * manual overrides (`digital_products.local_prices`). Falls back to the
 * automatic USD→local conversion for items without an override.
 */
export function sumItemsLocal(
  items: Array<{ id?: string; sku?: string; usd: number; quantity: number }>,
  country: string,
  resolver: (idOrSku?: string | null) => { local_prices: LocalPriceOverrides; local_usd_prices: LocalPriceOverrides }
): { amount: number; currency: Currency; isUsd: boolean; usdReference: number } {
  const currency = detectCurrency((country || "US").toUpperCase());
  const rate = exchangeRates[currency] ?? 1;
  let amount = 0;
  let usdReference = 0;
  for (const it of items) {
    const { local_prices, local_usd_prices } = resolver(it.sku ?? it.id);
    const override = local_prices && local_prices[currency];
    const regionalUsd = local_usd_prices && local_usd_prices[currency];
    
    const activeUsd = typeof regionalUsd === "number" && regionalUsd > 0 ? regionalUsd : it.usd;
    const perUnit = typeof override === "number" && override > 0 ? override : activeUsd * rate;
    
    amount += perUnit * (it.quantity || 1);
    usdReference += activeUsd * (it.quantity || 1);
  }
  return { amount, currency, isUsd: currency === "USD", usdReference };
}
