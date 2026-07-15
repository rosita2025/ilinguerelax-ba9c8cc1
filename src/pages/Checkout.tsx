import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Lock, ShieldCheck, MessageCircle, ArrowLeft, Zap, BadgeCheck, Users, Clock } from "lucide-react";
import { toast } from "sonner";



import { OrderSummary } from "@/components/checkout/OrderSummary";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

import { BuyerInfoForm } from "@/components/checkout/BuyerInfoForm";
import { PaymentMethodsGroup } from "@/components/checkout/PaymentMethodsGroup";
import { MoreProductsPanel } from "@/components/checkout/MoreProductsPanel";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { getCatalogItem, CHECKOUT_CATALOG, type CatalogItem } from "@/config/checkoutCatalog";
import { useAbandonedCheckoutTracker } from "@/hooks/useAbandonedCheckoutTracker";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";
import { getStripe } from "@/lib/stripe";

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

  // Prewarm: cargar stripe.js y despertar el edge function `create-checkout-prueba`
  // en cuanto se abre /checkouts, para que al mostrar el iframe ya esté caliente
  // (evita el cold start de 1-3 s en la primera compra del día).
  useEffect(() => {
    try { getStripe(); } catch { /* sandbox no configurado */ }
    // OPTIONS preflight = warm-up gratis, sin efectos secundarios.
    try {
      const url = `https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1/create-checkout-prueba`;
      fetch(url, { method: "OPTIONS", mode: "cors" }).catch(() => {});
    } catch { /* ignore */ }
  }, []);

  const staticItem = getCatalogItem(slug);
  const [dbItem, setDbItem] = useState<CatalogItem | null>(null);
  const [adminUpsells, setAdminUpsells] = useState<CatalogItem["upsells"] | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbMissing, setDbMissing] = useState(false);
  // Global Meta Pixel (loaded in index.html): fire InitiateCheckout on entry.
  useEffect(() => {
    try {
      const w = window as unknown as { fbq?: (...a: unknown[]) => void };
      if (typeof w.fbq === "function") w.fbq("track", "InitiateCheckout");
    } catch { /* ignore */ }
  }, [slug]);


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

      // Run product + upsells queries in parallel to shave ~50% off the wait.
      const [{ data, error }, { data: upRows }] = await Promise.all([
        (async () => {
          try {
            return await supabase
              .from("digital_products")
              .select("sku, name, description, price_usd, price_usd_latam, price_usd_tienda, price_pen, cover_image_url, updated_at")
              .eq("sku", adminSku)
              .eq("active", true)
              .maybeSingle();
          } catch {
            return { data: null, error: new Error("catalog offline") };
          }
        })(),
        (async () => {
          try {
            return await supabase
              .from("product_upsells")
              .select("upsell_sku, discount_pct, sort_order")
              .eq("product_sku", adminSku)
              .order("sort_order", { ascending: true });
          } catch {
            return { data: [] };
          }
        })(),
      ]);

      if (cancelled) return;



      let upsells: CatalogItem["upsells"] | null = null;
      if (upRows && upRows.length) {
        const skus = upRows.map((u) => u.upsell_sku);
        let upProducts: Array<{
          sku: string;
          name: string;
          description: string | null;
          price_usd: number;
          price_pen: number | null;
          cover_image_url: string | null;
        }> = [];
        try {
          const result = await supabase
            .from("digital_products")
            .select("sku, name, description, price_usd, price_pen, cover_image_url")
            .in("sku", skus)
            .eq("active", true);
          upProducts = (result.data ?? []) as typeof upProducts;
        } catch {
          upProducts = [];
        }
        const bySku = new Map((upProducts ?? []).map((p) => [p.sku, p]));
        upsells = upRows
          .map((u) => {
            const p = bySku.get(u.upsell_sku);
            if (!p) return null;
            const original = Number(p.price_usd);
            const discountPct = Number(u.discount_pct) || 0;
            const price = Math.round(original * (1 - discountPct / 100) * 100) / 100;
            const rawPen = p.price_pen != null ? Number(p.price_pen) : null;
            const pricePen = rawPen != null && rawPen > 0
              ? Math.round(rawPen * (1 - discountPct / 100) * 100) / 100
              : undefined;
            const bust = `?v=${cb}`;
            return {
              id: p.sku,
              name: p.name,
              price,
              pricePen,
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
      const rowWithTienda = data as typeof data & { price_usd_tienda?: number | string | null };
      const priceTienda = rowWithTienda.price_usd_tienda != null && Number(rowWithTienda.price_usd_tienda) > 0 ? Number(rowWithTienda.price_usd_tienda) : null;
      const pricePen = data.price_pen != null && Number(data.price_pen) > 0 ? Number(data.price_pen) : undefined;
      setDbItem({
        id: staticItem?.id ?? data.sku,
        name: data.name,
        price: priceGlobal,
        image: (data.cover_image_url || "/placeholder.svg") + imgBust,
        description: data.description || undefined,
        productPath: staticItem?.productPath ?? `/products/${data.sku}`,
        adminSku: data.sku,
        upsells: upsells ?? undefined,
        ...(pricePen != null && { pricePen }),
        // Always emit regionPrices so any region resolves to a valid price,
        // even for brand-new admin products that only have price_usd set.
        regionPrices: {
          latam: priceLatam ?? staticItem?.regionPrices?.latam ?? priceGlobal,
          global: priceGlobal,
          tienda: priceTienda ?? staticItem?.regionPrices?.tienda ?? priceLatam ?? priceGlobal,
        },
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
  const upsellsFingerprint = JSON.stringify(catalogItem?.upsells?.map((u) => [u.id, u.price, u.pricePen, u.originalPrice]) ?? []);


  // Auto-load product from URL slug (Shopify-style). Also live-syncs price/image/upsells
  // when the admin edits the catalog and pushes an update — without dropping items or state.
  useEffect(() => {
    if (!catalogItem) return;
    // NOTE: previously we pruned the cart to only the main product + declared
    // upsells. That broke multi-product checkout (adding Patrones + Coreano
    // and paying both together). Now we preserve every line the user added
    // and only ensure the main product of THIS /checkouts/:slug URL exists.
    const existing = items.find((i) => i.id === catalogItem.id);
    if (!existing) {
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
    catalogItem?.pricePen,
    catalogItem?.regionPrices?.latam,
    catalogItem?.regionPrices?.global,
    catalogItem?.regionPrices?.tienda,
    catalogItem?.image,
    catalogItem?.name,
    upsellsFingerprint,
  ]);

  // Safety net: the main product cannot be removed from the checkout. If the
  // buyer taps the trash by mistake, we re-add it automatically and notify them.
  useEffect(() => {
    if (!catalogItem) return;
    const hasMain = items.some((i) => i.id === catalogItem.id);
    if (!hasMain) {
      addItem({ ...catalogItem, quantity: 1 });
      toast.info(
        language === "en"
          ? `“${catalogItem.name}” was re-added to your cart. This product cannot be removed here.`
          : language === "fr"
          ? `« ${catalogItem.name} » a été rajouté au panier. Ce produit ne peut pas être retiré ici.`
          : language === "pt"
          ? `“${catalogItem.name}” foi adicionado novamente ao carrinho. Este produto não pode ser removido aqui.`
          : `“${catalogItem.name}” se agregó de nuevo a tu carrito. Este producto no se puede quitar desde aquí.`,
        { duration: 4500 }
      );
    }
  }, [items, catalogItem, addItem, language]);

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
            El producto <code className="px-1.5 py-0.5 rounded bg-muted">{slug}</code> no está activo en el catálogo.
          </p>
          <p className="text-xs text-muted-foreground">
            Verifica que exista en <code>/admin/products</code> y que esté marcado como <strong>activo</strong>. El SKU del admin debe coincidir con la URL <code>/checkouts/&lt;sku&gt;</code>.
          </p>
          <Link to="/products" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium">
            Ver todos los productos
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`Checkout · iLingue Relax · ${isPeru ? "PE" : "GLOBAL"}`}</title>
        <meta name="robots" content="noindex, nofollow" />
        {/* Preconnect a los orígenes críticos del checkout para reducir de
            2–7 s a ~1–2 s el tiempo de apertura del iframe de Stripe. */}
        <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://m.stripe.network" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://m.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://opyitzdvvurdyyyzkwwv.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.paypal.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://q.stripe.com" />
        {/* Prefetch temprano del bundle de stripe.js para que ya esté en caché
            cuando montemos EmbeddedCheckoutProvider. */}
        <link rel="preload" as="script" href="https://js.stripe.com/v3" crossOrigin="anonymous" />
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

      {/* High-conversion trust bar — región-aware (PE / GLOBAL) */}
      <div className="border-b bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs font-medium">
          <span className="flex items-center gap-1.5 text-foreground">
            <Zap className="w-3.5 h-3.5 text-accent" />
            {language === "en" ? "Instant delivery by email" : language === "fr" ? "Livraison instantanée par email" : language === "pt" ? "Entrega instantânea por email" : "Entrega inmediata al correo"}
          </span>
          <span className="text-muted-foreground hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5 text-foreground">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
            {language === "en" ? "7-day money-back guarantee" : language === "fr" ? "Garantie 7 jours satisfait ou remboursé" : language === "pt" ? "Garantia de 7 dias" : "Garantía de 7 días o te devolvemos tu dinero"}
          </span>
          <span className="text-muted-foreground hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5 text-foreground">
            <Users className="w-3.5 h-3.5 text-primary" />
            {language === "en" ? "+12,000 happy students" : language === "fr" ? "+12 000 étudiants satisfaits" : language === "pt" ? "+12.000 alunos felizes" : "+12,000 estudiantes felices"}
          </span>
          <span className="text-muted-foreground hidden md:inline">·</span>
          <span className="hidden md:flex items-center gap-1.5 text-foreground">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            {isPeru
              ? (language === "en" ? "Pay with Yape, Plin, card or Mercado Pago" : "Paga con Yape, Plin, tarjeta o Mercado Pago")
              : (language === "en" ? "Pay with card, PayPal or Stripe" : language === "fr" ? "Payez par carte, PayPal ou Stripe" : language === "pt" ? "Pague com cartão, PayPal ou Stripe" : "Paga con tarjeta, PayPal o Stripe")}
          </span>
        </div>
      </div>

      {/* Urgencia sutil */}
      <div className="bg-accent/10 border-b border-accent/20">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-accent-foreground/90">
          <Clock className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span className="font-semibold">
            {language === "en"
              ? "Complete your purchase now — price and bonuses reserved for a few minutes"
              : language === "fr"
              ? "Finalisez votre achat — prix et bonus réservés quelques minutes"
              : language === "pt"
              ? "Finalize sua compra — preço e bônus reservados por alguns minutos"
              : "Termina tu compra ahora — precio y bonos reservados por unos minutos"}
          </span>
        </div>
      </div>

      <div className="lg:hidden max-w-6xl mx-auto px-3 sm:px-4 pt-3">
        <SectionErrorBoundary name="order-summary-mobile" extra={{ slug: catalogItem?.id }}>
          <OrderSummary collapsible mainProductId={catalogItem?.id} />
        </SectionErrorBoundary>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-10 grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
        <div className="space-y-6">
          <BuyerInfoForm />
          <MoreProductsPanel parentSku={catalogItem?.adminSku ?? null} />
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
          <SectionErrorBoundary name="order-summary-desktop" extra={{ slug: catalogItem?.id }}>
            <OrderSummary mainProductId={catalogItem?.id} />
          </SectionErrorBoundary>
        </aside>
      </div>

    </div>
  );
}

