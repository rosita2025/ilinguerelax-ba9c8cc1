import { useState } from "react";
import { Minus, Plus, Trash2, Tag, X, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCheckoutPruebaStore, calcTotals, itemPrice } from "@/stores/checkoutPruebaStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useLocalCurrency, formatLocalAmount } from "@/hooks/useLocalCurrency";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";


interface OrderSummaryProps {
  collapsible?: boolean;
  /** When true, hides quantity +/- and remove buttons (fixed single-product checkout). */
  locked?: boolean;
}

export function OrderSummary({ collapsible = false, locked = false }: OrderSummaryProps) {
  const { items, coupon, couponPercent, updateQuantity, removeItem, applyCoupon, removeCoupon } =
    useCheckoutPruebaStore();
  const region = useRegionTier();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!collapsible);
  const { subtotal, discount, total } = calcTotals(items, couponPercent, region.tier);
  const localTotal = useLocalCurrency(total);
  const localSubtotal = useLocalCurrency(subtotal);
  const localDiscount = useLocalCurrency(discount);
  const useLocal = !localTotal.isUsd && !localTotal.loading;
  const fmtMoney = (usd: number, local: { formatted: string }) =>
    useLocal ? local.formatted : `$${usd.toFixed(2)}`;
  const hasRegionalItem = items.some((i) => i.regionPrices);


  const handleApplyCoupon = () => {
    setCouponError(null);
    const ok = applyCoupon(couponInput);
    if (!ok) setCouponError(t.invalidCoupon);
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
            {expanded ? t.hideSummary : t.showSummary}
          </span>
          <span className="text-lg font-bold">{fmtMoney(total, localTotal)}</span>
        </button>
      )}

      <div className={cn("p-5 space-y-4", collapsible && !expanded && "hidden lg:block")}>
        <h2 className="hidden lg:block text-lg font-semibold">{t.yourOrder}</h2>

        {/* Badge de región oculto al cliente (solo se aplica el precio por IP internamente) */}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {t.emptyCart}
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
                  {!locked && (
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
                  )}
                </div>
                <div className="text-sm font-semibold shrink-0 text-right">
                  {useLocal
                    ? formatLocalAmount(itemPrice(item, region.tier) * item.quantity, region.country).formatted
                    : `$${(itemPrice(item, region.tier) * item.quantity).toFixed(2)}`}
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
                aria-label={t.removeCoupon}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <Input
                  placeholder={t.couponPlaceholder}
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
                  {t.applyCoupon}
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
            <span>{t.subtotal}</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>{t.discount}</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>{t.taxes}</span>
            <span>{t.included}</span>
          </div>
          <div className="flex justify-between items-baseline text-base font-bold pt-2 border-t">
            <span>{t.total}</span>
            <div className="text-right">
              <div>USD ${total.toFixed(2)}</div>
              {!local.isUsd && !local.loading && (
                <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
                  ≈ {local.formatted} {t.inYourCurrency}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
