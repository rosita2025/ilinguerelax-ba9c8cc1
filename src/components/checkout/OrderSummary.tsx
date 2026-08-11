import { useState } from "react";
import { Minus, Plus, Trash2, Tag, X, ChevronDown, ChevronUp, MapPin, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCheckoutPruebaStore, calcTotals, itemPrice, calcTotalsPen, formatPen } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useLocalCurrency, formatLocalAmount, useSkuOverridesResolver, sumItemsLocal, formatLocalDirect } from "@/hooks/useLocalCurrency";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import { formatCurrencyAmount } from "@/i18n";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { DigitalProductNotice } from "@/components/DigitalProductNotice";
import { Skeleton } from "@/components/ui/skeleton";



interface OrderSummaryProps {
  collapsible?: boolean;
  /** When true, hides quantity +/- and remove buttons (fixed single-product checkout). */
  locked?: boolean;
  /** Main product id — its remove/trash button is hidden so it cannot be deleted. */
  mainProductId?: string;
  /** Notified when the mobile collapsible expands/collapses (for sticky wrapper). */
  onExpandedChange?: (expanded: boolean) => void;
}

export function OrderSummary({ collapsible = false, locked = false, mainProductId, onExpandedChange }: OrderSummaryProps) {

  const { items, coupon, couponPercent, updateQuantity, removeItem, applyCoupon, removeCoupon, selectedMethod } =
    useCheckoutPruebaStore();
  const region = useRegionTier();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!collapsible);
  const { subtotal, discount, total } = calcTotals(items, couponPercent, region.tier);
  const penTotals = calcTotalsPen(items, couponPercent, region.country || "");
  const overridesFor = useSkuOverridesResolver();
  const localTotal = useLocalCurrency(total);
  const localSubtotal = useLocalCurrency(subtotal);
  const localDiscount = useLocalCurrency(discount);
  const isGlobalGateway = selectedMethod && (
    selectedMethod.startsWith("stripe") || 
    selectedMethod.startsWith("dlocal") || 
    selectedMethod === "card" || 
    selectedMethod === "paypal" || 
    selectedMethod === "binance"
  );

  const penMode = penTotals !== null && !isGlobalGateway;
  const showLocalRef = !penMode && !localTotal.isUsd && !localTotal.loading && !isGlobalGateway;
  // Local totals honoring per-sku overrides from /admin/products/:sku
  const localItemsSum = sumItemsLocal(
    items.map((i) => ({ id: i.id, usd: itemPrice(i, region.tier), quantity: i.quantity || 1 })),
    region.country || "",
    overridesFor,
  );
  const localSubtotalAmount = localItemsSum.amount;
  const localTotalAmount = localSubtotalAmount * (1 - (couponPercent || 0) / 100);
  const localTotalLabel = showLocalRef ? formatLocalDirect(localTotalAmount, region.country || "") : formatCurrencyAmount(total, "USD");
  const fmtMoney = (usd: number, _local: { formatted: string }, penAmount?: number) =>
    penMode && penAmount != null
      ? formatPen(penAmount)
      : showLocalRef
        ? _local.formatted
        : formatCurrencyAmount(usd, "USD");
  void localSubtotal; void localDiscount;
  const hasRegionalItem = items.some((i) => i.regionPrices);


  const handleApplyCoupon = () => {
    setCouponError(null);
    const ok = applyCoupon(couponInput);
    if (!ok) setCouponError(t.invalidCoupon);
    else setCouponInput("");
  };

  const itemCount = items.reduce((n, i) => n + (i.quantity || 1), 0);

  return (
    <div className="bg-muted/30 lg:bg-muted/50 rounded-xl border overflow-hidden">
      {collapsible && (
        <button
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            onExpandedChange?.(next);
          }}
          className="w-full flex items-center justify-between px-4 py-3 lg:hidden bg-primary/5 hover:bg-primary/10 transition-colors border-b"
          aria-expanded={expanded}
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <span className="relative">
              <ShoppingBag className="w-5 h-5 text-primary" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </span>
            <span>{expanded ? t.hideSummary : t.showSummary}</span>
            {expanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
          </span>
          <span className="text-base font-bold">{penMode && penTotals ? formatPen(penTotals.total) : localTotalLabel}</span>
        </button>
      )}


      <div
        className={cn(
          "p-5 space-y-4",
          collapsible && !expanded && "hidden lg:block",
          collapsible && expanded && "lg:max-h-none max-h-[calc(100vh-160px)] overflow-y-auto",
        )}
      >

        <h2 className="hidden lg:block text-lg font-semibold">{t.yourOrder}</h2>

        <DigitalProductNotice />


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
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  )}
                  {!locked && item.id !== mainProductId && (
                    <div className="flex items-center justify-end mt-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        aria-label="Quitar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold shrink-0 text-right">
                  {penMode && item.pricePen != null
                    ? formatPen(item.pricePen)
                    : showLocalRef
                      ? formatLocalAmount(itemPrice(item, region.tier), region.country, overridesFor(item.id)).formatted
                      : formatCurrencyAmount(itemPrice(item, region.tier), "USD")}
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
            <span>{penMode && penTotals ? formatPen(penTotals.subtotal) : showLocalRef ? formatLocalDirect(localSubtotalAmount, region.country || "") : formatCurrencyAmount(subtotal, "USD")}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>{t.discount}</span>
              <span>-{penMode && penTotals ? formatPen(penTotals.discount) : showLocalRef ? formatLocalDirect(localSubtotalAmount - localTotalAmount, region.country || "") : formatCurrencyAmount(discount, "USD")}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>{t.taxes}</span>
            <span>{t.included}</span>
          </div>
          <div className="flex justify-between items-baseline text-base font-bold pt-2 border-t">
            <span>{t.total}</span>
            <div className="text-right">
              <div>{penMode ? formatPen(penTotals!.total) : showLocalRef ? localTotalLabel : formatCurrencyAmount(total, "USD")}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
