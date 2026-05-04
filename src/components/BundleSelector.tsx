import { useState, useEffect } from "react";
import { Check, ShoppingCart, Truck, Package, Download, Loader2, Star, CalendarClock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useBundleStore } from "@/stores/bundleStore";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";
import { toast } from "sonner";

// Variant IDs (Shopify) — every bundle is the same 8,000-words physical book in different quantities.
const BOOK_8000_VARIANT = "gid://shopify/ProductVariant/43137345749053";
const BOOK_8000_PRODUCT = "gid://shopify/Product/7849025568829";

// Set of all variant IDs that belong to ANY bundle. Used to clean prior bundle items
// from cart before re-adding the selected bundle, guaranteeing exact composition.
const ALL_BUNDLE_VARIANT_IDS = new Set<string>([BOOK_8000_VARIANT]);

type BundleId = "single" | "duo" | "trio";

interface BundleItem {
  productId: string;
  variantId: string;
  title: string;
  price: string; // per-unit price
  quantity: number;
  image: string;
}

interface Bundle {
  id: BundleId;
  label: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  total: number;
  retail: number;
  savePct: number;
  freeShipping: boolean;
  items: BundleItem[];
}

const COVER_8000 = "/images/product-spanish-8000-book.webp";

export const bundles: Bundle[] = [
  {
    id: "single",
    label: "1 × Spanish Relax 8,000 Words — Physical + Digital FREE",
    description: "",
    total: 29.99,
    retail: 54.0,
    savePct: 44,
    freeShipping: true,
    items: [
      {
        productId: BOOK_8000_PRODUCT,
        variantId: BOOK_8000_VARIANT,
        title: "Spanish Relax — 8,000 Words Physical Book + Digital FREE",
        price: "29.99",
        quantity: 1,
        image: COVER_8000,
      },
    ],
  },
  {
    id: "duo",
    label: "2 × Spanish Relax 8,000 Words — Save 15%",
    badge: "RECOMMENDED",
    badgeColor: "bg-amber-500 text-white",
    description: "Perfect to gift one — both include the digital PDF FREE.",
    total: 50.98,
    retail: 59.98,
    savePct: 15,
    freeShipping: true,
    items: [
      {
        productId: BOOK_8000_PRODUCT,
        variantId: BOOK_8000_VARIANT,
        title: "Spanish Relax — 8,000 Words Physical Book + Digital FREE",
        price: "25.49",
        quantity: 2,
        image: COVER_8000,
      },
    ],
  },
  {
    id: "trio",
    label: "3 × Spanish Relax 8,000 Words — Save 25%",
    badge: "BEST VALUE",
    badgeColor: "bg-rose-600 text-white",
    description: "Best value — share with family or study buddies.",
    total: 67.48,
    retail: 89.97,
    savePct: 25,
    freeShipping: true,
    items: [
      {
        productId: BOOK_8000_PRODUCT,
        variantId: BOOK_8000_VARIANT,
        title: "Spanish Relax — 8,000 Words Physical Book + Digital FREE",
        price: "22.49",
        quantity: 3,
        image: COVER_8000,
      },
    ],
  },
];

interface BundleSelectorProps {
  defaultBundle?: BundleId;
}

/**
 * Adds a bundle to the cart with exact composition guarantee:
 * 1. Removes any items belonging to other bundles.
 * 2. Sets each bundle item to qty=1 (adds if missing, updates if present).
 * 3. Validates the resulting subtotal equals the bundle target.
 * Safe to call from anywhere (e.g. StickyBuyBar) — uses cart store directly.
 */
