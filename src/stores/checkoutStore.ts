import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { RegionTier } from "@/hooks/useRegionTier";

export interface PruebaItem {
  id: string;
  name: string;
  price: number; // USD unit (fallback / default)
  quantity: number;
  image: string;
  description?: string;
  /** Optional per-region prices in USD. If set, overrides `price` based on IP tier. */
  regionPrices?: { latam: number; global: number };
}

/** Returns the effective USD unit price for an item, given the visitor's IP region tier. */
export function itemPrice(item: PruebaItem, tier: RegionTier): number {
  return item.regionPrices?.[tier] ?? item.price;
}

export interface BuyerInfo {
  fullName: string;
  email: string;
  phone?: string;
}

interface PruebaStore {
  items: PruebaItem[];
  coupon: string | null;
  couponPercent: number;
  buyer: BuyerInfo;
  setBuyer: (patch: Partial<BuyerInfo>) => void;
  addItem: (item: Omit<PruebaItem, "quantity"> & { quantity?: number }) => void;
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
  TEST100: 100,
  GRATIS100: 100,
  DOLAR1: 90,
  PRUEBA1: 90,
};

export const useCheckoutPruebaStore = create<PruebaStore>()(
  persist(
    (set, get) => ({
      items: DEFAULT_ITEMS,
      coupon: null,
      couponPercent: 0,
      buyer: { fullName: "", email: "", phone: "" },

      setBuyer: (patch) => set({ buyer: { ...get().buyer, ...patch } }),


      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: item.quantity ?? 1 }] });
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
        const percent = VALID_COUPONS[upper];
        if (percent) {
          set({ coupon: upper, couponPercent: percent });
          return true;
        }
        return false;
      },

      removeCoupon: () => set({ coupon: null, couponPercent: 0 }),

      resetToDefaults: () => set({ items: DEFAULT_ITEMS, coupon: null, couponPercent: 0 }),
    }),
    {
      name: "checkout-prueba-1",
      storage: createJSONStorage(() => localStorage),
      // Bump de versión para purgar caches con productos demo antiguos.
      version: 4,
      migrate: (persisted: any, _fromVersion) => {
        if (persisted && Array.isArray(persisted.items)) {
          persisted.items = persisted.items.filter(
            (i: PruebaItem) => !PHANTOM_IDS.has(i.id),
          );
        }
        return persisted;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PruebaStore>;
        const cleanItems = Array.isArray(p.items)
          ? p.items.filter((i) => !PHANTOM_IDS.has(i.id))
          : current.items;
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
  const subtotal = items.reduce((sum, i) => sum + itemPrice(i, tier) * i.quantity, 0);
  const discount = (subtotal * couponPercent) / 100;
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}
