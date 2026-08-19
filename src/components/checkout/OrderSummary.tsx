import { useState, useMemo } from "react";
import { Minus, Plus, Trash2, Tag, X, ChevronDown, ChevronUp, MapPin, ShoppingBag, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCheckoutPruebaStore, calcTotals, itemPrice, calcTotalsPen, formatPen } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useLocalCurrency, formatLocalAmount, useSkuOverridesResolver, sumItemsLocal, formatLocalDirect, useCurrencyBreakdown } from "@/hooks/useLocalCurrency";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import { formatCurrencyAmount, exchangeRates } from "@/i18n";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { DigitalProductNotice } from "@/components/DigitalProductNotice";
import { Skeleton } from "@/components/ui/skeleton";
import { useCheckoutTotal } from "@/hooks/useCheckoutTotal";



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
  const country = region.country?.toUpperCase() || "";
  const isLatam = ["AR", "BO", "BR", "CL", "CO", "CR", "DO", "EC", "SV", "GT", "HN", "MX", "PA", "PY", "PE", "PR", "UY"].includes(country);
  const isNorthAmericaEurope = ["US", "CA", "GB"].includes(country);
  const isAsia = ["CN", "JP", "KR", "IN", "SG", "MY", "TH", "VN", "PH", "ID"].includes(country);

  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!collapsible);

  const overridesFor = useSkuOverridesResolver();
  const shippingCostUSD = isLatam ? 9 : 8; // Centralized: $9 LATAM, $8 Rest of World

  const { 
    subtotalLocal, 
    discountLocal, 
    shippingLocal, 
    totalLocal, 
    totalUsd,
    currency 
  } = useCheckoutTotal(
    items, 
    couponPercent, 
    region.tier, 
    country, 
    shippingCostUSD, 
    overridesFor
  );

  const totals = useMemo(() => calcTotals(items, couponPercent, region.tier), [items, couponPercent, region.tier]);
  const { subtotal, discount, total } = totals;
  const shipping = items.some((i) => i.isPhysical) ? (subtotal >= 50 ? 0 : shippingCostUSD) : 0;
  const grandTotal = total + shipping;

  const penTotals = calcTotalsPen(items, couponPercent, country);
  const isGlobalGateway = selectedMethod && (
    selectedMethod.startsWith("stripe") || 
    selectedMethod.startsWith("dlocal") || 
    selectedMethod === "card" || 
    selectedMethod === "paypal" || 
    selectedMethod === "binance" ||
    selectedMethod === "clabe" ||
    selectedMethod === "yape" ||
    selectedMethod === "transfer"
  );

  const penMode = penTotals !== null && !isGlobalGateway;
  const showLocalRef = currency !== "USD";

  const localTotalLabel = formatLocalDirect(totalLocal, country);
  const currentUsdRef = totalUsd;
  const breakdown = useCurrencyBreakdown(totalLocal / (exchangeRates[currency] || 1), null, items[0]?.localUsdPrices);




  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    const ok = applyCoupon(code);
    if (!ok) {
      setCouponError(t.invalidCoupon);
    } else {
      setCouponInput("");
      toast.success(language === "en" ? "Coupon applied!" : "¡Cupón aplicado!");
    }
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
          <span className="text-right flex flex-col items-end">
            <span className="text-base font-bold leading-tight">
              {penMode && penTotals ? formatPen(penTotals.total) : localTotalLabel}
            </span>
            {showLocalRef && !breakdown.isUsd && (
              <span className="text-[10px] font-normal text-muted-foreground leading-none">
                  ≈ USD ${currentUsdRef.toFixed(2)}
              </span>
            )}
          </span>
        </button>
      )}


      <div
        className={cn(
          "p-5 space-y-4",
          collapsible && !expanded && "hidden lg:block",
          collapsible && expanded && "lg:max-h-none max-h-[calc(100vh-160px)] overflow-y-auto",
        )}
      >

        <h2 className="hidden lg:block text-lg font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          {t.yourOrder}
        </h2>

        {items.some(i => i.isPhysical) ? (
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 mb-2 ring-1 ring-destructive/20">
            <div className="flex gap-2.5 items-start">
              <Truck className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-destructive font-medium leading-snug">
                <strong className="font-bold uppercase tracking-tight">{t.physical}.</strong> {language === "en" ? "Mandatory: Name, Email, Phone and Shipping Address required." : "Obligatorio: Nombre, Email, Teléfono y Dirección de Envío."}
              </p>
            </div>
            <div className="text-[10px] space-y-1 pl-6 opacity-90 italic">
              {isLatam && <p className="text-destructive">{t.shippingNoticeLatam}</p>}
              {isNorthAmericaEurope && <p className="text-destructive">{t.shippingNoticeGlobal}</p>}
              {isAsia && (
                <div className="space-y-1">
                  <p className="text-destructive font-bold uppercase">{t.shippingNoticeAsia}</p>
                  <p className="text-destructive font-semibold text-[11px]">{t.digitalAlternativeSuggest}</p>
                </div>
              )}
              {!isLatam && !isNorthAmericaEurope && !isAsia && (
                <p className="text-destructive">{t.shippingNoticeGlobal}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 mb-2">
            <div className="flex gap-2.5 items-start">
              <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-muted-foreground leading-snug">
                <strong className="text-foreground font-semibold">{t.digital}.</strong> {language === "en" ? "Mandatory: Name, Email and Phone required for access." : "Obligatorio: Nombre, Email y Teléfono para recibir acceso."}
              </p>
            </div>
            <p className="text-[10px] pl-6 text-muted-foreground/80 italic">
              {language === "en" ? "Immediate access via email after payment." : "Recibirás el acceso inmediato por correo tras el pago."}
            </p>
          </div>
        )}


        {/* Badge de región oculto al cliente (solo se aplica el precio por IP internamente) */}

        {items.length === 0 ? (
          <div className="space-y-3 py-2">
            <div className="flex gap-3 items-center">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex gap-3 items-center">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
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
                    decoding="async"
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
                  {showLocalRef
                    ? (() => {
                        const { local_prices, local_usd_prices } = overridesFor(item.id);
                        return formatLocalAmount(itemPrice(item, region.tier), region.country, local_prices, local_usd_prices).formatted;
                      })()
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
            <span>{penMode && penTotals ? formatPen(penTotals.subtotal) : formatLocalDirect(subtotalLocal, country)}</span>
          </div>
          {discountLocal > 0 && (
            <div className="flex justify-between text-primary">
              <span>{t.discount}</span>
              <span>-{penMode && penTotals ? formatPen(penTotals.discount) : formatLocalDirect(discountLocal, country)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>{t.shipping}</span>
            <span>
              {items.some(i => i.isPhysical) 
                ? (shippingLocal === 0 ? t.freeShipping : formatLocalDirect(shippingLocal, country))
                : t.freeDigitalDelivery
              }
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>{t.taxes}</span>
            <span>{t.included}</span>
          </div>
          <div className="flex justify-between items-baseline text-base font-bold pt-2 border-t">
            <span>{t.total}</span>
            <div className="text-right">
              <div className="text-xl">{penMode && penTotals ? formatPen(penTotals.total) : localTotalLabel}</div>
              {showLocalRef && !breakdown.isUsd && (
                <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                  ≈ USD ${currentUsdRef.toFixed(2)}
                </div>
              )}
              
              {showLocalRef && !breakdown.isUsd && (
                <div className="mt-4 pt-4 border-t border-dashed space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    <span>{t.currencyBreakdown}</span>
                    <span className="text-primary/70">{breakdown.currency}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.baseUsd}</span>
                    <span className="font-medium text-foreground">${breakdown.baseUsd.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.exchangeRate}</span>
                    <span>1 USD = {breakdown.rate.toFixed(2)} {breakdown.currency}</span>
                  </div>

                  {breakdown.hasRegionalUsd && (
                    <div className="flex justify-between text-xs text-green-600 font-medium bg-green-50/50 px-2 py-1 rounded">
                      <span>{t.adjustment}</span>
                      <span>-${breakdown.adjustmentUsd.toFixed(2)} USD</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-muted/50">
                    <span>{t.localPrice}</span>
                    <span className="text-primary">{localTotalLabel}</span>
                  </div>
                  
                  {breakdown.hasRegionalUsd && (
                    <p className="text-[9px] text-muted-foreground italic leading-tight mt-1">
                      {t.localAdjustmentNotice}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>


        </div>
      </div>

    </div>
  );
}
