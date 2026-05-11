import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2, Tag, X, Check } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { CartUpsell } from "@/components/CartUpsell";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";
import { trackGAEvent } from "@/hooks/useGoogleAnalytics";
import productSpanish5000Image from "@/assets/cart-spanish-5000-physical-phone.png";

// Hotmart checkout URL mapping for digital products
const HOTMART_CHECKOUT_MAP: Record<string, string> = {
  "gid://shopify/ProductVariant/43094791454781": "https://pay.hotmart.com/U103990323W?checkoutMode=10&bid=1775682596079", // 8,000 Palabras Digital
  "gid://shopify/ProductVariant/43062338191421": "https://pay.hotmart.com/T102978081M?bid=1775682831595", // 1,000 Verbos Digital
};

const CART_IMAGE_FALLBACKS: Record<string, { url: string; alt: string }> = {
  "gid://shopify/ProductVariant/42931924795453": {
    url: productSpanish5000Image,
    alt: "Spanish Relax - 5,000 Words",
  },
};

// Short display titles + subtitle + compareAt price for cart items
const CART_ITEM_DISPLAY: Record<string, { title: string; subtitle: string; compareAt?: string }> = {
  "gid://shopify/ProductVariant/42931924795453": {
    title: "5,000 Spanish",
    subtitle: "w/ English pronunciation",
    compareAt: "69.99",
  },
};

// Helper: detect any physical book (non-digital).
const isPhysicalItem = (title: string) => {
  const t = title.toLowerCase();
  const isDigital = t.includes("digital") || t.includes("ebook") || t.includes("e-book") || t.includes("pdf");
  return !isDigital;
};
// Helper: detect physical pre-order books (3,000 Verbs and Grammar only).
// 5,000 Spanish Relax is already in stock and ships normally.
const isPhysicalPreorderItem = (title: string) => {
  if (!isPhysicalItem(title)) return false;
  const t = title.toLowerCase();
  const is3000Verbs = /3[\s,.]*000/.test(t) && t.includes("verb");
  const isGrammar = t.includes("grammar") || t.includes("gramática") || t.includes("gramatica");
  return is3000Verbs || isGrammar;
};

