import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

import { isBlockedVariant } from '@/config/blockedVariants';
import { 
  CartItem, 
  DiscountCodeResult,
  createShopifyCart, 
  addLineToShopifyCart, 
  updateShopifyCartLine, 
  removeLineFromShopifyCart,
  syncShopifyCart,
  applyDiscountToShopifyCart
} from '@/lib/shopify';

// Retry with exponential backoff for transient Shopify slowness/failures.
// Resolves to null if all attempts fail or return falsy.
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number; maxDelayMs?: number; isSuccess?: (r: T) => boolean } = {}
): Promise<T | null> {
  const { retries = 3, baseDelayMs = 250, maxDelayMs = 1500, isSuccess = (r) => !!r } = options;
  let lastResult: T | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      if (isSuccess(result)) return result;
      lastResult = result;
    } catch (err) {
      console.warn(`[cart] Shopify call failed (attempt ${attempt + 1}/${retries + 1}):`, err);
    }
    if (attempt < retries) {
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return lastResult;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  isDrawerOpen: boolean;
  discountCodes: DiscountCodeResult[];
  discountTotal: string | null;
  discountSubtotal: string | null;
  syncError: string | null;
  setDrawerOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, 'lineId'>) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  retrySync: () => Promise<boolean>;
  getCheckoutUrl: () => string | null;
  applyDiscount: (code: string) => Promise<boolean>;
  removeDiscount: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      isSyncing: false,
      isDrawerOpen: false,
      discountCodes: [],
      discountTotal: null,
      discountSubtotal: null,
      syncError: null,
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),

      addItem: async (item) => {
        // Defensive guard: never allow phantom/deprecated Shopify variants into the cart.
        if (isBlockedVariant(item.variantId)) {
          console.warn('[cart] Blocked phantom variant attempted:', item.variantId);
          toast.error('Este producto ya no está disponible en el carrito de Shopify', {
            description: 'Ve a la página del producto y usa "Comprar ahora" para el checkout directo.',
          });
          return;
        }

        const { items, cartId, clearCart } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);

        // OPTIMISTIC UPDATE: show item in cart immediately for snappy UX
        if (existingItem) {
          set({
            items: items.map(i => i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i),
            isLoading: true,
          });
        } else {
          set({
            items: [...items, { ...item, lineId: null }],
            isLoading: true,
          });
        }

        try {
          if (!cartId) {
            const result = await retryWithBackoff(
              () => createShopifyCart({ ...item, lineId: null }),
              { retries: 3, baseDelayMs: 200, isSuccess: (r) => !!r?.cartId && !!r?.lineId }
            );
            if (result) {
              set({
                cartId: result.cartId,
                checkoutUrl: result.checkoutUrl,
                items: get().items.map(i => i.variantId === item.variantId
                  ? { ...i, lineId: result.lineId }
                  : i),
                syncError: null,
              });
            } else {
              set({ syncError: 'No se pudo sincronizar con Shopify. Tus productos siguen en el carrito.' });
            }
          } else if (existingItem) {
            const newQuantity = existingItem.quantity + item.quantity;
            if (!existingItem.lineId) {
              // Item never synced — trigger a retry to push it to Shopify
              set({ syncError: 'Sincronización pendiente.' });
              return;
            }
            const result = await retryWithBackoff(
              () => updateShopifyCartLine(cartId, existingItem.lineId!, newQuantity),
              { retries: 3, baseDelayMs: 200, isSuccess: (r) => !!r && (r.success || !!r.cartNotFound) }
            );
            if (result?.cartNotFound) {
              // Cart expired in Shopify — keep local items, drop server refs so retry can rebuild
              set({ cartId: null, checkoutUrl: null, discountCodes: [], discountTotal: null, discountSubtotal: null, items: get().items.map(i => ({ ...i, lineId: null })), syncError: 'El carrito de Shopify expiró. Pulsa Reintentar para restaurarlo.' });
            } else if (!result?.success) {
              set({ syncError: 'No se pudo sincronizar con Shopify. Tus productos siguen en el carrito.' });
            } else {
              set({ syncError: null });
            }
          } else {
            const result = await retryWithBackoff(
              () => addLineToShopifyCart(cartId, { ...item, lineId: null }),
              { retries: 3, baseDelayMs: 200, isSuccess: (r) => !!r && (r.success || !!r.cartNotFound) }
            );
            if (result?.success) {
              const currentItems = get().items;
              set({ items: currentItems.map(i => i.variantId === item.variantId
                ? { ...i, lineId: result.lineId ?? null }
                : i), syncError: null });
            } else if (result?.cartNotFound) {
              set({ cartId: null, checkoutUrl: null, discountCodes: [], discountTotal: null, discountSubtotal: null, items: get().items.map(i => ({ ...i, lineId: null })), syncError: 'El carrito de Shopify expiró. Pulsa Reintentar para restaurarlo.' });
            } else {
              set({ syncError: 'No se pudo sincronizar con Shopify. Tus productos siguen en el carrito.' });
            }
          }
        } catch (error) {
          console.error('Failed to add item:', error);
          set({ syncError: 'Error de red al sincronizar. Tus productos siguen en el carrito.' });
        } finally {
          set({ isLoading: false, isDrawerOpen: true });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(variantId);
          return;
        }
        
        const { items, cartId, clearCart } = get();
        const item = items.find(i => i.variantId === variantId);
        if (!item?.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const result = await updateShopifyCartLine(cartId, item.lineId, quantity);
          if (result.success) {
            const currentItems = get().items;
            set({ items: currentItems.map(i => i.variantId === variantId ? { ...i, quantity } : i) });
          } else if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error('Failed to update quantity:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        const { items, cartId, clearCart } = get();
        const item = items.find(i => i.variantId === variantId);
        if (!item?.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const result = await removeLineFromShopifyCart(cartId, item.lineId);
          if (result.success) {
            const currentItems = get().items;
            const newItems = currentItems.filter(i => i.variantId !== variantId);
            newItems.length === 0 ? clearCart() : set({ items: newItems });
          } else if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error('Failed to remove item:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null, discountCodes: [], discountTotal: null, discountSubtotal: null }),
      getCheckoutUrl: () => get().checkoutUrl,

      applyDiscount: async (code: string) => {
        const { cartId, clearCart } = get();
        if (!cartId) return false;

        set({ isLoading: true });
        try {
          const result = await applyDiscountToShopifyCart(cartId, [code]);
          if (result.cartNotFound) {
            clearCart();
            return false;
          }
          if (result.success) {
            const applicable = result.discountCodes.some(dc => dc.applicable);
            set({
              discountCodes: result.discountCodes,
              discountTotal: result.totalAmount?.amount || null,
              discountSubtotal: result.subtotalAmount?.amount || null,
            });
            return applicable;
          }
          return false;
        } catch (error) {
          console.error('Failed to apply discount:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      removeDiscount: async () => {
        const { cartId } = get();
        if (!cartId) return;

        set({ isLoading: true });
        try {
          await applyDiscountToShopifyCart(cartId, []);
          set({ discountCodes: [], discountTotal: null, discountSubtotal: null });
        } catch (error) {
          console.error('Failed to remove discount:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      syncCart: async () => {
        const { cartId, isSyncing, clearCart } = get();
        if (!cartId || isSyncing) return;

        set({ isSyncing: true });
        try {
          const result = await syncShopifyCart(cartId);
          if (!result.exists || result.totalQuantity === 0) {
            clearCart();
          }
        } catch (error) {
          console.error('Failed to sync cart with Shopify:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Manual recovery: rebuild Shopify cart from locally persisted items without losing them.
      retrySync: async () => {
        const { items, cartId, isSyncing } = get();
        if (isSyncing || items.length === 0) return false;

        set({ isSyncing: true, syncError: null });
        let allSucceeded = true;
        try {
          let workingCartId = cartId;

          // 1. Ensure we have a Shopify cart. If not, create one with the first item.
          if (!workingCartId) {
            const first = items[0];
            const created = await retryWithBackoff(
              () => createShopifyCart({ ...first, lineId: null }),
              { retries: 3, baseDelayMs: 250, isSuccess: (r) => !!r?.cartId && !!r?.lineId }
            );
            if (!created) {
              set({ syncError: 'No se pudo conectar con Shopify. Inténtalo de nuevo en unos segundos.' });
              return false;
            }
            workingCartId = created.cartId;
            set({
              cartId: created.cartId,
              checkoutUrl: created.checkoutUrl,
              items: get().items.map(i => i.variantId === first.variantId ? { ...i, lineId: created.lineId } : i),
            });
          }

          // 2. Push any remaining items that still lack a Shopify lineId.
          const pending = get().items.filter(i => !i.lineId);
          for (const item of pending) {
            const result = await retryWithBackoff(
              () => addLineToShopifyCart(workingCartId!, { ...item, lineId: null }),
              { retries: 3, baseDelayMs: 250, isSuccess: (r) => !!r && (r.success || !!r.cartNotFound) }
            );
            if (result?.success) {
              set({ items: get().items.map(i => i.variantId === item.variantId ? { ...i, lineId: result.lineId ?? null } : i) });
            } else {
              allSucceeded = false;
            }
          }

          if (!allSucceeded) {
            set({ syncError: 'Algunos productos no se pudieron sincronizar. Vuelve a intentarlo.' });
            return false;
          }
          set({ syncError: null });
          return true;
        } catch (error) {
          console.error('retrySync failed:', error);
          set({ syncError: 'No se pudo sincronizar con Shopify. Inténtalo de nuevo.' });
          return false;
        } finally {
          set({ isSyncing: false });
        }
      }
    }),
    {
      name: 'shopify-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, cartId: state.cartId, checkoutUrl: state.checkoutUrl }),
    }
  )
);
