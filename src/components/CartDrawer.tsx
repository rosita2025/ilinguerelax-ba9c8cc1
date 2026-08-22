import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2, Tag, X, Check, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useCheckoutPruebaStore, itemPrice } from "@/stores/checkoutStore";
import { CHECKOUT_CATALOG } from "@/config/checkoutCatalog";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CartUpsell } from "@/components/CartUpsell";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";
import { trackGAEvent } from "@/hooks/useGoogleAnalytics";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { detectCurrency, formatCurrencyAmount } from "@/i18n";
import { useSkuOverridesResolver, sumItemsLocal, formatLocalDirect } from "@/hooks/useLocalCurrency";
import productSpanish5000Image from "@/assets/cart-spanish-5000-physical-phone.webp";
import { BLOCKED_VARIANTS, isBlockedVariant } from "@/config/blockedVariants";

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
  if (isDigital) return false;
  // Known digital upsells (sold as PDF even if title doesn't say it)
  const is1000Verbs = /1[\s,.]*000/.test(t) && t.includes("verb");
  const is500Questions = /500/.test(t) && (t.includes("question") || t.includes("pregunta"));
  if (is1000Verbs || is500Questions) return false;
  return true;
};
// Helper: detect physical pre-order books (3,000 Verbs only).
// 5,000 Spanish Relax and Grammar Patterns A1–C1 are already in stock and ship normally.
const isPhysicalPreorderItem = (title: string) => {
  if (!isPhysicalItem(title)) return false;
  const t = title.toLowerCase();
  const is3000Verbs = /3[\s,.]*000/.test(t) && t.includes("verb");
  return is3000Verbs;
};

