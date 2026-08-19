import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { formatCurrencyAmount } from "@/i18n";
import type { RegionTier } from "@/hooks/useRegionTier";
import { itemPrice, type PruebaItem, BuyerInfo, PruebaStore } from "./checkoutStore"; // Import types if possible or redefine lightly

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
  const { detectCurrency, exchangeRates } = require("@/i18n");
  const currency = detectCurrency((country || "US").toUpperCase());
  const rate = exchangeRates[currency] ?? 1;

  const { subtotal, total, discount } = useMemo(() => {
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
    const shippingLocal = items.some(i => i.isPhysical) 
      ? (subtotalUSD >= 50 ? 0 : shippingCostUSD * rate) 
      : 0;

    return {
      subtotal: subtotalLocal,
      discount: discountLocal,
      total: Math.max(0, subtotalLocal - discountLocal + shippingLocal),
      shipping: shippingLocal,
      currency
    };
  }, [items, couponPercent, tier, country, shippingCostUSD, resolver, currency, rate]);

  return { subtotal, discount, total, shipping, currency };
};
