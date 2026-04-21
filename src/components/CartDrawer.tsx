import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2, Tag, X, Check } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { CartUpsell } from "@/components/CartUpsell";

// Hotmart checkout URL mapping for digital products
const HOTMART_CHECKOUT_MAP: Record<string, string> = {
  "gid://shopify/ProductVariant/43094791454781": "https://pay.hotmart.com/U103990323W?checkoutMode=10&bid=1775682596079", // 8,000 Palabras Digital
  "gid://shopify/ProductVariant/43062338191421": "https://pay.hotmart.com/T102978081M?bid=1775682831595", // 1,000 Verbos Digital
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
    // Check if any item has a Hotmart checkout URL
    const hotmartItem = items.find(item => HOTMART_CHECKOUT_MAP[item.variantId]);
    if (hotmartItem) {
      window.open(HOTMART_CHECKOUT_MAP[hotmartItem.variantId], '_blank');
      setDrawerOpen(false);
      return;
    }
    // Fallback to Shopify checkout for physical products
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
      setDrawerOpen(false);
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

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 &&
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          }
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
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
                <p className="text-muted-foreground">Tu carrito está vacío</p>
              </div>
            </div> :
          <>
              {/* Free shipping progress bar */}
              {(() => {
                // Hide free shipping bar if cart only has digital products (no physical books)
                const PHYSICAL_KEYWORDS = ["LIBRO FISICO", "libro fisico", "Libro Físico"];
                const hasPhysical = items.some((item) =>
                  PHYSICAL_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
                );
                if (!hasPhysical) return null;
                const FREE_SHIPPING_MIN = 45;
                const progress = Math.min((subtotalPrice / FREE_SHIPPING_MIN) * 100, 100);
                const remaining = Math.max(FREE_SHIPPING_MIN - subtotalPrice, 0);
                return (
                  <div className="flex-shrink-0 mb-3">
                    {remaining > 0 ? (
                      <p className="text-xs text-muted-foreground mb-1.5">
                        🚚 ¡Te faltan <span className="font-bold text-foreground">${remaining.toFixed(2)}</span> para envío GRATIS!
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-green-600 mb-1.5">
                        ✅ ¡Tienes envío GRATIS!
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
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) =>
                <div key={item.variantId} className="flex gap-4 p-2 border rounded-lg">
                      <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0">
                        {item.product.node.images?.edges?.[0]?.node &&
                    <img
                      src={item.product.node.images.edges[0].node.url}
                      alt={item.product.node.title}
                      className="w-full h-full object-cover" />
                    }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm">{item.product.node.title}</h4>
                        {item.variantTitle !== "Default Title" &&
                    <p className="text-xs text-muted-foreground">{item.variantTitle}</p>
                    }
                        <p className="font-semibold text-sm mt-1">
                          ${parseFloat(item.price.amount).toFixed(2)} {item.price.currencyCode}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeItem(item.variantId)}
                      disabled={isLoading}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        disabled={isLoading}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
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
                        {appliedDiscount.code} — se aplica al pagar
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
                        placeholder="Código de cupón"
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
                      {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aplicar"}
                    </Button>
                  </div>
                )}

                {(() => {
                  const PHYSICAL_KEYWORDS = ["LIBRO FISICO", "libro fisico", "Libro Físico"];
                  const hasPhysical = items.some((item) =>
                    PHYSICAL_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
                  );
                  if (!hasPhysical) return null;
                  return (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>📦 Envío internacional disponible</p>
                      <p>⏱ Entrega estimada: 12–15 días</p>
                    </div>
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
                  const PHYSICAL_KEYWORDS = ["LIBRO FISICO", "libro fisico", "Libro Físico"];
                  const hasPhysical = items.some((item) =>
                    PHYSICAL_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
                  );
                  if (!hasPhysical) return null;
                  return (
                    <p className="text-xs text-muted-foreground">
                      Los impuestos y los gastos de envío se calculan al finalizar la compra.
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
                        const PHYSICAL_KEYWORDS = ["LIBRO FISICO", "libro fisico", "Libro Físico"];
                        const hasPhysical = items.some((item) =>
                          PHYSICAL_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
                        );
                        return hasPhysical ? "Continuar al pago" : "Checkout securely";
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
