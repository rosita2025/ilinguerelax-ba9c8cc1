import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Lock, ShieldCheck, MessageCircle, ArrowLeft } from "lucide-react";

import { OrderSummary } from "@/components/checkout/OrderSummary";

import { BuyerInfoForm } from "@/components/checkout/BuyerInfoForm";
import { PaymentMethodsGroup } from "@/components/checkout/PaymentMethodsGroup";
import { UpsellPanel } from "@/components/checkout/UpsellPanel";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { getCatalogItem, CHECKOUT_CATALOG, type CatalogItem } from "@/config/checkoutCatalog";
import { useAbandonedCheckoutTracker } from "@/hooks/useAbandonedCheckoutTracker";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";

export default function Checkout() {
  const { slug } = useParams<{ slug?: string }>();
  const clear = useCheckoutPruebaStore((s) => s.clear);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const removeItem = useCheckoutPruebaStore((s) => s.removeItem);
  const syncItem = useCheckoutPruebaStore((s) => s.syncItem);
  const updateQty = useCheckoutPruebaStore((s) => s.updateQuantity);
  const items = useCheckoutPruebaStore((s) => s.items);
  const region = useRegionTier();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const isPeru = (region.country || "").toUpperCase() === "PE";

  const staticItem = getCatalogItem(slug);
  const [dbItem, setDbItem] = useState<CatalogItem | null>(null);
  const [adminUpsells, setAdminUpsells] = useState<CatalogItem["upsells"] | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbMissing, setDbMissing] = useState(false);

  // Always live-load product + upsells from admin (`digital_products` +
  // `product_upsells`) so /checkouts/:slug mirrors /admin/products/:sku
  // exactly, con o sin upsell. Static catalog only serves as a fallback shell.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    // Resolve the admin SKU automatically for every product:
    // 1) explicit `adminSku` in the static catalog,
    // 2) otherwise derive it from `productPath` (/products/<sku>),
    // 3) otherwise fall back to the URL slug itself.
    // This keeps /checkouts/:slug in sync with /admin/products/:sku for every
    // product (price, image, upsells, with or without upsell) with zero manual
    // wiring per SKU.
    const derivedFromPath = staticItem?.productPath?.replace(/^\/products\//, "") || null;
    const adminSku = staticItem?.adminSku ?? derivedFromPath ?? slug;


    const load = async () => {
      setLoadingDb(true);
      const cb = Date.now();

      // 1) Product row (skip if we already have static fallback and it exists)
      const { data, error } = await supabase
        .from("digital_products")
        .select("sku, name, description, price_usd, price_usd_latam, price_pen, cover_image_url, updated_at")
        .eq("sku", adminSku)
        .eq("active", true)
        .gt("price_usd", -1 - (cb % 7) * 0.0000001)
        .maybeSingle();

      if (cancelled) return;

      // 2) Admin-configured upsells for this SKU — always fetched so removing
      //    all upsells in admin also removes them from the checkout.
      const { data: upRows } = await supabase
        .from("product_upsells")
        .select("upsell_sku, discount_pct, sort_order")
        .eq("product_sku", adminSku)
        .order("sort_order", { ascending: true });


      let upsells: CatalogItem["upsells"] | null = null;
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
      } else {
        // Empty array = "admin cleared all upsells for this SKU"
        upsells = [];
      }

      if (cancelled) return;
      setAdminUpsells(upsells);

      if (error || !data) {
        // No DB row → rely on static catalog if any, otherwise mark missing.
        setDbMissing(!staticItem);
        setLoadingDb(false);
        return;
      }

      const imgBust = data.cover_image_url ? `?v=${cb}` : "";
      const priceGlobal = Number(data.price_usd);
      const priceLatam = data.price_usd_latam != null ? Number(data.price_usd_latam) : null;
      setDbItem({
        id: staticItem?.id ?? data.sku,
        name: data.name,
        price: priceGlobal,
        image: (data.cover_image_url || "/placeholder.svg") + imgBust,
        description: data.description || undefined,
        productPath: staticItem?.productPath ?? `/products/${data.sku}`,
        adminSku: data.sku,
        upsells: upsells ?? undefined,
        ...(priceLatam != null && {
          regionPrices: { latam: priceLatam, global: priceGlobal },
        }),
      } as CatalogItem);
      setDbMissing(false);
      setLoadingDb(false);
    };

    load();
    const unsubscribe = subscribeCatalogUpdates({ sku: adminSku, onUpdate: load });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [slug, staticItem]);

  // Merge: DB takes precedence for price/image/name; admin upsells always win
  // over static ones once they've been fetched (including the "empty" state).
  const mergedFromStatic: CatalogItem | null = staticItem
    ? { ...staticItem, ...(adminUpsells !== null ? { upsells: adminUpsells.length ? adminUpsells : undefined } : {}) }
    : null;
  const catalogItem = dbItem ?? mergedFromStatic;
  const slugUnknown = !!slug && !catalogItem && !loadingDb && dbMissing;


  // Auto-load product from URL slug (Shopify-style). Also live-syncs price/image/upsells
  // when the admin edits the catalog and pushes an update — without dropping items or state.
  useEffect(() => {
    if (!catalogItem) return;
    const existing = items.find((i) => i.id === catalogItem.id);
    if (!existing) {
      // Add the new product WITHOUT clearing previous items — user keeps
      // whatever they already had in the cart across product pages.
      addItem({ ...catalogItem, quantity: 1 });
    } else {
      // Same product already in cart → refresh mutable fields, force qty=1
      // (digital products are single-unit).
      syncItem(catalogItem);
      if (existing.quantity !== 1) updateQty(catalogItem.id, 1);
    }
    // Fingerprint intentionally includes price + region prices + upsell prices so
    // any admin edit refreshes the cart line immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    catalogItem?.id,
    catalogItem?.price,
    catalogItem?.regionPrices?.latam,
    catalogItem?.regionPrices?.global,
    catalogItem?.image,
    catalogItem?.name,
    JSON.stringify(catalogItem?.upsells?.map((u) => [u.id, u.price, u.originalPrice]) ?? []),
  ]);

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

