import { useEffect, useState, useRef } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { Check, ArrowLeft, Download, Shield, Zap, Sparkles, HelpCircle, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { DigitalProductNotice } from "@/components/DigitalProductNotice";
import { PinterestSave } from "@/components/PinterestSave";
import { VerifiedReviews } from "@/components/VerifiedReviews";
import { CartBadge } from "@/components/CartBadge";
import { StockAlert } from "@/components/StockAlert";
import { SocialProofPill } from "@/components/SocialProofPill";
import { ProductTypeBadge } from "@/components/ProductTypeBadge";
import { FAQ } from "@/components/FAQ";
import { PaymentLogos } from "@/components/checkout/PaymentLogos";
import { useI18n } from "@/i18n/I18nContext";
import { formatCurrencyAmount, type Currency } from "@/i18n";
import { Skeleton } from "@/components/ui/skeleton";

import { useLocalCurrency } from "@/hooks/useLocalCurrency";
import { useRegionTier } from "@/hooks/useRegionTier";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";

interface DBProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  learner_language: string;
  target_language: string;
  price_usd: number;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
  price_pen: number | null;
  local_usd_prices: Record<string, number> | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  is_upsell: boolean;
  active: boolean;
  /** Solo los títulos de los bonos. Los enlaces/claves nunca salen del servidor. */
  bonus_titles: unknown;
  hotmart_url: string | null;
  store_enabled: boolean;
  excluded_countries: string[] | null;
  store_excluded_countries: string[] | null;
  hotmart_excluded_countries: string[] | null;
  gallery_metadata: Record<string, any> | null;
  rating: number | null;
  review_count: number | null;
  /** Montos exactos por moneda fijados en /admin/productos/:sku. */
  local_prices: Record<string, number> | null;
}

import { COUNTRY_INFO } from "@/lib/countryInfo";



const FLAG: Record<string, string> = {
  es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", pt: "🇵🇹", ko: "🇰🇷",
  de: "🇩🇪", it: "🇮🇹", ja: "🇯🇵", nl: "🇳🇱",
};
const LANG: Record<string, string> = {
  es: "Español", en: "Inglés", fr: "Francés", pt: "Portugués", ko: "Coreano",
  de: "Alemán", it: "Italiano", ja: "Japonés", nl: "Neerlandés",
};

