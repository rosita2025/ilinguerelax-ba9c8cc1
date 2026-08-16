import { useRegionTier } from "./useRegionTier";
import { detectCurrency, formatPrice, exchangeRates } from "@/i18n";
import { useLivePrices } from "@/lib/livePrices";
import { CHECKOUT_CATALOG } from "@/config/checkoutCatalog";
/** Formatea un monto USD a la moneda local del país (no-hook, útil dentro de .map()). */
export function formatLocalAmount(usdAmount, country, overrides, localUsdPrices) {
    const currency = detectCurrency((country || "US").toUpperCase());
    const isUsd = currency === "USD";
    const regionalUsd = localUsdPrices && localUsdPrices[currency];
    const activeUsd = typeof regionalUsd === "number" && regionalUsd > 0 ? regionalUsd : usdAmount;
    return { formatted: formatPrice(activeUsd, currency, overrides ?? undefined), isUsd };
}
/** Convierte un monto USD a la moneda local aproximada del visitante (por IP). */
export function useLocalCurrency(usdAmount, overrides, localUsdPrices) {
    const { country, loading } = useRegionTier();
    const upper = (country || "").toUpperCase();
    const currency = detectCurrency(upper);
    const override = overrides && overrides[currency];
    const hasOverride = typeof override === "number" && override > 0;
    // New: Check for regional USD price override
    const regionalUsdOverride = localUsdPrices && localUsdPrices[currency];
    const activeUsdAmount = typeof regionalUsdOverride === "number" && regionalUsdOverride > 0
        ? Math.round(regionalUsdOverride * 100) / 100
        : Math.round(usdAmount * 100) / 100;
    const rate = exchangeRates[currency] ?? 1;
    const amount = hasOverride ? override : activeUsdAmount * rate;
    const isUsd = currency === "USD";
    const formatted = formatPrice(activeUsdAmount, currency, overrides ?? undefined, localUsdPrices ?? undefined);
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
export function resolveAdminSku(idOrSku) {
    if (!idOrSku)
        return null;
    const cat = CHECKOUT_CATALOG[idOrSku];
    if (cat?.adminSku)
        return cat.adminSku;
    for (const c of Object.values(CHECKOUT_CATALOG)) {
        if (c.id === idOrSku)
            return c.adminSku ?? c.id;
    }
    return idOrSku;
}
/**
 * Same as `useLocalCurrency` but pulls the manual per-currency overrides for
 * the given sku/slug from LivePricesProvider (set at /admin/products/:sku).
 */
export function useLocalCurrencyForSku(usdAmount, skuOrId) {
    const { local_prices, local_usd_prices } = useSkuOverridesResolver()(skuOrId);
    return useLocalCurrency(usdAmount, local_prices, local_usd_prices);
}
/**
 * Returns a resolver `(idOrSku) => overrides` for use inside .map() loops
 * without breaking React hook rules. Backed by LivePricesProvider.
 */
export function useSkuOverridesResolver() {
    const { prices } = useLivePrices();
    return (idOrSku) => {
        const sku = resolveAdminSku(idOrSku);
        if (!sku)
            return { local_prices: null, local_usd_prices: null };
        return {
            local_prices: (prices[sku]?.local_prices ?? null),
            local_usd_prices: (prices[sku]?.local_usd_prices ?? null),
        };
    };
}
/**
 * Format an already-computed LOCAL amount (not USD) in the visitor's currency.
 * Use when totals were summed per-item in local currency (e.g. mixing manual
 * overrides with USD*rate items), so the label reflects the exact sum.
 */
export function formatLocalDirect(localAmount, country) {
    const currency = detectCurrency((country || "US").toUpperCase());
    return formatPrice(0, currency, { [currency]: localAmount });
}
/**
 * Sum a list of items into the visitor's local currency, honoring per-sku
 * manual overrides (`digital_products.local_prices`). Falls back to the
 * automatic USD→local conversion for items without an override.
 */
export function sumItemsLocal(items, country, resolver) {
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
export function useCurrencyBreakdown(usdAmount, overrides, localUsdPrices) {
    const { country } = useRegionTier();
    const currency = detectCurrency((country || "US").toUpperCase());
    const rate = exchangeRates[currency] ?? 1;
    const regionalUsdOverride = localUsdPrices && localUsdPrices[currency];
    const activeUsd = typeof regionalUsdOverride === "number" && regionalUsdOverride > 0
        ? regionalUsdOverride
        : usdAmount;
    const override = overrides && overrides[currency];
    const hasOverride = typeof override === "number" && override > 0;
    const finalLocal = hasOverride ? override : activeUsd * rate;
    // Si hay override manual, el "ajuste" es la diferencia entre (USD * rate) y el override.
    // Pero el usuario pidió específicamente mencionar cuando bajamos el precio.
    // Si activeUsd < usdAmount, ya hay un ajuste regional en USD.
    return {
        currency,
        rate,
        baseUsd: activeUsd,
        originalUsd: usdAmount,
        hasRegionalUsd: activeUsd < usdAmount,
        adjustmentUsd: usdAmount - activeUsd,
        finalLocal,
        isUsd: currency === "USD"
    };
}
