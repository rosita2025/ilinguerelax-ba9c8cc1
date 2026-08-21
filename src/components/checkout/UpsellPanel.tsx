import { useEffect, useMemo } from "react";
import { Check, Plus, Sparkles, Tag } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useI18n } from "@/i18n/I18nContext";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";
import { useLocalOverrides } from "@/lib/livePrices";
import { formatCurrencyAmount } from "@/i18n";
import { useRegionTier } from "@/hooks/useRegionTier";
import type { UpsellItem } from "@/config/checkoutCatalog";

interface Props {
  upsells: UpsellItem[];
  /** SKU of the main product. Bundle discount only applies when it's in the cart. */
  mainProductId?: string;
}

/**
 * Muestra el precio en moneda local si aplica; si no, en USD.
 * Si el item tiene un `pen` nativo (precio real en soles) y el visitante es
 * de Perú, muestra ese precio EXACTO — así el panel y el resumen del pedido
 * nunca discrepan (evita el bug del 75 vs 29.75 soles).
 */
function Price({
  usd,
  pen,
  strike = false,
  emphasis = false,
  added = false,
  prefix = "",
  sku,
}: {
  usd: number;
  pen?: number;
  strike?: boolean;
  emphasis?: boolean;
  added?: boolean;
  prefix?: string;
  sku?: string;
}) {
  const { country } = useRegionTier();
  const overrides = useLocalOverrides(sku);
  const local = useLocalCurrency(usd, (overrides as any)?.local_prices, (overrides as any)?.local_usd_prices);
  const isPeru = country === "PE";

  let label: string;
  if (isPeru && typeof pen === "number" && pen > 0) {
    label = formatCurrencyAmount(pen, "PEN");
  } else if (!local.isUsd && !local.loading) {
    label = local.formatted;
  } else {
    label = formatCurrencyAmount(usd, "USD");
  }

  if (strike) {
    return (
      <p className="text-[11px] text-muted-foreground line-through leading-none">
        {label}
      </p>
    );
  }

  return (
    <p
      className={`font-black leading-tight ${
        emphasis ? "text-base sm:text-lg" : "text-sm"
      } ${added ? "text-primary" : "text-foreground"}`}
    >
      {prefix}
      {label}
    </p>
  );
}

function SavingsBadge({ usd }: { usd: number }) {
  const local = useLocalCurrency(usd);
  const { language } = useI18n();
  const label = !local.isUsd && !local.loading ? local.formatted : `$${usd.toFixed(2)}`;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">
      <Tag className="w-3 h-3" /> {language === "en" ? "Save" : "Ahorras"} {label}
    </span>
  );
}

function SavingsInline({ usd }: { usd: number }) {
  const local = useLocalCurrency(usd);
  const { language } = useI18n();
  const label = !local.isUsd && !local.loading ? local.formatted : `$${usd.toFixed(2)}`;
  return (
    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
      {language === "en" ? "Save" : "Ahorras"} {label}
    </p>
  );
}

export function UpsellPanel({ upsells, mainProductId }: Props) {
  const items = useCheckoutPruebaStore((s) => s.items);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const removeItem = useCheckoutPruebaStore((s) => s.removeItem);
  const syncItem = useCheckoutPruebaStore((s) => s.syncItem);
  const { language } = useI18n();

  // Bundle discount only applies while the main product stays in the cart.
  // If the buyer removes the main product, upsells stay in the cart but are
  // charged at their normal (non-bundle) price = originalPrice when it exists.
  const mainInCart = mainProductId
    ? items.some((i) => i.id === mainProductId)
    : true;

  const effectivePrice = (u: UpsellItem) =>
    mainInCart ? u.price : (u.originalPrice ?? u.price);

  // Keep any upsell already in the cart repriced to the effective price so the
  // order total reflects the bundle rule in real time (add/remove main product).
  useEffect(() => {
    upsells.forEach((u) => {
      const inCart = items.find((i) => i.id === u.id);
      if (!inCart) return;
      const target = effectivePrice(u);
      if (inCart.price !== target) {
        syncItem({
          id: u.id,
          name: u.name,
          price: target,
          pricePen: u.pricePen,
          image: u.image,
          description: u.description,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainInCart, upsells, items.length]);

  const totalSavings = useMemo(() => {
    if (!mainInCart) return 0;
    return upsells.reduce((sum, u) => {
      const added = items.some((i) => i.id === u.id);
      if (added && u.originalPrice && u.originalPrice > u.price) {
        return sum + (u.originalPrice - u.price);
      }
      return sum;
    }, 0);
  }, [upsells, items, mainInCart]);

  if (!upsells?.length) return null;

  return (
    <div className="rounded-xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-3 sm:p-4 space-y-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-primary text-primary-foreground">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <h3 className="font-bold text-sm leading-tight truncate">
            {language === "en" ? "Add to your order and save" : "Agrega a tu pedido y ahorra"}
          </h3>
        </div>
        {totalSavings > 0 && <SavingsBadge usd={totalSavings} />}
      </div>

      <div className="space-y-2">

        {upsells.map((u) => {
          const added = items.some((i) => i.id === u.id);
          const shownPrice = effectivePrice(u);
          const hasDiscount =
            mainInCart && !!u.originalPrice && u.originalPrice > u.price;
          const percentOff = hasDiscount
            ? Math.round(((u.originalPrice! - u.price) / u.originalPrice!) * 100)
            : 0;

          return (
            <button
              key={u.id}
              type="button"
              aria-pressed={added}
              onClick={() => {
                if (added) {
                  removeItem(u.id);
                } else {
                  addItem({
                    id: u.id,
                    name: u.name,
                    price: shownPrice,
                    pricePen: u.pricePen,
                    image: u.image,
                    description: u.description,
                    quantity: 1,
                  });
                }
              }}
              className={`w-full text-left flex items-center gap-2.5 rounded-lg border-2 p-2 transition-all ${
                added
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-background hover:border-primary/60 hover:bg-primary/[0.03]"
              }`}
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                  added
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40 bg-background"
                }`}
              >
                {added ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </span>

              <div className="relative shrink-0">
                <img
                  src={u.image}
                  alt=""
                  className="w-11 h-11 rounded-md object-cover bg-muted"
                  loading="lazy"
                />
                {hasDiscount && (
                  <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-black leading-none px-1 py-0.5 rounded shadow">
                    -{percentOff}%
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-[13px] leading-tight line-clamp-2">
                    {u.name}
                  </p>
                  {u.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                      {u.badge}
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] font-semibold ${
                    added ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {added 
                    ? (language === "en" ? "✓ Added · tap to remove" : "✓ Añadido · toca para quitar")
                    : (language === "en" ? "Tap to add" : "Toca para agregar")}
                </p>
              </div>

              <div className="text-right shrink-0">
                {hasDiscount && <Price usd={u.originalPrice!} strike sku={u.id} />}
                <Price usd={shownPrice} pen={u.pricePen} emphasis added={added} prefix="+" sku={u.id} />
              </div>
            </button>
          );
        })}
      </div>
    </div>

  );
}
