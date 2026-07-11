import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Lock, ShieldCheck, MessageCircle, ArrowLeft } from "lucide-react";

import { OrderSummary } from "@/components/checkout/OrderSummary";

import { BuyerInfoForm } from "@/components/checkout/BuyerInfoForm";
import { PaymentMethodsGroup } from "@/components/checkout/PaymentMethodsGroup";
import { UpsellPanel } from "@/components/checkout/UpsellPanel";
import { useCheckoutPruebaStore } from "@/stores/checkoutPruebaStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { getCatalogItem, CHECKOUT_CATALOG, type CatalogItem } from "@/config/checkoutCatalog";
import { useAbandonedCheckoutTracker } from "@/hooks/useAbandonedCheckoutTracker";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";

export default function CheckoutPrueba1() {
  const { slug } = useParams<{ slug?: string }>();
  const clear = useCheckoutPruebaStore((s) => s.clear);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const region = useRegionTier();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const isPeru = (region.country || "").toUpperCase() === "PE";

  const staticItem = getCatalogItem(slug);
  const [dbItem, setDbItem] = useState<CatalogItem | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbMissing, setDbMissing] = useState(false);

  // If slug not in static catalog, try to load from digital_products table.
  // Also refetches when the tab regains focus so admin edits (price / upsells) show up fast.
  useEffect(() => {
    if (!slug || staticItem) return;
    let cancelled = false;
    const load = async () => {
      setLoadingDb(true);
      // Cache-buster: unique filter forces PostgREST to bypass any intermediary cache.
      const cb = Date.now();
      const { data, error } = await supabase
        .from("digital_products")
        .select("sku, name, description, price_usd, price_pen, cover_image_url, updated_at")
        .eq("sku", slug)
        .eq("active", true)
        .gt("price_usd", -1 - (cb % 7) * 0.0000001) // varies request signature to bust caches
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setDbMissing(true);
        setLoadingDb(false);
        return;
      }
      // Fetch configured upsells for this product from admin.
      const { data: upRows } = await supabase
        .from("product_upsells")
        .select("upsell_sku, discount_pct, sort_order")
        .eq("product_sku", slug)
        .order("sort_order", { ascending: true });
      let upsells: CatalogItem["upsells"] = undefined;
      if (upRows && upRows.length) {
        const skus = upRows.map((u) => u.upsell_sku);
        const { data: upProducts } = await supabase
          .from("digital_products")
          .select("sku, name, description, price_usd, cover_image_url")
          .in("sku", skus)
          .eq("active", true);
        const bySku = new Map((upProducts ?? []).map((p) => [p.sku, p]));
        upsells = upRows
          .map((u) => {
            const p = bySku.get(u.upsell_sku);
            if (!p) return null;
            const original = Number(p.price_usd);
            const price = Math.round(original * (1 - (Number(u.discount_pct) || 0) / 100) * 100) / 100;
            const bust = `?v=${cb}`;
            return {
              id: p.sku,
              name: p.name,
              price,
              originalPrice: u.discount_pct ? original : undefined,
              image: (p.cover_image_url || "/placeholder.svg") + (p.cover_image_url ? bust : ""),
              description: p.description || undefined,
              badge: u.discount_pct ? `-${u.discount_pct}%` : undefined,
            };
          })
          .filter(Boolean) as CatalogItem["upsells"];
      }
      if (cancelled) return;
      const imgBust = data.cover_image_url ? `?v=${cb}` : "";
      setDbItem({
        id: data.sku,
        name: data.name,
        price: Number(data.price_usd),
        image: (data.cover_image_url || "/placeholder.svg") + imgBust,
        description: data.description || undefined,
        productPath: `/products/${data.sku}`,
        upsells,
        ...(data.price_pen != null && {
          regionPrices: { latam: Number(data.price_pen), global: Number(data.price_usd) },
        }),
      } as CatalogItem);
      setDbMissing(false);
      setLoadingDb(false);
    };
    load();

    const unsubscribe = subscribeCatalogUpdates({ sku: slug, onUpdate: load });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [slug, staticItem]);

  const catalogItem = staticItem ?? dbItem;
  const slugUnknown = !!slug && !catalogItem && !loadingDb && dbMissing;

  // Auto-load product from URL slug (Shopify-style)
  useEffect(() => {
    if (catalogItem) {
      clear();
      addItem(catalogItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogItem?.id]);

  // Shopify-style abandoned checkout tracking: saves buyer info if they
  // fill name+email but leave without completing card payment.
  useAbandonedCheckoutTracker(slug, catalogItem?.name);

  if (loadingDb && !catalogItem && !slugUnknown) {
    // Silent background fetch — don't block UI with a loader
  }


  if (slugUnknown) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Producto no encontrado</h1>
          <p className="text-muted-foreground">
            El producto <code className="px-1.5 py-0.5 rounded bg-muted">{slug}</code> no existe en el catálogo.
          </p>
          <p className="text-xs text-muted-foreground">
            Slugs disponibles: {Object.keys(CHECKOUT_CATALOG).join(", ")}
          </p>
          <Link to="/" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Checkout Prueba 1 · ILINGUE RELAX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      

      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {catalogItem?.productPath && (
              <Link
                to={catalogItem.productPath}
                className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground hover:text-primary whitespace-nowrap"
                aria-label={t.returnToProduct || "Volver al producto"}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.returnToProduct || "Volver al producto"}</span>
              </Link>
            )}
            <span
              className="text-base sm:text-xl font-bold tracking-tight whitespace-nowrap"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              ILINGUE <span className="text-primary">RELAX</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">
            <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="hidden sm:inline font-medium">
              {isPeru ? t.stripeSslMP : t.stripeSSL}
            </span>
            <span className="sm:hidden font-medium">SSL</span>
          </div>


        </div>
      </header>

      <div className="lg:hidden max-w-6xl mx-auto px-3 sm:px-4 pt-3">
        <OrderSummary collapsible locked={!!catalogItem} />
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-10 grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
        <div className="space-y-6">
          <BuyerInfoForm />
          {catalogItem?.upsells && <UpsellPanel upsells={catalogItem.upsells} />}
          <PaymentMethodsGroup />

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {t.sslEncryption}
            </span>
            {isPeru && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {t.mercadoPagoPeru}
                </span>
              </>
            )}
            <span>·</span>

            <a
              href="https://wa.me/112512724704"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary"
            >
              <MessageCircle className="w-3.5 h-3.5" /> {t.whatsappSupport}
            </a>
          </div>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <OrderSummary locked={!!catalogItem} />
        </aside>
      </div>

    </div>
  );
}

