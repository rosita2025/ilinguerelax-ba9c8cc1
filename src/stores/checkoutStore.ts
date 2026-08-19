import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";
import { formatCurrencyAmount } from "@/i18n";

import type { RegionTier } from "@/hooks/useRegionTier";

export interface PruebaItem {
  id: string;
  name: string;
  price: number; // USD unit (fallback / default)
  quantity: number;
  image: string;
  description?: string;
  /** Optional per-region prices in USD. If set, overrides `price` based on IP tier. */
  regionPrices?: { latam: number; global: number; tienda?: number };
  /** Optional Peru local price (PEN). When set + country=PE, shown natively (no conversion). */
  pricePen?: number;
  /** Whether the product is physical (requires shipping address). */
  /** Whether the product is physical (requires shipping address). */
  isPhysical?: boolean;
  /** Optional per-currency manual prices (override automatic conversion). */
  localPrices?: Record<string, number>;
  /** Optional per-currency regional USD base overrides. */
  localUsdPrices?: Record<string, number>;
}


/** Returns the effective USD unit price for an item, given the visitor's IP region tier. */
export function itemPrice(item: PruebaItem, tier: RegionTier): number {
  const country = (() => {
    if (typeof window === "undefined") return "";
    try { return (localStorage.getItem("ilr_country") || "").toUpperCase(); } catch { return ""; }
  })();
  
  // TIER TIENDA (VE, CU, NI)
  if (["VE", "CU", "NI"].includes(country) && item.regionPrices?.tienda) {
    return item.regionPrices.tienda;
  }
  
  // TIER LATAM vs GLOBAL
  return item.regionPrices?.[tier] ?? item.price;
}

/**
 * If country is Peru AND every item has a native pricePen set, returns totals in PEN.
 * Otherwise returns null (caller falls back to USD-based conversion).
 */
