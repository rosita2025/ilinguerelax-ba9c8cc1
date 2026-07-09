import { useState } from "react";
import { Minus, Plus, Trash2, Tag, X, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCheckoutPruebaStore, calcTotals, itemPrice } from "@/stores/checkoutPruebaStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { cn } from "@/lib/utils";

interface OrderSummaryProps {
  collapsible?: boolean;
}

export function OrderSummary({ collapsible = false }: OrderSummaryProps) {
  const { items, coupon, couponPercent, updateQuantity, removeItem, applyCoupon, removeCoupon } =
    useCheckoutPruebaStore();
  const region = useRegionTier();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!collapsible);
  const { subtotal, discount, total } = calcTotals(items, couponPercent, region.tier);
  const hasRegionalItem = items.some((i) => i.regionPrices);

  const handleApplyCoupon = () => {
    setCouponError(null);
    const ok = applyCoupon(couponInput);
    if (!ok) setCouponError("Cupón inválido");
    else setCouponInput("");
  };

  return (
    <div className="bg-muted/30 lg:bg-muted/50 rounded-xl border">
      {collapsible && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 lg:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? "Ocultar resumen" : "Ver resumen"}
          </span>
          <span className="text-lg font-bold">${total.toFixed(2)}</span>
        </button>
      )}

      <div className={cn("p-5 space-y-4", collapsible && !expanded && "hidden lg:block")}>
        <h2 className="hidden lg:block text-lg font-semibold">Tu pedido</h2>

        {hasRegionalItem && !region.loading && (
          <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>{region.country || "Global"}</strong> detectado ·
              Precio {region.tier === "latam" ? "Latinoamérica 🌎" : "Internacional 🌍"} aplicado por IP
            </span>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Carrito vacío
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="relative shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg border"
                    loading="lazy"
                  />
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xs w-6 text-center">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm font-semibold shrink-0 text-right">
                  ${(itemPrice(item, region.tier) * item.quantity).toFixed(2)}
                  {item.regionPrices && (
                    <div className="text-[10px] font-normal text-muted-foreground">
                      {region.tier === "latam" ? "🌎 LatAm" : "🌍 Internacional"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          {coupon ? (
            <div className="flex items-center justify-between bg-primary/10 text-primary text-sm rounded-md px-3 py-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Tag className="w-3.5 h-3.5" />
                {coupon} · -{couponPercent}%
              </span>
              <button
                onClick={removeCoupon}
                type="button"
                className="opacity-70 hover:opacity-100"
                aria-label="Quitar cupón"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <Input
                  placeholder="Código de descuento"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponError(null);
                  }}
                  maxLength={20}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim()}
                >
                  Aplicar
                </Button>
              </div>
              {couponError && (
                <p className="text-xs text-destructive mt-1">{couponError}</p>
              )}
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>Descuento</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>Impuestos</span>
            <span>Incluidos</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t">
            <span>Total</span>
            <span>USD ${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
