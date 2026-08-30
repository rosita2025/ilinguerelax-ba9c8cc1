import { useEffect, useState } from "react";
import { Plus, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";
import { CHECKOUT_CATALOG } from "@/config/checkoutCatalog";
import { formatLocalAmount, useSkuOverridesResolver } from "@/hooks/useLocalCurrency";
import { formatCurrencyAmount } from "@/i18n";

interface DBRow {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_usd: number;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
  local_prices: Record<string, number> | null;
  cover_image_url: string | null;
}

interface UpsellRow extends DBRow {
  discount_pct: number;
}

const T = {
  es: { title: "Ofertas exclusivas para este pedido", sub: "Solo hoy con descuento automático", add: "Agregar", added: "En el carrito", toast: "Producto agregado con descuento", auto: "Descuento" },
  en: { title: "Exclusive offers for this order", sub: "Today only with automatic discount", add: "Add", added: "In cart", toast: "Product added with discount", auto: "Discount" },
  fr: { title: "Offres exclusives pour cette commande", sub: "Aujourd'hui seulement avec remise automatique", add: "Ajouter", added: "Dans le panier", toast: "Produit ajouté avec remise", auto: "Remise" },
  pt: { title: "Ofertas exclusivas para este pedido", sub: "Só hoje com desconto automático", add: "Adicionar", added: "No carrinho", toast: "Produto adicionado com desconto", auto: "Desconto" },
} as const;

interface Props {
  /** admin sku of the main product to fetch its configured upsells */
  parentSku?: string | null;
}

const roundMoney = (v: number) => Math.round(v * 100) / 100;

export function MoreProductsPanel({ parentSku }: Props) {
  const [upsells, setUpsells] = useState<UpsellRow[]>([]);
  const items = useCheckoutPruebaStore((s) => s.items);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const syncItem = useCheckoutPruebaStore((s) => s.syncItem);
  const region = useRegionTier();
  const { language } = useI18n();
  const t = T[(language as keyof typeof T)] ?? T.es;
  const isPeru = (region.country || "").toUpperCase() === "PE";
  const isTiendaUsd = ["VE", "CU", "NI"].includes((region.country || "").toUpperCase());

  useEffect(() => {
    if (!parentSku) { setUpsells([]); return; }
    let cancelled = false;
    (async () => {
      const { data: links } = await supabase
        .from("product_upsells")
        .select("upsell_sku, discount_pct, sort_order")
        .eq("product_sku", parentSku)
        .order("sort_order", { ascending: true });
      if (!links || links.length === 0) { if (!cancelled) setUpsells([]); return; }
      const skus = links.map((l: any) => l.upsell_sku);
      const { data: prods } = await supabase
        .from("digital_products")
        .select("id, sku, name, description, price_usd, price_usd_latam, price_usd_tienda, local_prices, cover_image_url, active")
        .in("sku", skus)
        .eq("active", true);
      if (cancelled) return;
      const rows: UpsellRow[] = links
        .map((l: any) => {
          const p = (prods || []).find((x: any) => x.sku === l.upsell_sku);
          return p ? { ...(p as DBRow), discount_pct: Number(l.discount_pct) || 0 } : null;
        })
        .filter(Boolean) as UpsellRow[];
      setUpsells(rows);
    })();
    return () => { cancelled = true; };
  }, [parentSku]);

  // Auto-apply upsell discount to matching items already in cart
  useEffect(() => {
    if (upsells.length === 0 || items.length === 0) return;
    const country = (region.country || "").toUpperCase();
    const isPE = country === "PE";
    const isTienda = ["VE", "CU", "NI"].includes(country);
    upsells.forEach((r) => {
      const factor = 1 - Math.max(0, Math.min(95, r.discount_pct)) / 100;
      if (factor >= 1) return;
      const equivIds = new Set<string>([r.sku]);
      Object.values(CHECKOUT_CATALOG).forEach((c) => { if (c.adminSku === r.sku) equivIds.add(c.id); });
      const existing = items.find((i) => equivIds.has(i.id));
      if (!existing) return;
      const regUsd = isTienda && r.price_usd_tienda && Number(r.price_usd_tienda) > 0
        ? Number(r.price_usd_tienda)
        : region.tier === "latam" && r.price_usd_latam && Number(r.price_usd_latam) > 0
          ? Number(r.price_usd_latam)
          : Number(r.price_usd) || 0;
      const expectedDisplayUsd = Math.round(regUsd * factor * 100) / 100;
      const expectedPen = r.local_prices?.PEN && Number(r.local_prices.PEN) > 0
        ? Math.round(Number(r.local_prices.PEN) * factor * 100) / 100 : undefined;
      // Detect if already discounted (avoid infinite loop)
      const currentUsd = existing.regionPrices?.[region.tier === "latam" ? "latam" : (isTienda ? "tienda" : "global")] ?? existing.price;
      const currentPen = existing.pricePen;
      const usdMatches = Math.abs((currentUsd ?? 0) - expectedDisplayUsd) < 0.01;
      const penMatches = isPE ? Math.abs((currentPen ?? 0) - (expectedPen ?? 0)) < 0.01 : true;
      if (usdMatches && penMatches) return;
      const globalPrice = Math.round((Number(r.price_usd) || 0) * factor * 100) / 100;
      const latamPrice = r.price_usd_latam && Number(r.price_usd_latam) > 0
        ? Math.round(Number(r.price_usd_latam) * factor * 100) / 100 : globalPrice;
      const tiendaPrice = r.price_usd_tienda && Number(r.price_usd_tienda) > 0
        ? Math.round(Number(r.price_usd_tienda) * factor * 100) / 100 : undefined;
      syncItem({
        id: existing.id,
        name: existing.name,
        image: existing.image,
        description: existing.description,
        price: globalPrice,
        pricePen: expectedPen,
        regionPrices: { latam: latamPrice, global: globalPrice, ...(tiendaPrice != null ? { tienda: tiendaPrice } : {}) },
      });
    });
  }, [upsells, items, region.country, region.tier, syncItem]);


  // equivalence: match catalog ids that reference same admin sku
  const equivalentIdsFor = (sku: string): string[] => {
    const ids = new Set<string>([sku]);
    Object.values(CHECKOUT_CATALOG).forEach((c) => {
      if (c.adminSku === sku) ids.add(c.id);
    });
    return Array.from(ids);
  };

  if (upsells.length === 0) return null;

  const regionalUsd = (r: DBRow) => {
    if (isTiendaUsd && r.price_usd_tienda && Number(r.price_usd_tienda) > 0) return Number(r.price_usd_tienda);
    if (region.tier === "latam" && r.price_usd_latam && Number(r.price_usd_latam) > 0) return Number(r.price_usd_latam);
    return Number(r.price_usd) || 0;
  };

  const overridesFor = useSkuOverridesResolver();
  const fmt = (usd: number, pen?: number | null, sku?: string) => {
    if (isPeru && pen && pen > 0) return formatCurrencyAmount(Number(pen), "PEN");
    const { local_prices, local_usd_prices } = overridesFor(sku);
    const { formatted, isUsd } = formatLocalAmount(Number(usd) || 0, region.country || "", local_prices, local_usd_prices);
    return isUsd ? formatCurrencyAmount(Number(usd) || 0, "USD") : formatted;
  };

  const priced = (r: UpsellRow) => {
    const factor = 1 - Math.max(0, Math.min(95, r.discount_pct)) / 100;
    const global = roundMoney((Number(r.price_usd) || 0) * factor);
    const latam = r.price_usd_latam && Number(r.price_usd_latam) > 0
      ? roundMoney(Number(r.price_usd_latam) * factor) : global;
    const tienda = r.price_usd_tienda && Number(r.price_usd_tienda) > 0
      ? roundMoney(Number(r.price_usd_tienda) * factor) : undefined;
    const pen = r.local_prices?.PEN && Number(r.local_prices.PEN) > 0
      ? roundMoney(Number(r.local_prices.PEN) * factor) : undefined;
    return {
      displayUsd: roundMoney(regionalUsd(r) * factor),
      originalDisplayUsd: regionalUsd(r),
      originalPen: r.local_prices?.PEN ? Number(r.local_prices.PEN) : undefined,
      price: global,
      pricePen: pen,
      regionPrices: { latam, global, ...(tienda != null ? { tienda } : {}) },
    };
  };

  const handleAdd = (r: UpsellRow) => {
    const p = priced(r);
    addItem({
      id: r.sku,
      name: r.name,
      price: p.price,
      pricePen: p.pricePen,
      regionPrices: p.regionPrices,
      image: r.cover_image_url || "/placeholder.svg",
      description: r.description || "",
      quantity: 1,
    });
    toast.success(t.toast);
  };

  const cartIds = new Set(items.map((i) => i.id));

  return (
    <section className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
      <header className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold leading-tight">{t.title}</h3>
          <p className="text-xs text-muted-foreground">{t.sub}</p>
        </div>
      </header>

      <ul className="divide-y">
        {upsells.map((r) => {
          const equivs = equivalentIdsFor(r.sku);
          const inCart = equivs.some((id) => cartIds.has(id));
          const p = priced(r);
          const pct = Math.round(r.discount_pct);
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
                  {pct > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                      {fmt(p.originalDisplayUsd, p.originalPen, r.sku)}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-primary">
                    {fmt(p.displayUsd, p.pricePen, r.sku)}
                  </p>
                </div>
                {pct > 0 && (
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                    {t.auto} -{pct}%
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