export function calcTotalsPen(
  items: PruebaItem[],
  couponPercent: number,
  country: string,
): { subtotal: number; discount: number; total: number } | null {
  if ((country || "").toUpperCase() !== "PE") return null;
  if (items.length === 0) return null;
  if (!items.every((i) => {
    const penOverride = i.localPrices?.["PEN"];
    return (typeof i.pricePen === "number" && i.pricePen > 0) || (typeof penOverride === "number" && penOverride > 0);
  })) return null;
  const subtotal = items.reduce((s, i) => {
    const penOverride = i.localPrices?.["PEN"];
    const penPrice = (typeof i.pricePen === "number" && i.pricePen > 0) ? i.pricePen : (penOverride || 0);
    return s + penPrice * i.quantity;
  }, 0);
  const discount = (subtotal * couponPercent) / 100;
  const total = Math.max(0, subtotal - discount);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/** Formats a PEN amount as "S/29,90" (dot thousands, comma decimals). */
export function formatPen(amount: number): string {
  return formatCurrencyAmount(amount, "PEN");
}

export interface BuyerInfo {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface PruebaStore {
  items: PruebaItem[];
  coupon: string | null;
  couponPercent: number;
  buyer: BuyerInfo;
  clientSecret: string | null;
  setBuyer: (patch: Partial<BuyerInfo>) => void;
  addItem: (item: Omit<PruebaItem, "quantity"> & { quantity?: number }, opts?: { silent?: boolean }) => void;
  /** Update price/name/image/regionPrices of items already in cart (keeps quantity). */
  syncItem: (patch: Omit<PruebaItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clear: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  resetToDefaults: () => void;
  /** Remove any cart line whose id is NOT in the provided allow-list of valid IDs. */
  pruneUnknown: (validIds: Set<string>) => number;
  selectedMethod: string | null;
  setSelectedMethod: (method: string | null) => void;
  setClientSecret: (secret: string | null) => void;
  hasPhysicalItems: () => boolean;
}

// Carrito arranca VACÍO. Los productos se agregan solo cuando el usuario
// hace clic en "Agregar al carrito" desde una página de producto.
const DEFAULT_ITEMS: PruebaItem[] = [];

// IDs de productos demo/prueba antiguos que deben purgarse del localStorage
// existente para evitar que aparezcan sin acción del usuario.
const PHANTOM_IDS = new Set([
  "prueba-1",
  "prueba-patrones-es",
  "prueba-3",
]);

const VALID_COUPONS: Record<string, number> = {
  NEW10: 10,
  PRUEBA20: 20,
  RELAX15: 15,
  PASCUA25: 25,
};

/**
 * Cupones de prueba con total fijo en USD (espejo de
 * supabase/functions/_shared/catalogPricing.ts). El servidor es la fuente
 * autoritativa: aquí solo se calcula el descuento equivalente para mostrarlo.
 */
const FIXED_TOTAL_COUPONS: Record<string, number> = {
  DLTEST1: 1,
  FIXED1: 1,
  PRUEBA1: 1,
  PRUEBA1USD: 1,
  TEST1USD: 1,
};


interface PersistedCheckoutState {
  items?: PruebaItem[];
}

export const useCheckoutPruebaStore = create<PruebaStore>()(
  persist(
    (set, get) => ({
      items: DEFAULT_ITEMS,
      coupon: null,
      couponPercent: 0,
      buyer: { fullName: "", email: "", phone: "" },
      selectedMethod: null,
      clientSecret: null,

      setBuyer: (patch) => set({ buyer: { ...get().buyer, ...patch } }),
      setSelectedMethod: (method) => set({ selectedMethod: method }),
      setClientSecret: (secret) => set({ clientSecret: secret }),
      hasPhysicalItems: () => get().items.some((i) => i.isPhysical),


      addItem: (item, opts) => {
        // Productos digitales = 1 unidad por SKU. addItem es IDEMPOTENTE:
        // si el mismo SKU ya está en el carrito, NO acumula cantidad (evita
        // duplicados cuando el usuario vuelve al checkout, cuando el enlace
        // de recuperación se procesa dos veces, o cuando "Añadir al carrito"
        // se pulsa varias veces desde la ficha de producto).
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          // Refresca datos mutables (precio/imagen/nombre) sin tocar cantidad.
          set({
            items: get().items.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    name: item.name ?? i.name,
                    price: item.price ?? i.price,
                    image: item.image ?? i.image,
                    description: item.description ?? i.description,
                    regionPrices: item.regionPrices ?? i.regionPrices,
                    pricePen: item.pricePen ?? i.pricePen,
                    isPhysical: item.isPhysical ?? i.isPhysical,
                    localPrices: item.localPrices ?? i.localPrices,
                    localUsdPrices: item.localUsdPrices ?? i.localUsdPrices,
                    quantity: 1,

                  }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] });
        }
      },

      syncItem: (patch) => {
        const { quantity: _q, ...rest } = patch;
        set({
          items: get().items.map((i) =>
            i.id === patch.id
              ? {
                  ...i,
                  ...rest,
                  // Explicitly clear regionPrices if the new patch omits it,
                  // so switching a product from region-priced to flat works.
                  regionPrices: patch.regionPrices ?? undefined,
                  pricePen: patch.pricePen ?? undefined,
                  isPhysical: patch.isPhysical ?? i.isPhysical,
                  localPrices: patch.localPrices ?? i.localPrices,
                  localUsdPrices: patch.localUsdPrices ?? i.localUsdPrices,
                }

              : i,
          ),
        });
      },

      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      updateQuantity: (id, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
          return;
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
        });
      },

      clear: () => set({ items: [], coupon: null, couponPercent: 0 }),

      applyCoupon: (code) => {
        const upper = code.trim().toUpperCase();
        const fixedTotal = FIXED_TOTAL_COUPONS[upper];
        if (fixedTotal) {
          const subtotal = get().items.reduce((s, i) => s + i.price * i.quantity, 0);
          const percent = subtotal > fixedTotal
            ? Math.round((1 - fixedTotal / subtotal) * 10000) / 100
            : 0;
          set({ coupon: upper, couponPercent: percent });
          return true;
        }
        const percent = VALID_COUPONS[upper];
        if (percent) {
          set({ coupon: upper, couponPercent: percent });
          return true;
        }
        return false;
      },


      removeCoupon: () => set({ coupon: null, couponPercent: 0 }),

      resetToDefaults: () => set({ items: DEFAULT_ITEMS, coupon: null, couponPercent: 0 }),

      pruneUnknown: (validIds) => {
        const before = get().items;
        const kept = before.filter((i) => validIds.has(i.id));
        const removed = before.length - kept.length;
        if (removed > 0) set({ items: kept });
        return removed;
      },
    }),
    {
      name: "checkout-prueba-1",
      storage: createJSONStorage(() => localStorage),
      // Bump de versión para purgar caches con productos demo antiguos.
      version: 4,
      migrate: (persisted: unknown, _fromVersion) => {
        const state = persisted as PersistedCheckoutState | null;
        if (state && Array.isArray(state.items)) {
          state.items = state.items.filter(
            (i: PruebaItem) => !PHANTOM_IDS.has(i.id),
          );
        }
        return state;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PruebaStore>;
        const rawItems = Array.isArray(p.items)
          ? p.items.filter((i) => !PHANTOM_IDS.has(i.id))
          : current.items;
        // Dedupe defensivo: colapsa cualquier SKU repetido a UNA sola línea
        // con cantidad 1 (productos digitales = 1 unidad). Limpia carritos
        // heredados de la versión anterior que acumulaba cantidades.
        const seen = new Set<string>();
        const cleanItems: PruebaItem[] = [];
        for (const it of rawItems) {
          if (seen.has(it.id)) continue;
          seen.add(it.id);
          cleanItems.push({ ...it, quantity: 1 });
        }
        return {
          ...current,
          ...p,
          items: cleanItems,
          buyer: {
            ...current.buyer,
            ...((p as { buyer?: BuyerInfo })?.buyer ?? {}),
          },
        };
      },
    },
  ),
);

export function calcTotals(items: PruebaItem[], couponPercent: number, tier: RegionTier = "global") {
  try {
    if (!Array.isArray(items)) return { subtotal: 0, discount: 0, total: 0 };
    const subtotal = items.reduce((sum, i) => {
      const price = itemPrice(i, tier) || 0;
      return sum + price * (i.quantity || 1);
    }, 0);
    const safeCouponPercent = Math.max(0, Math.min(100, couponPercent || 0));
    const discount = (subtotal * safeCouponPercent) / 100;
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
  } catch (error) {
    console.error("Error in calcTotals:", error);
    return { subtotal: 0, discount: 0, total: 0 };
  }
}
