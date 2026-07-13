import { useEffect, useState } from "react";
import { Plus, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";

interface DBRow {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_usd: number;
  price_pen: number | null;
  cover_image_url: string | null;
  active: boolean;
  is_upsell: boolean;
  sort_order: number;
}

const T = {
  es: { title: "Agrega más productos", sub: "Otros infoproductos de iLingue Relax", add: "Agregar", added: "En el carrito", toast: "Producto agregado al carrito" },
  en: { title: "Add more products", sub: "Other iLingue Relax infoproducts", add: "Add", added: "In cart", toast: "Product added to cart" },
  fr: { title: "Ajouter d'autres produits", sub: "Autres infoproduits iLingue Relax", add: "Ajouter", added: "Dans le panier", toast: "Produit ajouté au panier" },
  pt: { title: "Adicionar mais produtos", sub: "Outros infoprodutos iLingue Relax", add: "Adicionar", added: "No carrinho", toast: "Produto adicionado ao carrinho" },
} as const;

export function MoreProductsPanel({ excludeIds = [] as string[] }) {
  const [rows, setRows] = useState<DBRow[]>([]);
  const items = useCheckoutPruebaStore((s) => s.items);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const region = useRegionTier();
  const { language } = useI18n();
  const t = T[(language as keyof typeof T)] ?? T.es;
  const isPeru = (region.country || "").toUpperCase() === "PE";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("digital_products")
        .select("id, sku, name, description, price_usd, price_pen, cover_image_url, active, is_upsell, sort_order")
        .eq("active", true)
        .eq("is_upsell", false)
        .order("sort_order", { ascending: true });
      if (!cancelled && data) setRows(data as DBRow[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const excluded = new Set([...excludeIds]);
  const available = rows.filter((r) => !excluded.has(r.sku) && !excluded.has(r.id));

  if (available.length === 0) return null;

  const fmt = (usd: number, pen: number | null) => {
    if (isPeru && pen && pen > 0) return `S/ ${Number(pen).toFixed(2)}`;
    return `$${Number(usd).toFixed(2)}`;
  };

  const handleAdd = (r: DBRow) => {
    addItem({
      id: r.sku,
      name: r.name,
      price: Number(r.price_usd) || 0,
      pricePen: r.price_pen ? Number(r.price_pen) : undefined,
      image: r.cover_image_url || "/placeholder.svg",
      description: r.description || "",
      quantity: 1,
    });
    toast.success(t.toast);
  };

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <header className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold leading-tight">{t.title}</h3>
          <p className="text-xs text-muted-foreground">{t.sub}</p>
        </div>
      </header>

      <ul className="divide-y">
        {available.slice(0, 6).map((r) => {
          const inCart = items.some((i) => i.id === r.sku);
          return (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <img
                src={r.cover_image_url || "/placeholder.svg"}
                alt={r.name}
                loading="lazy"
                className="w-12 h-12 rounded-md object-cover border shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug line-clamp-2">{r.name}</p>
                <p className="text-sm font-semibold text-primary mt-0.5">
                  {fmt(Number(r.price_usd), r.price_pen)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(r)}
                disabled={inCart}
                className={`shrink-0 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  inCart
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
                aria-label={inCart ? t.added : `${t.add}: ${r.name}`}
              >
                {inCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {inCart ? t.added : t.add}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
