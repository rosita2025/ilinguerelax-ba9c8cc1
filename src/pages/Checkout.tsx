import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Lock, ShieldCheck, MessageCircle, ArrowLeft, Zap, BadgeCheck, Users, Clock, Package } from "lucide-react";
import { toast } from "sonner";



import { OrderSummary } from "@/components/checkout/OrderSummary";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

import { BuyerInfoForm } from "@/components/checkout/BuyerInfoForm";
import { PaymentMethodsGroup } from "@/components/checkout/PaymentMethodsGroup";
import { UpsellPanel } from "@/components/checkout/UpsellPanel";

import { CheckoutTestimonials } from "@/components/checkout/CheckoutTestimonials";

import { PaymentLogos } from "@/components/checkout/PaymentLogos";


import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { getCatalogItem, resolveCheckoutSlug, CHECKOUT_CATALOG, type CatalogItem } from "@/config/checkoutCatalog";
import { useAbandonedCheckoutTracker } from "@/hooks/useAbandonedCheckoutTracker";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";
import { getStripe } from "@/lib/stripe";
import { trackHotmartEvent, trackBeginCheckout } from "@/hooks/useMetaPixel";
import { cn } from "@/lib/utils";
import { authorizeCheckout, evaluateCheckoutGate } from "@/lib/checkoutGate";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function MobileOrderSummarySticky({ slug }: { slug?: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={cn(
        "lg:hidden z-20 bg-background/95 backdrop-blur border-b",
        expanded ? "relative" : "sticky top-[44px] sm:top-[52px]",
      )}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2">
        <SectionErrorBoundary name="order-summary-mobile" extra={{ slug }}>
          <OrderSummary collapsible mainProductId={slug} onExpandedChange={setExpanded} />
        </SectionErrorBoundary>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const clear = useCheckoutPruebaStore((s) => s.clear);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const removeItem = useCheckoutPruebaStore((s) => s.removeItem);
  const syncItem = useCheckoutPruebaStore((s) => s.syncItem);
  const updateQty = useCheckoutPruebaStore((s) => s.updateQuantity);
  const setBuyer = useCheckoutPruebaStore((s) => s.setBuyer);
  const items = useCheckoutPruebaStore((s) => s.items);
  const region = useRegionTier();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const isPeru = (region.country || "").toUpperCase() === "PE";

  // Anti-fraude: /checkouts/:slug es una URL privada. Solo se permite si el
  // visitante llegó desde una CTA propia, un enlace de recuperación de carrito
  // o un token firmado. Cualquier acceso directo (bot, crawler, link filtrado)
  // se redirige al producto público.
  // Evaluación síncrona del gate: si el cliente ya está autorizado, renderizamos
  // inmediatamente sin pantalla en blanco. El chequeo de rate-limit por IP se
  // hace en segundo plano (fail-open).
  // (sin estado de gate: renderizamos siempre y redirigimos en background si no cumple)
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      // El gate ya nunca bloquea: solo renueva la ventana de compra.
      evaluateCheckoutGate();

      // Server-side rate limit por IP en segundo plano (fail-open).
      try {
        const { data } = await supabase.functions.invoke("checkout-gate-check", {
          body: {
            slug,
            referer: (typeof document !== "undefined" && document.referrer) || "",
            country: (region.country || "").toUpperCase(),
          },
        });
        const res = data as { allowed?: boolean; reason?: string } | null;
        // Este endpoint es solo observacional. Nunca se expulsa a un comprador
        // legítimo por compartir IP o por volver a abrir su carrito.
        if (res && res.allowed === false && !cancelled) authorizeCheckout(slug);
      } catch { /* fail-open */ }
    })();
    return () => { cancelled = true; };
  }, [slug, navigate]);

  // Cuando el comprador escribe su correo, lo asociamos al acceso ya
  // registrado (misma IP) para poder ver en /admin/checkout-abuse quién
  // dejó datos y no completó la compra. No crea hits nuevos.
  const buyerEmail = useCheckoutPruebaStore((s) => s.buyer.email);
  const identifiedRef = useRef<string | null>(null);
  useEffect(() => {
    const email = (buyerEmail || "").trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    if (identifiedRef.current === email) return;
    identifiedRef.current = email;
    const tid = setTimeout(() => {
      supabase.functions
        .invoke("checkout-gate-check", {
          body: { slug, email, country: (region.country || "").toUpperCase() },
        })
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(tid);
  }, [buyerEmail, slug, region.country]);



  // Prewarm: cargar stripe.js y despertar el edge function `create-checkout-prueba`
  // en cuanto se abre /checkouts, para que al mostrar el iframe ya esté caliente
  // (evita el cold start de 1-3 s en la primera compra del día).
  useEffect(() => {
    let warm = false;
    const warmup = async () => {
      if (warm) return;
      warm = true;
      try { getStripe(); } catch {}
      try {
        await fetch(`https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1/create-checkout-prueba`, { 
          method: "OPTIONS", 
          mode: "cors" 
        });
      } catch {}
    };
    
    // Idle callback to avoid blocking the main thread
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(warmup);
    } else {
      setTimeout(warmup, 1000);
    }
  }, []);

  // Recuperación de carrito estilo Shopify: /checkouts/:slug?r=<b64>
  // decodifica {b:{n,e,p}, c:[{id,q}]} y rellena datos + carrito en cualquier
  // dispositivo desde el enlace del email de carrito abandonado.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("r");
      if (!r) return;
      const b64 = r.replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "===".slice((b64.length + 3) % 4);
      const json = decodeURIComponent(escape(atob(padded)));
      const payload = JSON.parse(json) as {
        b?: { n?: string; e?: string; p?: string };
        c?: Array<{ id?: string; q?: number }>;
      };
      if (payload?.b) {
        setBuyer({
          fullName: payload.b.n || "",
          email: (payload.b.e || "").trim(),
          phone: payload.b.p || "",
        });
        try {
          localStorage.setItem("ilr_buyer", JSON.stringify({
            name: payload.b.n || "",
            email: payload.b.e || "",
            phone: payload.b.p || "",
          }));
        } catch { /* ignore */ }
      }
      if (Array.isArray(payload?.c)) {
        for (const c of payload.c) {
          if (!c?.id) continue;
          const cat = getCatalogItem(c.id) || Object.values(CHECKOUT_CATALOG).find((x) => x.id === c.id);
          if (cat) {
            addItem({
              id: cat.id,
              name: cat.name,
              price: cat.price,
              image: cat.image,
              description: cat.description,
              regionPrices: cat.regionPrices,
              pricePen: cat.pricePen,
              quantity: Math.max(1, Number(c.q) || 1),
            }, { silent: true });
          }
        }
      }
      // Limpiar el parámetro para que un refresh no vuelva a duplicar.
      params.delete("r");
      const clean = window.location.pathname + (params.toString() ? `?${params}` : "");
      window.history.replaceState(null, "", clean);
      toast.success("Cart recovered ✨");
    } catch { /* payload inválido, ignora */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const staticItem = getCatalogItem(slug);
  const [dbItem, setDbItem] = useState<CatalogItem | null>(null);
  const [adminUpsells, setAdminUpsells] = useState<CatalogItem["upsells"] | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbMissing, setDbMissing] = useState(false);
  // InitiateCheckout is fired below (once catalogItem is resolved) so we can
  // include product_id + value + currency in the tracked event — this is what
  // powers the "Continuar pago" counter in /admin/live for every SKU.


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
    const adminSku = staticItem?.adminSku ?? derivedFromPath ?? resolveCheckoutSlug(slug);

    // Cache local for product data to avoid flashes and redundant loads
    const cacheKey = `ilr_prod_cache_${adminSku}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { item, upsells: up } = JSON.parse(cached);
        setDbItem(item);
        setAdminUpsells(up);
        setLoadingDb(false);
      } catch (e) {}
    }

    const load = async () => {
      setLoadingDb(true);
      const cb = Date.now();

      // Run product + upsells queries in parallel to shave ~50% off the wait.
      const [{ data, error }, { data: upRows }] = await Promise.all([
        (async () => {
          try {
            return await supabase
              .from("digital_products")
              .select("sku, name, description, price_usd, price_usd_latam, price_usd_tienda, price_pen, cover_image_url, updated_at, is_physical, local_prices, local_usd_prices")
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
        if (error) {
          console.error("Checkout data error:", error);
          toast.error("Error de conexión con el catálogo. Usando versión de respaldo.");
        }
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
      const finalItem = {
        id: staticItem?.id ?? data.sku,
        name: data.name,
        price: priceGlobal,
        image: (data.cover_image_url || "/placeholder.svg") + imgBust,
        description: data.description || undefined,
        productPath: staticItem?.productPath ?? `/products/${data.sku}`,
        adminSku: data.sku,
        upsells: upsells ?? undefined,
        isPhysical: Boolean(data.is_physical),
        ...(pricePen != null && { pricePen }),
        // Always emit regionPrices so any region resolves to a valid price,
        // even for brand-new admin products that only have price_usd set.
        regionPrices: {
          latam: priceLatam ?? staticItem?.regionPrices?.latam ?? priceGlobal,
          global: priceGlobal,
          tienda: priceTienda ?? staticItem?.regionPrices?.tienda ?? priceLatam ?? priceGlobal,
        },
        localPrices: data.local_prices,
        localUsdPrices: data.local_usd_prices,
      } as CatalogItem;

      setDbItem(finalItem);
      
      // Persist to session cache
      sessionStorage.setItem(cacheKey, JSON.stringify({ item: finalItem, upsells }));
      
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
      addItem({ ...catalogItem, quantity: 1 }, { silent: true });
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
  // On the very first load the product is simply added silently (no toast), so
  // opening /checkouts/:slug in Safari/Chrome móvil no muestra un aviso raro.
  const mainSeenRef = useRef(false);
  useEffect(() => {
    if (!catalogItem) return;
    const hasMain = items.some((i) => i.id === catalogItem.id);
    if (hasMain) {
      mainSeenRef.current = true;
      return;
    }
    const wasRemovedByUser = mainSeenRef.current;
    addItem({ ...catalogItem, quantity: 1 }, { silent: true });
    if (!wasRemovedByUser) return;
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
  }, [items, catalogItem, addItem, language]);

  // Shopify-style abandoned checkout tracking: saves buyer info if they
  // fill name+email but leave without completing card payment.
  useAbandonedCheckoutTracker(slug, catalogItem?.name);

  // Fire InitiateCheckout for every /checkouts/:slug (Pixel + CAPI + funnel_events).
  // Includes product_id + value + currency so /admin/live cuenta "Continuar pago"
  // por producto para TODOS los SKUs de la tienda (no solo Hotmart).
  const initiatedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!catalogItem) return;
    const sku = catalogItem.adminSku || catalogItem.id;
    if (!sku || initiatedRef.current === sku) return;
    initiatedRef.current = sku;

    const tier = (region.tier || "global") as "peru" | "latam" | "tienda" | "global";
    const priceForTier =
      tier === "peru" && catalogItem.pricePen != null
        ? Number(catalogItem.pricePen)
        : Number(
            catalogItem.regionPrices?.[tier === "peru" ? "latam" : tier] ??
            catalogItem.price
          );
    const currency = tier === "peru" ? "PEN" : "USD";
    const cartTotal = items.reduce((sum, it) => {
      const p = tier === "peru" && it.pricePen != null
        ? Number(it.pricePen)
        : Number(it.regionPrices?.[tier === "peru" ? "latam" : tier] ?? it.price);
      return sum + p * (it.quantity || 1);
    }, 0);
    // Meta Pixel: InitiateCheckout
    // Forzamos USD para Ads (Facebook/Instagram) según requerimiento.
    // Usamos el precio USD base del tier para mantener consistencia en reportes.
    const initiateValue = catalogItem.regionPrices?.[tier === "peru" ? "latam" : tier] ?? catalogItem.price;

    trackHotmartEvent("InitiateCheckout", {
      content_name: catalogItem.name,
      content_ids: [sku],
      content_type: "product",
      value: initiateValue,
      currency: "USD",
      num_items: items.length || 1,
    });
    // GA4-style alias for the same funnel step, linked to the same SKU.
    trackBeginCheckout({
      content_name: catalogItem.name,
      content_ids: [sku],
      content_type: "product",
      value: initiateValue,
      currency: "USD",
      num_items: items.length || 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogItem?.adminSku, catalogItem?.id]);

  // Determine loading state: only block the UI on initial load if we don't have
  // the main product yet. Once catalogItem is present, we keep the UI visible
  // and receptive to user input, even if background syncs happen.
  const isInitialLoading = loadingDb && !catalogItem && !slugUnknown;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Helmet>
          <title>Loading Checkout... | iLingue Relax</title>
        </Helmet>
        <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/50 h-[44px] sm:h-[48px]">
          <div className="max-w-6xl mx-auto h-full px-4 flex items-center">
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-6">
          <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                  </div>
                </div>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slugUnknown) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="text-muted-foreground">
            The product <code className="px-1.5 py-0.5 rounded bg-muted">{slug}</code> is not active in the catalog.
          </p>
          <p className="text-xs text-muted-foreground">
            Verify it exists in <code>/admin/products</code> and is marked as <strong>active</strong>. The admin SKU must match the URL <code>/checkouts/&lt;sku&gt;</code>.
          </p>
          <Link to="/products" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium">
            View all products
          </Link>
        </div>
      </div>
    );
  }



  if (slugUnknown) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <span
              className="text-base sm:text-xl font-bold tracking-tight whitespace-nowrap"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              iLingue <span className="text-primary">Relax</span>
            </span>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <Card className="max-w-md w-full p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Product not found</h1>
              <p className="text-muted-foreground">
                The product with ID <code className="bg-muted px-1 rounded">{slug}</code> does not exist or is unavailable.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to="/">Back to shop</Link>
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                Retry connection
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (slugUnknown) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <span
              className="text-base sm:text-xl font-bold tracking-tight whitespace-nowrap"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              iLingue <span className="text-primary">Relax</span>
            </span>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <Card className="max-w-md w-full p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Product not found</h1>
              <p className="text-muted-foreground">
                The product with ID <code className="bg-muted px-1 rounded">{slug}</code> does not exist or is unavailable.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to="/">Back to shop</Link>
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                Retry connection
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden max-w-full">
      <SectionErrorBoundary name="checkout-root">
        {loadingDb && !catalogItem && (
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-5 lg:py-8 space-y-6">
            <header className="flex items-center justify-between gap-4 py-4 border-b">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-6 w-24" />
            </header>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-5">
              <div className="space-y-6">
                <Card className="p-6 space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="grid gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </Card>
              </div>
              <aside className="hidden lg:block space-y-6">
                <Card className="p-6 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </Card>
              </aside>
            </div>
          </div>
        )}

        {catalogItem && (
          <>
            <Helmet>
              <title>{`Checkout · iLingue Relax · ${isPeru ? "PE" : "GLOBAL"}`}</title>
              <meta name="robots" content="noindex, nofollow" />
              <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
              <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
              <link rel="preconnect" href="https://m.stripe.network" crossOrigin="anonymous" />
              <link rel="preconnect" href="https://m.stripe.com" crossOrigin="anonymous" />
              <link rel="preconnect" href="https://checkout.stripe.com" crossOrigin="anonymous" />
              <link rel="preconnect" href="https://opyitzdvvurdyyyzkwwv.supabase.co" crossOrigin="anonymous" />
              <link rel="preconnect" href="https://www.paypal.com" crossOrigin="anonymous" />
              <link rel="dns-prefetch" href="https://q.stripe.com" />
              <link rel="preload" as="script" href="https://js.stripe.com/v3" crossOrigin="anonymous" />
            </Helmet>

            <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
              <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2">
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
                    iLingue <span className="text-primary">Relax</span>
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

            <MobileOrderSummarySticky slug={catalogItem?.id} />

            <div className="max-w-6xl min-w-0 mx-auto px-3 sm:px-4 py-2 sm:py-4 lg:py-6 grid lg:grid-cols-[minmax(0,1fr)_400px] gap-4 lg:gap-6">
              <div className="min-w-0 space-y-3 sm:space-y-4">
                {items.some(i => i.isPhysical) && items.some(i => !i.isPhysical) && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex gap-3 items-start">
                    <Package className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900 dark:text-amber-200">
                      <p className="font-bold">Mixed Order</p>
                      <p>Your cart contains physical and digital products. Digital access is instant after payment, while physical items require shipping details.</p>
                    </div>
                  </div>
                )}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-3 flex gap-2.5 items-center mb-1">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-[11px] sm:text-xs text-emerald-900 dark:text-emerald-100 font-medium leading-tight">
                    {t.verifiedReviewNotice}
                  </p>
                </div>
                
                <SectionErrorBoundary name="buyer-info">
                  <BuyerInfoForm />
                </SectionErrorBoundary>

                {catalogItem?.upsells?.length ? (
                  <SectionErrorBoundary name="upsell-panel" extra={{ slug: catalogItem?.id }}>
                    <UpsellPanel upsells={catalogItem.upsells} mainProductId={catalogItem.id} />
                  </SectionErrorBoundary>
                ) : null}

                <SectionErrorBoundary name="payment-methods">
                  <PaymentMethodsGroup parentSku={catalogItem?.adminSku ?? catalogItem?.id ?? slug ?? null} />
                </SectionErrorBoundary>

                <SectionErrorBoundary name="checkout-testimonials">
                  <CheckoutTestimonials />
                </SectionErrorBoundary>

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

              <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start space-y-6">
                <SectionErrorBoundary name="order-summary-desktop" extra={{ slug: catalogItem?.id }}>
                  <OrderSummary mainProductId={catalogItem?.id} />
                </SectionErrorBoundary>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">Checkout Seguro</h3>
                  </div>
                  <div className="pt-6 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                      Métodos de pago aceptados:
                    </p>
                    <PaymentLogos />
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </SectionErrorBoundary>
    </div>
  );
}