export const CartDrawer = () => {
  const { 
    items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, 
    syncCart, isDrawerOpen, setDrawerOpen, discountCodes, discountTotal,
    applyDiscount, removeDiscount
  } = useCartStore();
  
  const [couponInput, setCouponInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = items.reduce((sum, item) => sum + parseFloat(item.price.amount) * item.quantity, 0);
  
  const appliedDiscount = discountCodes.find(dc => dc.applicable);

  useEffect(() => {
    if (isDrawerOpen) syncCart();
  }, [isDrawerOpen, syncCart]);

  const handleCheckout = () => {
    // Meta Pixel: InitiateCheckout
    try {
      trackHotmartEvent("InitiateCheckout", {
        content_name: items.map((i) => i.product.node.title).join(", "),
        content_ids: items.map((i) => i.variantId),
        content_type: "product",
        num_items: totalItems,
        value: subtotalPrice,
        currency: items[0]?.price.currencyCode || "USD",
      });
    } catch (e) {
      console.error("Pixel InitiateCheckout error:", e);
    }

    // Google Analytics 4: begin_checkout (Continue to Checkout button)
    try {
      const hasPhysical = items.some((i) => HOTMART_CHECKOUT_MAP[i.variantId] === undefined);
      const checkoutType = items.some((i) => HOTMART_CHECKOUT_MAP[i.variantId])
        ? "hotmart"
        : "shopify";
      trackGAEvent("begin_checkout", {
        currency: items[0]?.price.currencyCode || "USD",
        value: subtotalPrice,
        checkout_type: checkoutType,
        num_items: totalItems,
        items: items.map((i) => ({
          item_id: i.variantId,
          item_name: i.product.node.title,
          price: parseFloat(i.price.amount),
          quantity: i.quantity,
        })),
      });
    } catch (e) {
      console.error("GA begin_checkout error:", e);
    }

    // Check if any item has a Hotmart checkout URL
    const hotmartItem = items.find(item => HOTMART_CHECKOUT_MAP[item.variantId]);
    if (hotmartItem) {
      setDrawerOpen(false);
      window.location.href = HOTMART_CHECKOUT_MAP[hotmartItem.variantId];
      return;
    }
    // Fallback to Shopify checkout for physical products
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      setDrawerOpen(false);
      window.location.href = checkoutUrl;
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplying(true);
    const success = await applyDiscount(couponInput.trim());
    setIsApplying(false);
    if (success) {
      toast.success("¡Cupón aplicado!", { description: `Código "${couponInput.trim().toUpperCase()}" aplicado correctamente.` });
      setCouponInput("");
    } else {
      toast.error("Cupón no válido", { description: "El código ingresado no es válido o no aplica a estos productos." });
    }
  };

  const handleRemoveCoupon = async () => {
    await removeDiscount();
    toast.info("Cupón eliminado");
  };

  const getCartItemImage = (item: typeof items[number]) => {
    // Force local fallback for variants with curated cart imagery (e.g. physical 5,000 Spanish)
    const fallbackImage = CART_IMAGE_FALLBACKS[item.variantId];
    if (fallbackImage) return fallbackImage;

    const primaryImage = item.product.node.images?.edges?.[0]?.node;
    if (primaryImage?.url) {
      return {
        url: primaryImage.url,
        alt: primaryImage.altText || item.product.node.title,
      };
    }
    return null;
  };

  return (
      <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 &&
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          }
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-full sm:max-w-lg flex flex-col h-full z-[60]">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ?
          <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div> :
          <>
              {/* Free shipping progress bar */}
              {(() => {
                // Hide free shipping bar if cart only has digital products (no physical books)
                const hasPhysical = items.some((item) =>
                  isPhysicalItem(item.product.node.title)
                );
                if (!hasPhysical) return null;
                const FREE_SHIPPING_MIN = 45;
                const progress = Math.min((subtotalPrice / FREE_SHIPPING_MIN) * 100, 100);
                const remaining = Math.max(FREE_SHIPPING_MIN - subtotalPrice, 0);
                return (
                  <div className="flex-shrink-0 mb-3">
                    {remaining > 0 ? (
                      <p className="text-xs text-muted-foreground mb-1.5">
                        🚚 You're <span className="font-bold text-foreground">${remaining.toFixed(2)}</span> away from FREE shipping!
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-green-600 mb-1.5">
                        ✅ You've unlocked FREE shipping!
                      </p>
                    )}
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: progress >= 100 ? '#16a34a' : 'hsl(var(--primary))',
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
              {/* Pre-order warning banner — only for actual pre-order titles (3,000 Verbs / Grammar) */}
              {(() => {
                const hasPreorder = items.some((item) =>
                  isPhysicalPreorderItem(item.product.node.title)
                );
                if (!hasPreorder) return null;
                return (
                  <div className="flex-shrink-0 mb-3 p-2.5 rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-tight">
                      ⚠️ PRE-ORDER · Ships from June 2026
                    </p>
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5 leading-tight">
                      These books are <strong>advance pre-orders</strong>. Pay today at the lowest price and receive them starting June 2026.
                    </p>
                  </div>
                );
              })()}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-2">
                  {items.map((item) =>
                <div key={item.variantId} className="flex gap-2.5 p-2 border rounded-lg">
                      <div className="w-12 h-12 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {(() => {
                          const image = getCartItemImage(item);
                          return image ? (
                            <img
                              src={image.url}
                              alt={image.alt}
                              className="w-full h-full object-cover" />
                          ) : null;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        {(() => {
                          const display = CART_ITEM_DISPLAY[item.variantId];
                          const title = display?.title ?? item.product.node.title;
                          const subtitle = display?.subtitle;
                          const compareAt = display?.compareAt;
                          const price = parseFloat(item.price.amount);
                          const compareNum = compareAt ? parseFloat(compareAt) : null;
                          const discountPct = compareNum && compareNum > price
                            ? Math.round(((compareNum - price) / compareNum) * 100)
                            : null;
                          const isPreorder = isPhysicalPreorderItem(item.product.node.title);
                          return (
                            <>
                              <h4 className="font-semibold text-xs leading-tight truncate">{title}</h4>
                              {isPhysicalItem(item.product.node.title) && !isPreorder && (
                                <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border border-accent text-accent bg-accent/5 uppercase tracking-wide">
                                  📦 Physical
                                </span>
                              )}
                              {subtitle ? (
                                <p className="text-[10px] text-muted-foreground leading-tight truncate">{subtitle}</p>
                              ) : item.variantTitle !== "Default Title" ? (
                                <p className="text-[10px] text-muted-foreground leading-tight">{item.variantTitle}</p>
                              ) : null}
                              {isPreorder && (
                                <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-amber-950">
                                  📦 PRE-ORDER · Ships Jun 2026
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {compareNum && (
                                  <span className="text-[10px] line-through text-destructive font-medium">
                                    ${compareNum.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-xs font-bold text-primary">
                                  ${price.toFixed(2)}
                                </span>
                                {discountPct && (
                                  <span className="text-[9px] bg-destructive/10 text-destructive font-bold px-1 rounded">
                                    -{discountPct}%
                                  </span>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeItem(item.variantId)}
                      disabled={isLoading}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        disabled={isLoading}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs">{item.quantity}</span>
                          <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={isLoading}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                )}
                </div>
                {/* Upsell for physical book buyers */}
                <CartUpsell items={items} />
              </div>
              <div className="flex-shrink-0 space-y-3 pt-4 border-t bg-background">
                {/* Coupon section */}
                {appliedDiscount ? (
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {appliedDiscount.code} — applied at checkout
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveCoupon} disabled={isLoading}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        className="pl-8 h-9 text-sm uppercase"
                        disabled={isLoading || isApplying}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-4"
                      onClick={handleApplyCoupon}
                      disabled={!couponInput.trim() || isLoading || isApplying}
                    >
                      {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}

                {(() => {
                  const hasPhysical = items.some((item) =>
                    isPhysicalItem(item.product.node.title)
                  );
                  if (!hasPhysical) return null;
                  return (
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Print on demand 5-10 days + Express shipping 3 days = total delivery <strong className="text-foreground">8-13 days</strong>.
                    </p>
                  );
                })()}
                <div className="h-px bg-border" />
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-xl font-bold">
                      ${subtotalPrice.toFixed(2)} {items[0]?.price.currencyCode || 'USD'}
                    </span>
                  </div>
                </div>
                {(() => {
                  const hasPhysical = items.some((item) =>
                    isPhysicalItem(item.product.node.title)
                  );
                  if (!hasPhysical) return null;
                  return (
                    <p className="text-xs text-muted-foreground">
                      Taxes and shipping calculated at checkout.
                    </p>
                  );
                })()}
                <Button
                onClick={handleCheckout}
                className="w-full"
                size="lg"
                disabled={items.length === 0 || isLoading || isSyncing}>
                  {isLoading || isSyncing ?
                <Loader2 className="w-4 h-4 animate-spin" /> :
                <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {(() => {
                        const hasPreorder = items.some((item) =>
                          isPhysicalPreorderItem(item.product.node.title)
                        );
                        return hasPreorder ? "Reserve pre-order now" : "Checkout securely";
                      })()}
                    </>
                }
                </Button>
              </div>
            </>
          }
        </div>
      </SheetContent>
    </Sheet>);
};
