import { useMemo } from "react";
import { detectCurrency, exchangeRates, type Currency } from "@/i18n";
import { itemPrice, type PruebaItem } from "@/stores/checkoutStore";
import type { RegionTier } from "@/hooks/useRegionTier";

/**
 * Hook centralizado para calcular los totales del checkout en la moneda local
 * del comprador, incluyendo envío, impuestos (si aplica) y descuentos.
 */
export const useCheckoutTotal = (
  items: PruebaItem[],
  couponPercent: number,
  tier: RegionTier,
  country: string,
  shippingCostUSD: number, // Costo de envío base en USD
  resolver: (id: string) => { local_prices: any; local_usd_prices: any }
) => {
  const currency = detectCurrency((country || "US").toUpperCase()) as Currency;
  const rate = exchangeRates[currency] ?? 1;

  const totals = useMemo(() => {
    let subtotalUSD = 0;
    let subtotalLocal = 0;

    items.forEach((item) => {
      const { local_prices, local_usd_prices } = resolver(item.id);
      const override = local_prices?.[currency];
      const regionalUsd = local_usd_prices?.[currency];
      const activeUsd = (typeof regionalUsd === "number" && regionalUsd > 0) ? regionalUsd : itemPrice(item, tier);

      subtotalUSD += activeUsd * item.quantity;
      
      if (typeof override === "number" && override > 0) {
        subtotalLocal += override * item.quantity;
      } else {
        subtotalLocal += activeUsd * rate * item.quantity;
      }
    });

    const discountLocal = (subtotalLocal * Math.max(0, Math.min(100, couponPercent || 0))) / 100;
    
    // El envío es gratis si el subtotal USD >= 50
    const shippingUsd = items.some(i => i.isPhysical) 
      ? (subtotalUSD >= 50 ? 0 : shippingCostUSD) 
      : 0;
    
    const shippingLocal = shippingUsd * rate;
    const totalLocal = Math.max(0, subtotalLocal - discountLocal + shippingLocal);

    // Referencia USD real del total (para Gateways que no soportan moneda local)
    const totalUsd = totalLocal / rate;

    return {
      subtotalLocal,
      discountLocal,
      shippingLocal,
      totalLocal,
      totalUsd,
      currency
    };
  }, [items, couponPercent, tier, country, shippingCostUSD, resolver, currency, rate]);

  return totals;
};

