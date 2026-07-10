import { useMemo } from "react";
import { Check, Plus, Sparkles, Tag } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutPruebaStore";
import type { UpsellItem } from "@/config/checkoutCatalog";

interface Props {
  upsells: UpsellItem[];
}

export function UpsellPanel({ upsells }: Props) {
  const items = useCheckoutPruebaStore((s) => s.items);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const removeItem = useCheckoutPruebaStore((s) => s.removeItem);

  const totalSavings = useMemo(() => {
    return upsells.reduce((sum, u) => {
      const added = items.some((i) => i.id === u.id);
      if (added && u.originalPrice && u.originalPrice > u.price) {
        return sum + (u.originalPrice - u.price);
      }
      return sum;
    }, 0);
  }, [upsells, items]);

  if (!upsells?.length) return null;

  return (
    <div className="rounded-xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 sm:p-5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">
              Agrega a tu pedido y ahorra
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Solo disponible en esta compra
            </p>
          </div>
        </div>
        {totalSavings > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">
            <Tag className="w-3 h-3" /> Ahorras ${totalSavings.toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {upsells.map((u) => {
          const added = items.some((i) => i.id === u.id);
          const hasDiscount = u.originalPrice && u.originalPrice > u.price;
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
                    price: u.price,
                    image: u.image,
                    description: u.description,
                    quantity: 1,
                  });
                }
              }}
              className={`w-full text-left flex items-center gap-3 rounded-lg border-2 p-2.5 sm:p-3 transition-all ${
                added
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-background hover:border-primary/60 hover:bg-primary/[0.03]"
              }`}
            >
              <span
                className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${
                  added
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40 bg-background"
                }`}
              >
                {added ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <Plus className="w-4 h-4 text-muted-foreground" />
                )}
              </span>

              <div className="relative shrink-0">
                <img
                  src={u.image}
                  alt=""
                  className="w-14 h-14 rounded-md object-cover bg-muted"
                  loading="lazy"
                />
                {hasDiscount && (
                  <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-black leading-none px-1.5 py-0.5 rounded shadow">
                    -{percentOff}%
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm leading-tight line-clamp-2">
                    {u.name}
                  </p>
                  {u.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                      {u.badge}
                    </span>
                  )}
                </div>
                {u.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {u.description}
                  </p>
                )}
                <p
                  className={`text-[11px] font-semibold mt-1 ${
                    added ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {added ? "✓ Añadido a tu pedido · toca para quitar" : "Toca para agregar"}
                </p>
              </div>

              <div className="text-right shrink-0">
                {hasDiscount && (
                  <p className="text-[11px] text-muted-foreground line-through leading-none">
                    ${u.originalPrice!.toFixed(2)}
                  </p>
                )}
                <p
                  className={`font-black text-base sm:text-lg leading-tight ${
                    added ? "text-primary" : "text-foreground"
                  }`}
                >
                  +${u.price.toFixed(2)}
                </p>
                {hasDiscount && (
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                    Ahorras ${(u.originalPrice! - u.price).toFixed(2)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-center text-muted-foreground pt-1">
        🔒 Se cobra junto con tu pedido · entrega inmediata por email
      </p>
    </div>
  );
}
