import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface PruebaItem {
  id: string;
  name: string;
  price: number; // USD unit
  quantity: number;
  image: string;
  description?: string;
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
    id: "prueba-2",
    name: "Prueba 2 · Complemento",
    price: 15,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=200&fit=crop",
    description: "Complemento digital opcional",
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
    },
  ),
);

export function calcTotals(items: PruebaItem[], couponPercent: number) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = (subtotal * couponPercent) / 100;
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}