export async function addBundleToCart(bundleId: BundleId): Promise<boolean> {
  const bundle = bundles.find((b) => b.id === bundleId);
  if (!bundle) return false;

  const cartStore = useCartStore.getState();
  const { addItem, removeItem, updateQuantity, setDrawerOpen } = cartStore;

  trackHotmartEvent("AddToCart", {
    content_name: `Bundle: ${bundle.label}`,
    content_category: "Bundle",
    content_ids: [bundle.id],
    content_type: "product_group",
    value: bundle.total,
    currency: "USD",
    num_items: bundle.items.length,
    bundle_id: bundle.id,
  });

  // STEP 1: clean other bundle items.
  const bundleVariantIds = new Set(bundle.items.map((i) => i.variantId));
  const existingItems = useCartStore.getState().items;
  for (const cartItem of existingItems) {
    if (
      ALL_BUNDLE_VARIANT_IDS.has(cartItem.variantId) &&
      !bundleVariantIds.has(cartItem.variantId)
    ) {
      await removeItem(cartItem.variantId);
    }
  }

  // STEP 2: ensure each bundle item is in cart with the right quantity.
  for (const item of bundle.items) {
    const existing = useCartStore
      .getState()
      .items.find((ci) => ci.variantId === item.variantId);
    if (existing) {
      if (existing.quantity !== item.quantity) await updateQuantity(item.variantId, item.quantity);
      continue;
    }
    await addItem({
      product: {
        node: {
          id: item.productId,
          title: item.title,
          description: "",
          handle: "",
          priceRange: { minVariantPrice: { amount: item.price, currencyCode: "USD" } },
          images: { edges: [{ node: { url: item.image, altText: item.title } }] },
          variants: {
            edges: [
              {
                node: {
                  id: item.variantId,
                  title: "Default Title",
                  price: { amount: item.price, currencyCode: "USD" },
                  availableForSale: true,
                  selectedOptions: [{ name: "Title", value: "Default Title" }],
                },
              },
            ],
          },
          options: [{ name: "Title", values: ["Default Title"] }],
        },
      },
      variantId: item.variantId,
      variantTitle: "Default Title",
      price: { amount: item.price, currencyCode: "USD" },
      quantity: item.quantity,
      selectedOptions: [{ name: "Title", value: "Default Title" }],
    });
  }

  // STEP 3: validate.
  const finalItems = useCartStore.getState().items;
  const expectedIds = new Set(bundle.items.map((i) => i.variantId));
  const finalBundleItems = finalItems.filter((i) => expectedIds.has(i.variantId));
  const subtotal = finalBundleItems.reduce(
    (sum, i) => sum + parseFloat(i.price.amount) * i.quantity,
    0,
  );
  const expectedSubtotal = bundle.items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const composedCorrectly =
    finalBundleItems.length === bundle.items.length &&
    bundle.items.every((ci) => {
      const m = finalBundleItems.find((fi) => fi.variantId === ci.variantId);
      return m && m.quantity === ci.quantity;
    });
  const totalsMatch =
    Math.abs(subtotal - expectedSubtotal) < 0.01 &&
    Math.abs(expectedSubtotal - bundle.total) < 0.01;

  if (!composedCorrectly || !totalsMatch) {
    console.error("[BundleSelector] Validation failed", {
      bundle: bundle.id,
      expected: { items: bundle.items.length, total: bundle.total, subtotal: expectedSubtotal },
      actual: { items: finalBundleItems.length, subtotal },
    });
    toast.error("There was a problem composing your bundle. Please review your cart before checkout.");
    setDrawerOpen(true);
    return false;
  }

  console.info("[BundleSelector] Bundle validated", {
    bundle: bundle.id,
    items: finalBundleItems.length,
    subtotal: subtotal.toFixed(2),
    expected: bundle.total.toFixed(2),
  });
  setDrawerOpen(true);
  return true;
}

