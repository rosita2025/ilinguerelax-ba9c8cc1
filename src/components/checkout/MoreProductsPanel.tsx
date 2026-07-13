import { useEffect, useState } from "react";
import { Plus, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";
import { CHECKOUT_CATALOG, type UpsellItem } from "@/config/checkoutCatalog";

interface DBRow {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_usd: number;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
  price_pen: number | null;
  cover_image_url: string | null;
  active: boolean;
  is_upsell: boolean;
  sort_order: number;
}

const T = {
  es: { title: "Agrega más productos", sub: "Descuentos automáticos si aplica", add: "Agregar", added: "En el carrito", toast: "Producto agregado al carrito", auto: "Descuento automático" },
  en: { title: "Add more products", sub: "Automatic discounts when available", add: "Add", added: "In cart", toast: "Product added to cart", auto: "Automatic discount" },
  fr: { title: "Ajouter d'autres produits", sub: "Remises automatiques si disponibles", add: "Ajouter", added: "Dans le panier", toast: "Produit ajouté au panier", auto: "Remise automatique" },
  pt: { title: "Adicionar mais produtos", sub: "Descontos automáticos quando disponíveis", add: "Adicionar", added: "No carrinho", toast: "Produto adicionado ao carrinho", auto: "Desconto automático" },
} as const;

interface Props {
  excludeIds?: string[];
  upsells?: UpsellItem[];
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function MoreProductsPanel({ excludeIds = [] as string[], upsells = [] }: Props) {
  const [rows, setRows] = useState<DBRow[]>([]);
  const items = useCheckoutPruebaStore((s) => s.items);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const syncItem = useCheckoutPruebaStore((s) => s.syncItem);
  const region = useRegionTier();
  const { language } = useI18n();
  const t = T[(language as keyof typeof T)] ?? T.es;
  const isPeru = (region.country || "").toUpperCase() === "PE";
  const isTiendaUsd = ["VE", "CU", "NI"].includes((region.country || "").toUpperCase());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("digital_products")
        .select("id, sku, name, description, price_usd, price_usd_latam, price_usd_tienda, price_pen, cover_image_url, active, is_upsell, sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (!cancelled && data) setRows(data as DBRow[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const excluded = new Set([...excludeIds]);
  const available = rows.filter((r) => !excluded.has(r.sku) && !excluded.has(r.id));

  const discountFor = (r: DBRow) => {
    const match = upsells.find((u) => u.id === r.sku || u.id === r.id);
    if (!match?.originalPrice || match.originalPrice <= match.price) return 0;
    return Math.max(0, Math.min(95, (match.originalPrice - match.price) / match.originalPrice));
  };

  const regionalUsd = (r: DBRow) => {
    if (isTiendaUsd && r.price_usd_tienda && Number(r.price_usd_tienda) > 0) return Number(r.price_usd_tienda);
    if (region.tier === "latam" && r.price_usd_latam && Number(r.price_usd_latam) > 0) return Number(r.price_usd_latam);
    return Number(r.price_usd) || 0;
  };

  const pricedItem = (r: DBRow) => {
    const discount = discountFor(r);
    const factor = 1 - discount;
    const global = roundMoney((Number(r.price_usd) || 0) * factor);
    const latam = r.price_usd_latam && Number(r.price_usd_latam) > 0
      ? roundMoney(Number(r.price_usd_latam) * factor)
      : global;
    const tienda = r.price_usd_tienda && Number(r.price_usd_tienda) > 0
      ? roundMoney(Number(r.price_usd_tienda) * factor)
      : undefined;
    const pen = r.price_pen && Number(r.price_pen) > 0
      ? roundMoney(Number(r.price_pen) * factor)
      : undefined;
    return {
      discount,
      displayUsd: roundMoney(regionalUsd(r) * factor),
      originalDisplayUsd: regionalUsd(r),
      price: global,
      pricePen: pen,
      regionPrices: { latam, global, ...(tienda != null ? { tienda } : {}) },
    };
  };

  useEffect(() => {
    available.forEach((r) => {
      const current = items.find((i) => i.id === r.sku);
      const priced = pricedItem(r);
      if (!current || priced.discount <= 0) return;
      const priceChanged = current.price !== priced.price || current.pricePen !== priced.pricePen;
      const regionChanged = JSON.stringify(current.regionPrices ?? {}) !== JSON.stringify(priced.regionPrices);
      if (priceChanged || regionChanged) {
        syncItem({
          id: r.sku,
          name: r.name,
          price: priced.price,
          pricePen: priced.pricePen,
          regionPrices: priced.regionPrices,
          image: r.cover_image_url || "/placeholder.svg",
          description: r.description || "",
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, upsells, items.length, region.tier, region.country]);

  if (available.length === 0) return null;

  const fmt = (usd: number, pen?: number | null) => {
    if (isPeru && pen && pen > 0) return `S/ ${Number(pen).toFixed(2)}`;
    return `$${Number(usd).toFixed(2)}`;
  };

  const handleAdd = (r: DBRow) => {
    const priced = pricedItem(r);
    addItem({
      id: r.sku,
      name: r.name,
      price: priced.price,
      pricePen: priced.pricePen,
      regionPrices: priced.regionPrices,
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
          const priced = pricedItem(r);
          const hasDiscount = priced.discount > 0;
          const discountPct = Math.round(priced.discount * 100);
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
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {hasDiscount && (
                    <span className="text-xs text-muted-foreground line-through">
                      {fmt(priced.originalDisplayUsd, r.price_pen)}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-primary">
                    {fmt(priced.displayUsd, priced.pricePen)}
                  </p>
                </div>
                {hasDiscount && (
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                    {t.auto} · -{discountPct}%
                  </p>
                )}
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