const ProductDynamic = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState<string>("");
  
  const { t } = useI18n();
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      let data: unknown = null;
      let error: unknown = null;
      try {
        const result = await supabase
          .from("digital_products")
          .select("id, sku, name, description, learner_language, target_language, price_usd, price_usd_latam, price_usd_tienda, price_pen, cover_image_url, gallery_images, gallery_metadata, is_upsell, active, bonus_titles, hotmart_url, store_enabled, excluded_countries, store_excluded_countries, hotmart_excluded_countries, rating, review_count, local_prices, local_usd_prices")
          .eq("sku", slug)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } catch (err) {
        error = err;
      }
      if (cancelled) return;
      if (error || !data) setNotFound(true);
      else { 
        const p = data as unknown as DBProduct;
        setProduct(p); 
        setActiveImage(p.cover_image_url || "/placeholder.svg");
        setNotFound(false); 
      }
      setLoading(false);
    };
    load();
    // Realtime desactivado por seguridad: reemplazado por broadcast + sondeo.
    const unsubscribe = subscribeCatalogUpdates({ sku: slug, onUpdate: load, pollMs: 60000 });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [slug]);

  const region = useRegionTier();
  const pricingReady = loading === false && product !== null;
  const upperCountry = region.country?.toUpperCase() || "";
  const isPEN = upperCountry === "PE";
  const flag = (() => {
    if (!upperCountry || upperCountry.length !== 2) return "🌍";
    const base = 0x1f1e6;
    const A = "A".charCodeAt(0);
    return String.fromCodePoint(
      base + upperCountry.charCodeAt(0) - A,
      base + upperCountry.charCodeAt(1) - A
    );
  })();

  const effectiveUsd = product
    ? (region.tier === "tienda" && product.price_usd_tienda != null
        ? Number(product.price_usd_tienda)
        : region.tier === "latam" && product.price_usd_latam != null
          ? Number(product.price_usd_latam)
          : Number(product.price_usd || 0))
    : 0;
  
  // Safety: cast to any or use explicit fallback to avoid TypeError on null product
  const localPrices = product ? (product as any).local_prices : null;
  const localUsdPrices = product ? (product as any).local_usd_prices : null;
  const local = useLocalCurrency(effectiveUsd, localPrices, localUsdPrices);

  // Track ViewContent per SKU for every product (existing + new) in /admin/live
  // Se dispara solo una vez al cargar la ficha del producto.
  const vcFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!product || vcFiredRef.current === product.sku) return;
    vcFiredRef.current = product.sku;

    trackHotmartEvent("ViewContent", {
      content_ids: [product.sku],
      content_name: product.name,
      content_type: "product",
      value: effectiveUsd,
      currency: "USD",
      product_id: product.sku,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.sku]);


  if (notFound) return <Navigate to="/404" replace />;
  if (loading || !product) {
    // Evitamos el flash de carga al navegar desde la home.
    // navegar desde la home. Aun así emitimos SEO + JSON-LD base con el slug
    // para que los bots siempre detecten datos estructurados en esta ruta.
    const fallbackName = (slug ?? "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || "Producto";
    return (
      <>
        <SEO
          title={fallbackName}
          description={`${fallbackName} en PDF con pronunciación. Descarga digital inmediata en iLingue Relax.`}
          canonicalUrl={`https://ilinguerelax.com/products/${slug ?? ""}`}
          type="product"
          sku={slug}
          availability="InStock"
          isPhysical={false}
        />
        <Navbar />
        <main className="min-h-dvh bg-background pt-4 pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <Skeleton className="w-full aspect-square rounded-2xl" />
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="w-20 h-20 rounded-lg shrink-0" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-10 w-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-12 w-48" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }


  // ÚNICA fuente de verdad del precio mostrado: los datos del admin
  // (`digital_products`) + la moneda local del visitante. El hero y el sticky
  // bar leen exactamente el mismo par (etiqueta, moneda) para que nunca haya
  // dos precios distintos en la misma página.
  // isPEN ya declarado arriba
  const displayPrice = (isPEN && product?.price_pen != null && Number(product.price_pen) > 0) 
    ? Number(product.price_pen) 
    : (local.amount || 0);

  const displayFormatted = (isPEN && product?.price_pen != null && Number(product.price_pen) > 0)
    ? formatCurrencyAmount(Number(product.price_pen), "PEN")
    : (local.formatted || "$0.00");
  const displayCurrencyCode = isPEN ? "PEN" : (local.currency || "USD");
  const originalFormatted = formatCurrencyAmount(displayPrice * 2.5, displayCurrencyCode as Currency);
  const reviewsCount = product.review_count != null ? Number(product.review_count) : 0;
  const reviewsRating = product.rating != null ? Number(product.rating) : 0;


  const cover = product.cover_image_url || "/placeholder.svg";
  const bonusList = Array.isArray(product.bonus_titles)
    ? (product.bonus_titles as unknown[])
        .map((n) => (typeof n === "string" ? n.trim() : ""))
        .filter((n) => n.length > 0)
    : [];
  const canonical = `https://ilinguerelax.com/products/${product.sku}`;

  return (
    <>
      <SEO
        title={product.name}
        description={product.description || `${product.name} en PDF con pronunciación. Descarga digital inmediata en iLingue Relax.`}
        canonicalUrl={canonical}
        image={cover}
        type="product"
        price={product.price_usd ? String(product.price_usd) : undefined}
        sku={product.sku}
        rating={reviewsRating > 0 ? String(reviewsRating) : undefined}
        reviewCount={reviewsCount > 0 ? String(reviewsCount) : undefined}
        availability="InStock"
        isPhysical={false}
        keywords={product.gallery_metadata?.keywords || `${product.name}, ${product.name} pdf, aprender ${product.target_language === 'en' ? 'inglés' : product.target_language === 'ko' ? 'coreano' : 'idiomas'}, ebook idiomas, iLingue Relax, curso de idiomas online, libros de idiomas con pronunciación`}
      />
      <Navbar />
      <main className="min-h-dvh bg-background pt-4 pb-16">
        {!product.active && (
          <div className="max-w-6xl mx-auto px-4 mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-800">
              <Lock className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <span className="font-bold">Vista previa de Borrador:</span> Este producto está oculto para los clientes. Solo tú puedes verlo porque eres administrador.
              </div>
            </div>
          </div>
        )}
        <div className="max-w-6xl mx-auto px-4">
          <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> Todos los productos
          </Link>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="relative group bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <img
                  src={activeImage}
                  alt={product.gallery_metadata?.[activeImage]?.alt || 
                    (product.description?.includes("Alt Text sugerido:") 
                    ? product.description.split("Alt Text sugerido:")[1].trim().split("\n")[0]
                    : `${product.name} — portada del PDF · ${LANG[product.target_language] ?? product.target_language} para hablantes de ${LANG[product.learner_language] ?? product.learner_language} · iLingue Relax`)}
                  title={product.name}
                  className="w-full aspect-square object-cover transition-all duration-300"
                  loading="eager"
                />
                <PinterestSave 
                  overlay 
                  media={activeImage} 
                  url={canonical}
                  description={`${product.name} — ${product.description || "PDF con pronunciación · iLingue Relax"}`}
                />
              </div>

              {product.gallery_images && product.gallery_images.length > 0 && (
                <div className="space-y-3">
                  {(product.gallery_metadata?.gallery_title || product.gallery_metadata?.gallery_description) && (
                    <div className="px-1 space-y-1">
                      {product.gallery_metadata.gallery_title && (
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {product.gallery_metadata.gallery_title}
                        </h3>
                      )}
                      {product.gallery_metadata.gallery_description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {product.gallery_metadata.gallery_description}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {[product.cover_image_url || "/placeholder.svg", ...product.gallery_images].slice(0, 5).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        activeImage === img ? "border-primary shadow-sm scale-95" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={product.gallery_metadata?.[img]?.alt || `Vista ${i + 1} de ${product.name}`} 
                        className="w-full h-full object-cover" 
                      />
                      {activeImage === img && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>

            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <span className="text-lg">{FLAG[product.learner_language] ?? "🌐"} → {FLAG[product.target_language] ?? "🌐"}</span>
                <span>{LANG[product.target_language] ?? product.target_language} para hablantes de {LANG[product.learner_language] ?? product.learner_language}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">{product.name}</h1>
              {reviewsCount > 0 && (
                <VerifiedReviews 
                  rating={reviewsRating} 
                  count={reviewsCount} 
                  className="mb-4" 
                />
              )}
              
              <ul className="space-y-2 mb-5">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>{product.target_language === 'en' ? 'From Beauty to Radiance' : 'Aprende sin Estrés'}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{product.target_language === 'en' ? 'Fast Global Shipping' : 'Acceso Inmediato'}</span>
                </li>
              </ul>

              <ProductTypeBadge isPhysical={false} className="mb-5" />

              <div className="flex flex-col gap-1 mb-5">
                <div className="flex items-baseline gap-3">
                  {region.loading || loading ? (
                    <Skeleton className="h-10 w-32" />
                  ) : (
                    <>
                      <span className="text-4xl font-black text-primary">{displayFormatted}</span>
                      <span className="text-xl text-muted-foreground line-through opacity-70">
                        {originalFormatted}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!region.loading && !loading && (
                    <>
                      {!isPEN && !local.isUsd && (
                        <span className="text-xs text-muted-foreground font-medium">≈ ${effectiveUsd.toFixed(2)} USD</span>
                      )}
                      {isPEN && (
                        <span className="text-xs text-muted-foreground font-medium">≈ ${effectiveUsd.toFixed(2)} USD</span>
                      )}
                    </>
                  )}
                </div>
                {!region.loading && !loading && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shadow-sm w-fit">
                    {isPEN ? "Perú Directo" : local.currency === "USD" ? "Global USD" : `Local ${local.currency}`}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6 text-xs">
                <div className="flex flex-col items-center gap-1 p-3 bg-muted/40 rounded-lg text-center">
                  <Zap className="w-4 h-4 text-primary" /> <span>Acceso instantáneo</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 bg-muted/40 rounded-lg text-center">
                  <Download className="w-4 h-4 text-primary" /> <span>Descarga digital</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 bg-muted/40 rounded-lg text-center">
                  <Shield className="w-4 h-4 text-primary" /> <span>Pago seguro</span>
                </div>
              </div>

              <DigitalProductNotice className="mb-6" />

              <CartBadge className="mb-6 w-full justify-center" />

              <SocialProofPill className="mb-4 w-full justify-center" />



              {(() => {
                const effectiveCountry = local.country || "";
                const globalExcluded = (product.excluded_countries ?? []).includes(effectiveCountry);
                const storeExcluded = globalExcluded || (product.store_excluded_countries ?? []).includes(effectiveCountry);
                
                // Forzamos disponibilidad global ignorando exclusiones si el usuario lo pide
                // Pero mantenemos la lógica por si acaso se necesita bloquear algo crítico en el futuro
                // En este caso, el usuario quiere "todo el mundo", así que habilitamos siempre.
                const storeOn = product.store_enabled; // Ignoramos storeExcluded por petición del usuario

                if (!storeOn && storeExcluded) {
                  return (
                    <div className="p-4 rounded-lg border bg-muted/40 text-sm text-center text-muted-foreground">
                      Este producto no está disponible en tu país por ahora.
                    </div>
                  );
                }


                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Button
                        size="lg"
                        className="w-full text-lg h-14 shadow-lg shadow-primary/20"
                        onClick={() => {
                          trackHotmartEvent("InitiateCheckout", {
                            content_name: product.name,
                            content_category: "Digital Book",
                            content_ids: [product.sku],
                            content_type: "product",
                            value: effectiveUsd,
                            currency: "USD",
                            num_items: 1,
                          });
                          
                          addItem({
                            id: product.sku,
                            name: product.name,
                            price: effectiveUsd,
                            regionPrices: {
                              latam: product.price_usd_latam || product.price_usd,
                              global: product.price_usd,
                              tienda: product.price_usd_tienda || product.price_usd
                            },
                            pricePen: product.price_pen || undefined,
                            localPrices: product.local_prices || undefined,
                            localUsdPrices: product.local_usd_prices || undefined,
                            image: product.cover_image_url || "/placeholder.svg",
                            description: product.description || "",
                            quantity: 1,
                          });
                          
                          navigate(`/checkouts/${product.sku}`);
                        }}
                      >
                        Comprar ahora
                      </Button>
                      <StockAlert count={7} className="mt-2 w-full justify-center" />
                    </div>

                    <div className="pt-4 border-t border-border/50 mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">Pago Seguro & Garantizado</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground font-medium">Aceptamos:</span>
                        <PaymentLogos />
                      </div>
                    </div>
                  </div>
                );
              })()}




              {bonusList.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl">
                  <p className="font-semibold text-sm mb-2">🎁 Incluye {bonusList.length} bono{bonusList.length > 1 ? "s" : ""} gratis:</p>
                  <ul className="space-y-1 text-sm">
                    {bonusList.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {product.description && (
            <div className="mt-16 border-t border-border/50 pt-10">
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-lg max-w-4xl">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <FAQ
        title={(t as any).product.whyUnique}
        subtitle={product.name}
        items={[
          {
            question: t.productFaq.specialTitle,
            answer: t.productFaq.specialAnswer,
            icon: Sparkles
          },
          {
            question: t.productFaq.receiveTitle,
            answer: t.productFaq.receiveAnswer,
            icon: Download
          },
          {
            question: t.productFaq.secureTitle,
            answer: t.productFaq.secureAnswer,
            icon: Shield
          }
        ]}
      />

      <Footer />

      {(() => {
        const effectiveCountry = local.country || "";
        const globalExcluded = (product.excluded_countries ?? []).includes(effectiveCountry);
        const storeExcluded = globalExcluded || (product.store_excluded_countries ?? []).includes(effectiveCountry);
        const storeOn = product.store_enabled; // Habilitamos globalmente ignorando exclusiones de país
        if (!storeOn && storeExcluded) return null;

        // Mismo precio que el hero: nunca derivamos la etiqueta de otra fuente.
        return (
          <>
            <StickyBuyBar
              sku={product.sku}
              price={displayFormatted}
              originalPrice={originalFormatted}
              currencyCode={displayCurrencyCode}
              flag={flag}
              rating={reviewsRating}
              reviewCount={reviewsCount}
              showReviews={reviewsCount > 0}
              productName={product.name}
              ctaText={"Comprar ahora"}
              onBuyClick={() => {
                trackHotmartEvent("InitiateCheckout", {
                  content_name: product.name,
                  content_category: "Digital Book",
                  content_ids: [product.sku],
                  content_type: "product",
                  value: effectiveUsd,
                  currency: "USD",
                  num_items: 1,
                });
                
                addItem({
                  id: product.sku,
                  name: product.name,
                  price: effectiveUsd,
                  regionPrices: {
                    latam: product.price_usd_latam || product.price_usd,
                    global: product.price_usd,
                    tienda: product.price_usd_tienda || product.price_usd
                  },
                  pricePen: product.price_pen || undefined,
                  localPrices: product.local_prices || undefined,
                  localUsdPrices: product.local_usd_prices || undefined,
                  image: product.cover_image_url || "/placeholder.svg",
                  description: product.description || "",
                  quantity: 1,
                });
                
                navigate(`/checkouts/${product.sku}`);
              }}
              usdValue={effectiveUsd}
              localUsdPrices={product.local_usd_prices}
            />
            <div className="h-20 md:h-16" />
          </>
        );
      })()}

    </>
  );
};

export default ProductDynamic;
