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
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clear: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  resetToDefaults: () => void;
}

const DEFAULT_ITEMS: PruebaItem[] = [
  {
    id: "prueba-1",
    name: "Prueba 1 · Producto Digital",
    price: 22,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=200&fit=crop",
    description: "Producto de prueba principal",
  },
  {
    id: "prueba-patrones-es",
    name: "Patrones en Español · Precio por región",
    price: 15, // fallback (global)
    regionPrices: { latam: 10, global: 15 }, // 🌎 $10 LatAm · 🌍 $15 resto
    quantity: 1,
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=200&fit=crop",
    description: "Demo: precio se ajusta según tu país (IP)",
  },
  {
    id: "prueba-3",
    name: "Prueba 3 · Bonus",
    price: 10,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop",
    description: "Bono adicional",
  },
];

const VALID_COUPONS: Record<string, number> = {
  NEW10: 10,
  PRUEBA20: 20,
  RELAX15: 15,
  TEST100: 100,
  GRATIS100: 100,
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
      version: 3,
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        buyer: {
          ...current.buyer,
          ...((persisted as { buyer?: BuyerInfo })?.buyer ?? {}),
        },
      }),
    },
  ),
);

export function calcTotals(items: PruebaItem[], couponPercent: number, tier: RegionTier = "global") {
  const subtotal = items.reduce((sum, i) => sum + itemPrice(i, tier) * i.quantity, 0);
  const discount = (subtotal * couponPercent) / 100;
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}
