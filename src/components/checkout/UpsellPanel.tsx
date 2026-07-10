import { Check, Plus } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutPruebaStore";
import type { UpsellItem } from "@/config/checkoutCatalog";

interface Props {
  upsells: UpsellItem[];
}

export function UpsellPanel({ upsells }: Props) {
  const items = useCheckoutPruebaStore((s) => s.items);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const removeItem = useCheckoutPruebaStore((s) => s.removeItem);

  if (!upsells?.length) return null;

  return (
    <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
          +
        </span>
        <h3 className="font-bold text-sm sm:text-base">
          Agrega a tu pedido y ahorra
        </h3>
      </div>

      <div className="space-y-2.5">
        {upsells.map((u) => {
          const added = items.some((i) => i.id === u.id);
          return (
            <button
              key={u.id}
              type="button"
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
              className={`w-full text-left flex items-center gap-3 rounded-lg border p-2.5 sm:p-3 transition ${
                added
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/60"
              }`}
            >
              <span
                className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                  added
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-muted-foreground" />}
              </span>

              <img
                src={u.image}
                alt=""
                className="w-12 h-12 rounded object-cover shrink-0 bg-muted"
                loading="lazy"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm leading-tight line-clamp-2">
                    {u.name}
                  </p>
                  {u.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
                      {u.badge}
                    </span>
                  )}
                </div>
                {u.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {u.description}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-primary text-sm sm:text-base">
                  +${u.price.toFixed(2)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