export const BundleSelector = ({ defaultBundle = "single" }: BundleSelectorProps) => {
  const [selected, setSelected] = useState<BundleId>(defaultBundle);
  const [loading, setLoading] = useState(false);
  const setSelectedBundle = useBundleStore((s) => s.setSelected);

  const current = bundles.find((b) => b.id === selected) ?? bundles[0];

  // Publish selection to the shared bundle store so other UI (StickyBuyBar) can react.
  useEffect(() => {
    setSelectedBundle({
      id: current.id,
      label: current.label,
      total: current.total,
      retail: current.retail,
      itemCount: current.items.length,
    });
  }, [current, setSelectedBundle]);

  const handleBuy = async () => {
    setLoading(true);
    try {
      await addBundleToCart(current.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" /> Buy more, save more
        </p>
        <span className="text-[10px] text-muted-foreground">Hannah & 12,000+ purchased</span>
      </div>

      {/* Bundle cards */}
      <div className="space-y-2">
        {bundles.map((b) => {
          const isSelected = b.id === selected;
          const isMultiPack = b.id !== "single";
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelected(b.id)}
              className={`relative w-full text-left rounded-xl border-2 p-3 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-[0_4px_20px_rgba(20,184,166,0.15)]"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {b.badge && (
                <span
                  className={`absolute -top-2 right-3 text-[9px] font-black px-2 py-0.5 rounded-full shadow ${b.badgeColor}`}
                >
                  {b.badge}
                </span>
              )}
              <div className="flex items-start gap-3">
                {/* Radio */}
                <div
                  className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-bold leading-tight">{b.label}</p>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-black text-primary leading-none">
                        ${b.total.toFixed(2)}
                      </p>
                      <p className="text-[10px] line-through text-muted-foreground">
                        ${b.retail.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {b.description && (
                    <p className="text-[11px] text-muted-foreground leading-snug mb-1.5">
                      {b.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-0.5 text-[9px] bg-rose-500/10 text-rose-600 font-bold px-1.5 py-0.5 rounded uppercase">
                      Save {b.savePct}%
                    </span>
                    {b.freeShipping && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/10 text-emerald-700 font-bold px-1.5 py-0.5 rounded uppercase">
                        <Truck className="w-2.5 h-2.5" /> Free shipping
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 text-[9px] bg-primary/15 text-primary font-bold px-1.5 py-0.5 rounded uppercase">
                      <Package className="w-2.5 h-2.5" /> In stock · ships 48h
                    </span>
                  </div>
                  {/* Mini covers for bundles with books */}
                  {b.items.length > 1 && (
                    <div className="flex items-center gap-1 mt-2">
                      {b.items.map((it) => (
                        <img
                          key={it.variantId}
                          src={it.image}
                          alt={it.title}
                          className="w-7 h-9 object-cover rounded border border-border"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                  {isSelected && isMultiPack && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 space-y-1">
                      <div className="flex items-start gap-1.5 text-[10px] leading-tight text-emerald-900 dark:text-emerald-200">
                        <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span><strong>INSTANT:</strong> digital PDF delivered to your email today.</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[10px] leading-tight text-emerald-900 dark:text-emerald-200">
                        <Truck className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span><strong>SHIPPING:</strong> physical books ship within 48h · FREE worldwide.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA — text adapts to bundle type so customers know exactly what happens next */}
      <Button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        size="xl"
        className="relative z-10 w-full mt-3 text-base md:text-lg py-6 touch-manipulation shadow-[0_8px_30px_rgba(147,51,234,0.45)] bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition-all hover:scale-[1.02] active:scale-[0.99]"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <span className="flex flex-col items-center leading-tight">
            <span className="flex items-center gap-2 font-black">
              {current.id === "single" ? (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  GET PHYSICAL BOOK · ${current.total.toFixed(2)}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  GET {current.items[0].quantity} BOOKS · ${current.total.toFixed(2)}
                </>
              )}
            </span>
            <span className="text-[10px] font-medium opacity-90 mt-0.5">
              Ships in 48h · FREE shipping · PDF FREE in your email today
            </span>
          </span>
        )}
      </Button>

      {/* Trust row */}
      <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-0.5">
          <Check className="w-3 h-3 text-emerald-600" /> Secure checkout
        </span>
        <span className="flex items-center gap-0.5">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> 4.8/5 · 500+ reviews
        </span>
        <span className="flex items-center gap-0.5">
          <Check className="w-3 h-3 text-emerald-600" /> 30-day refund
        </span>
      </div>
    </div>
  );
};