export const CartDrawer = () => {
  const { currency, formatPrice, language } = useI18n();
  const t = getCheckoutUI(language);
  const { 
    items: rawItems, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, 
    syncCart, isDrawerOpen, setDrawerOpen, discountCodes, discountTotal,
    applyDiscount, removeDiscount, syncError, retrySync
  } = useCartStore();
  // Filter out phantom/deprecated Shopify variants immediately so they never render.
  const items = rawItems.filter((i) => !BLOCKED_VARIANTS.has(i.variantId));

  const navigate = useNavigate();
  const { tier, country } = useRegionTier();
  const internalItems = useCheckoutPruebaStore((s) => s.items);
  const removeInternal = useCheckoutPruebaStore((s) => s.removeItem);
  const updateInternalQty = useCheckoutPruebaStore((s) => s.updateQuantity);

  // Map internal item id -> checkout slug (first match wins)
  const slugByInternalId = (() => {
    const map: Record<string, string> = {};
    for (const [slug, cat] of Object.entries(CHECKOUT_CATALOG)) {
      if (!map[cat.id]) map[cat.id] = slug;
    }
    return map;
  })();

  // Only surface items that were added via product pages (i.e. have a matching checkout slug).
  // Default seeded items without a slug shouldn't clutter the site-wide drawer.
  const visibleInternalItems = internalItems.filter((i) => slugByInternalId[i.id]);
  const internalCount = visibleInternalItems.reduce((s, i) => s + i.quantity, 0);

  // Display currency for the cart drawer: derive from the visitor's IP country
  // (source of truth for pricing region) so LATAM / Europe / Anglosphere users
  // see their local currency automatically. Falls back to the manual currency
  // selector if country is not yet detected.
  const displayCurrency = country ? detectCurrency(country) : currency;

  // Peru: if every item has a native pricePen from admin, render Soles natively
  // (matches product page + checkout, avoids USD→PEN fx drift). Uses country
  // (IP) as source of truth so it works even if the currency selector is USD.
  const isPeru = (country || "").toUpperCase() === "PE";
  const showNativePen =
    isPeru &&
    visibleInternalItems.length > 0 &&
    visibleInternalItems.every((i) => typeof i.pricePen === "number" && (i.pricePen as number) > 0);

  const overridesFor = useSkuOverridesResolver();
  // Per-item local amount honoring admin overrides (digital_products.local_prices).
  const localItemAmount = (it: typeof visibleInternalItems[number]) => {
    const single = sumItemsLocal(
      [{ id: it.id, usd: itemPrice(it, tier), quantity: 1 }],
      country || "",
      overridesFor,
    );
    return single.amount;
  };
  const formatInternalUnit = (it: typeof visibleInternalItems[number]) => {
    if (showNativePen) return `${formatCurrencyAmount(it.pricePen as number, "PEN")} PEN`;
    const amt = localItemAmount(it);
    return `${formatLocalDirect(amt, country || "")} ${displayCurrency}`;
  };
  const internalSubtotal = showNativePen
    ? visibleInternalItems.reduce((s, i) => s + (i.pricePen as number) * i.quantity, 0)
    : sumItemsLocal(
        visibleInternalItems.map((i) => ({ id: i.id, usd: itemPrice(i, tier), quantity: i.quantity })),
        country || "",
        overridesFor,
      ).amount;
  const internalSubtotalLabel = showNativePen
    ? `${formatCurrencyAmount(internalSubtotal, "PEN")} PEN`
    : `${formatLocalDirect(internalSubtotal, country || "")} ${displayCurrency}`;

  const [couponInput, setCouponInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0) + internalCount;
  const subtotalPrice = items.reduce((sum, item) => sum + parseFloat(item.price.amount) * item.quantity, 0);

  const appliedDiscount = discountCodes.find(dc => dc.applicable);

  const goToInternalCheckout = () => {
    const first = visibleInternalItems[0];
    if (!first) return;
    const slug = slugByInternalId[first.id];
    if (!slug) return;
    setDrawerOpen(false);
    navigate(`/checkouts/${slug}`);
  };

  useEffect(() => {
    if (isDrawerOpen) syncCart();
  }, [isDrawerOpen, syncCart]);

  // Auto-remove phantom/deprecated Shopify line items on mount and whenever items change.
  useEffect(() => {
    rawItems.forEach((it) => {
      if (BLOCKED_VARIANTS.has(it.variantId)) {
        removeItem(it.variantId).catch(() => {});
      }
    });
  }, [rawItems, removeItem]);

  // Auto-apply free shipping when subtotal >= $45 and there's a physical item
  useEffect(() => {
    const hasPhysical = items.some(i => isPhysicalItem(i.product.node.title));
    const alreadyApplied = discountCodes.some(dc => dc.code === 'FREESHIP45' && dc.applicable);
    if (hasPhysical && subtotalPrice >= 45 && !alreadyApplied && !isApplying) {
      applyDiscount('FREESHIP45').catch(() => {});
    }
  }, [items, subtotalPrice, discountCodes, applyDiscount, isApplying]);

  useEffect(() => {
    const resetRedirectState = () => {
      if (document.visibilityState === "visible") {
        setIsRedirecting(false);
      }
    };

    window.addEventListener("pageshow", resetRedirectState);
    document.addEventListener("visibilitychange", resetRedirectState);

    return () => {
      window.removeEventListener("pageshow", resetRedirectState);
      document.removeEventListener("visibilitychange", resetRedirectState);
    };
  }, []);

  const waitForCartSettled = async (timeoutMs = 6000) => {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const state = useCartStore.getState();
      if (!state.isLoading && !state.isSyncing) return;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  };

  const attemptShopifyRedirect = async () => {
    let pageIsLeaving = false;

    const markPageLeaving = () => {
      pageIsLeaving = true;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pageIsLeaving = true;
      }
    };

    window.addEventListener("pagehide", markPageLeaving);
    window.addEventListener("beforeunload", markPageLeaving);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await waitForCartSettled();

        let checkoutUrl = useCartStore.getState().getCheckoutUrl();

        if (!checkoutUrl || attempt > 0) {
          try {
            await syncCart();
          } catch {}

          await waitForCartSettled(2500);
          checkoutUrl = useCartStore.getState().getCheckoutUrl();
        }

        if (!checkoutUrl) continue;

        window.location.assign(checkoutUrl);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (pageIsLeaving || document.visibilityState === "hidden") {
          return true;
        }
      }

      return false;
    } finally {
      window.removeEventListener("pagehide", markPageLeaving);
      window.removeEventListener("beforeunload", markPageLeaving);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };

  const handleCheckout = async () => {
    // Prevent double-clicks but DON'T require sync to finish — redirect immediately
    if (isRedirecting) return;
    setIsRedirecting(true);
    // Meta Pixel: InitiateCheckout
    try {
      trackHotmartEvent("InitiateCheckout", {
        content_name: items.map((i) => i.product.node.title).join(", "),
        content_ids: items.map((i) => i.variantId),
        content_type: "product",
        num_items: totalItems,
        value: subtotalPrice,
        currency: "USD", // Forzado a USD para Ads (Facebook/Instagram)
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
      window.location.href = HOTMART_CHECKOUT_MAP[hotmartItem.variantId];
      return;
    }
    // Fallback to Shopify checkout for physical products.
    const redirectWorked = await attemptShopifyRedirect();

    if (!redirectWorked) {
      setIsRedirecting(false);
      toast.error("Checkout no disponible", { description: "Intenta de nuevo en unos segundos." });
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
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          className="relative flex hover:bg-secondary transition-colors border-border h-10 w-10 sm:h-10 sm:w-10"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-card font-bold animate-in zoom-in duration-300">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-full sm:max-w-lg flex flex-col h-full z-[100]">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
          </SheetDescription>
          {totalItems > 0 && (() => {
            const miniReviews = [
              { name: "María G.", text: "Thank you, Spanish Relax is the best!!" },
              { name: "Lucas P.", text: "Amazing book, highly recommend 🙌" },
              { name: "Sophie R.", text: "Loved it! Best Spanish resource ever." },
              { name: "Daniel M.", text: "Spanish Relax changed my learning ❤️" },
            ];
            const r = miniReviews[Math.floor(Date.now() / 5000) % miniReviews.length];
            return (
              <div className="mt-1 flex items-center gap-2 px-2 py-1 bg-accent/10 border border-accent/20 rounded-md">
                <span className="text-xs text-amber-500 leading-none">★★★★★</span>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  <span className="font-semibold text-foreground">{r.name}:</span> "{r.text}"
                </p>
              </div>
            );
          })()}
        </SheetHeader>
        <div className="flex flex-col flex-1 pt-2 min-h-0">
          {/* Internal-checkout items (added from product pages via "Agregar al carrito") */}
          {visibleInternalItems.length > 0 && (
            <div className="flex-shrink-0 mb-3 border border-primary/30 rounded-lg p-2.5 bg-primary/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Digital · Checkout directo
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {internalCount} item{internalCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {visibleInternalItems.map((it) => {
                  return (
                    <div key={it.id} className="flex gap-2.5 items-center">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-secondary/20 flex-shrink-0">
                        <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-tight truncate">
                          {it.name}
                          <span className="ml-2 text-[9px] uppercase px-1 py-0.5 rounded bg-secondary/50 text-muted-foreground">
                            {it.isPhysical ? t.physical : t.digital}
                          </span>
                        </p>
                        <p className="text-[11px] text-primary font-bold">
                          {formatInternalUnit(it)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => removeInternal(it.id)}
                          aria-label="Quitar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/20">
                <span className="text-xs font-semibold">Subtotal</span>
                <span className="text-sm font-bold text-primary">
                  {internalSubtotalLabel}
                </span>
              </div>
              <Button
                onClick={goToInternalCheckout}
                className="w-full mt-2 h-10 text-sm font-bold"
              >
                {visibleInternalItems.some(i => i.isPhysical) ? t.configureShipping : t.securePayment}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          )}

          {items.length === 0 && visibleInternalItems.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          )}
          {items.length > 0 &&
          <></>}
          {items.length > 0 &&
          <>

              {/* Free shipping progress bar */}
              {syncError && (
                <div className="flex-shrink-0 mb-3 p-2.5 rounded-lg border-2 border-destructive/40 bg-destructive/5">
                  <p className="text-xs font-bold text-destructive leading-tight">⚠️ {syncError}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    Tus productos siguen guardados. No perderás el contenido del carrito.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs"
                    disabled={isSyncing || isLoading}
                    onClick={() => retrySync()}
                  >
                    {isSyncing ? "Reintentando…" : "Reintentar sincronización"}
                  </Button>
                </div>
              )}
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
                        🚚 You're <span className="font-bold text-foreground">{formatPrice(remaining)}</span> away from FREE shipping!
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
                          const isPhysical = isPhysicalItem(item.product.node.title);
                          return (
                            <>
                              <h4 className="font-semibold text-xs leading-tight truncate">{title}</h4>
                              {!isPhysical && (
                                <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border border-accent text-accent bg-accent/5 uppercase tracking-wide">
                                  📄 Digital PDF
                                </span>
                              )}
                              {isPhysical && !isPreorder && (
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
                                    {formatPrice(compareNum)}
                                  </span>
                                )}
                                <span className="text-xs font-bold text-primary">
                                  {formatPrice(price)}
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
              <div className="flex-shrink-0 space-y-1 pt-1.5 px-2 -mx-2 border-t border-border/60 bg-foreground/[0.04] dark:bg-background/80">
                {/* Coupon section - input hidden, only shows when discount already applied */}
                {appliedDiscount && (
                  <div className="flex items-center justify-between p-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        {appliedDiscount.code} — applied at checkout
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleRemoveCoupon} disabled={isLoading}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {(() => {
                  let savings = 0;
                  items.forEach((item) => {
                    const display = CART_ITEM_DISPLAY[item.variantId];
                    const compareAt = display?.compareAt ? parseFloat(display.compareAt) : null;
                    const price = parseFloat(item.price.amount);
                    if (compareAt && compareAt > price) savings += (compareAt - price) * item.quantity;
                  });
                  const compareTotal = subtotalPrice + savings;
                  const pct = savings > 0 ? Math.round((savings / compareTotal) * 100) : 0;
                  return (
                    <div className="flex justify-between items-baseline gap-2">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-sm font-semibold">Total</span>
                        {savings > 0 && (
                          <span className="text-[9px] font-bold bg-destructive/10 text-destructive px-1 py-px rounded shrink-0">
                            -{pct}%
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-bold leading-none">
                        {formatPrice(subtotalPrice)} {currency}
                      </span>
                    </div>
                  );
                })()}
                <Button
                onClick={handleCheckout}
                className="w-full transition-all h-11 min-h-11 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground ring-2 ring-primary/40 ring-offset-2 ring-offset-background shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.55)] hover:shadow-[0_12px_28px_-6px_hsl(var(--primary)/0.7)] hover:scale-[1.02] focus-visible:ring-primary aria-busy:opacity-90 aria-busy:cursor-progress"
                aria-busy={isRedirecting}
                aria-label={
                  isRedirecting
                    ? ((isLoading || isSyncing) ? "Sincronizando carrito, por favor espera" : "Redirigiendo al checkout seguro, por favor espera")
                    : undefined
                }
                disabled={items.length === 0 || isRedirecting}>
                  {isRedirecting ?
                <span className="flex items-center justify-center gap-2 leading-none" role="status" aria-live="polite">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
                  <span className="truncate" aria-hidden="true">
                    {(isLoading || isSyncing) ? "Syncing cart…" : "Redirecting…"}
                  </span>
                </span> :
                <span className="flex items-center justify-center gap-1.5 leading-none">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{(() => {
                        const hasPreorder = items.some((item) =>
                          isPhysicalPreorderItem(item.product.node.title)
                        );
                        return hasPreorder ? "Reserve pre-order now" : "Checkout securely";
                      })()}</span>
                    </span>
                }
                </Button>
                <div className="flex items-center justify-center gap-1 flex-nowrap max-w-full overflow-hidden">
                  <span className="text-[9px] text-muted-foreground shrink-0">🔒</span>
                    {[
                      { label: "Visa", bg: "bg-[#1a1f71]", color: "text-white" },
                      { label: "Mastercard", bg: "bg-white border border-border", color: "text-[#eb001b]" },
                      { label: "Amex", bg: "bg-[#2e77bb]", color: "text-white" },
                      { label: "Visa / MC", bg: "bg-primary", color: "text-white" },
                      { label: "Apple Pay", bg: "bg-black", color: "text-white" },
                      { label: "Google Pay", bg: "bg-white border border-border", color: "text-foreground" },
                      { label: "Shop Pay", bg: "bg-[#5a31f4]", color: "text-white" },
                    ].map((m) => (
                      <span
                        key={m.label}
                        className={`${m.bg} ${m.color} text-[6px] sm:text-[8px] font-bold px-1 py-px rounded leading-none shadow-sm whitespace-nowrap shrink-0`}
                      >
                        {m.label}
                      </span>
                    ))}
                </div>
              </div>
            </>
          }
        </div>
      </SheetContent>
    </Sheet>);
};
