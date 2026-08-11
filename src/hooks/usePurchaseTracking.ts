
import { convertToUSD, type Currency } from "@/i18n";
import { useCheckoutPruebaStore, calcTotals } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";

/**
 * Hook para disparar el evento de Purchase (éxito) normalizado a USD.
 */
export const usePurchaseTracking = () => {
  const { region } = useRegionTier();
  
  const trackPurchase = (orderId: string, methodLabel: string = "iLingue Store") => {
    const s = useCheckoutPruebaStore.getState();
    const totals = calcTotals(s.items, s.couponPercent, region.tier);
    
    // Purchase: siempre reportamos en USD para Ads (Facebook/Instagram/Google)
    // trackHotmartEvent ya maneja la conversión interna si le pasamos la moneda local,
    // pero para ser explícitos y evitar redondeos, enviamos el valor USD calculado.
    trackHotmartEvent("Purchase", {
      content_ids: s.items.map((i) => i.id),
      content_name: s.items.length === 1 ? s.items[0].name : "Combo iLingue Relax",
      content_type: "product",
      value: totals.total,
      currency: "USD",
      order_id: orderId,
      num_items: s.items.reduce((n, i) => n + (i.quantity || 1), 0),
      method: methodLabel
    });
  };

  return { trackPurchase };
};
