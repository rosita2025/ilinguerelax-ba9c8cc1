import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Check, ArrowLeft, Download, Shield, Zap, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

import { useLocalCurrency } from "@/hooks/useLocalCurrency";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
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
  cover_image_url: string | null;
  is_upsell: boolean;
  active: boolean;
  /** Solo los títulos de los bonos. Los enlaces/claves nunca salen del servidor. */
  bonus_titles: unknown;
  hotmart_url: string | null;
  store_enabled: boolean;
  excluded_countries: string[] | null;
  store_excluded_countries: string[] | null;
  hotmart_excluded_countries: string[] | null;
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
  
  const { t } = useI18n();

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      let data: unknown = null;
      let error: unknown = null;
      try {
        const result = await supabase
          .from("digital_products")
          .select("id, sku, name, description, learner_language, target_language, price_usd, price_usd_latam, price_usd_tienda, price_pen, cover_image_url, is_upsell, active, bonus_titles, hotmart_url, store_enabled, excluded_countries, store_excluded_countries, hotmart_excluded_countries")
          .eq("sku", slug)
          .eq("active", true)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } catch (err) {
        error = err;
      }
      if (cancelled) return;
      if (error || !data) setNotFound(true);
      else { setProduct(data as unknown as DBProduct); setNotFound(false); }
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

  // Pick the correct USD price based on visitor region (tienda VE/CU/NI, LATAM, or global).
  const region = useRegionTier();
  const effectiveUsd = product
    ? (region.tier === "tienda" && product.price_usd_tienda != null
        ? Number(product.price_usd_tienda)
        : region.tier === "latam" && product.price_usd_latam != null
          ? Number(product.price_usd_latam)
          : Number(product.price_usd))
    : 0;
  const local = useLocalCurrency(effectiveUsd, (product as any)?.local_prices ?? null);
  const tier = useCountryTierRouting(slug ?? "");

  // Track ViewContent per SKU for every product (existing + new) in /admin/live
  useEffect(() => {
    if (!product) return;
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
    // Sin pantalla de carga: evitamos el flash "Cargando producto…" al
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
        <div className="min-h-dvh bg-background" />
      </>
    );
  }


  const isPEN = local.country === "PE" && product.price_pen != null;
  const displayPrice = isPEN ? Number(product.price_pen) : local.amount;
  const displayFormatted = isPEN
    ? `S/ ${Number(product.price_pen).toFixed(2)}`
    : local.formatted;

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
        rating="4.8"
        reviewCount="120"
        availability="InStock"
        isPhysical={false}
        keywords={`${product.name}, ${product.name} pdf, aprender ${product.target_language === 'en' ? 'inglés' : product.target_language === 'ko' ? 'coreano' : 'idiomas'}, ebook idiomas, iLingue Relax, curso de idiomas online, libros de idiomas con pronunciación`}
      />
      <Navbar />
      <main className="min-h-dvh bg-background pt-4 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> Todos los productos
          </Link>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="relative group bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <img
                src={cover}
                alt={`${product.name} — portada del PDF · ${LANG[product.target_language] ?? product.target_language} para hablantes de ${LANG[product.learner_language] ?? product.learner_language} · iLingue Relax`}
                title={product.name}
                className="w-full aspect-square object-cover"
                loading="eager"
              />
              <PinterestSave 
                overlay 
                media={cover} 
                url={canonical}
                description={`${product.name} — ${product.description || "PDF con pronunciación · iLingue Relax"}`}
              />
            </div>

            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <span className="text-lg">{FLAG[product.learner_language] ?? "🌐"} → {FLAG[product.target_language] ?? "🌐"}</span>
                <span>{LANG[product.target_language] ?? product.target_language} para hablantes de {LANG[product.learner_language] ?? product.learner_language}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">{product.name}</h1>
              <VerifiedReviews rating={4.8} count={120} className="mb-4" />
              
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

              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-4xl font-bold text-primary">{displayFormatted}</span>
                {!isPEN && !local.isUsd && (
                  <span className="text-sm text-muted-foreground">≈ ${effectiveUsd.toFixed(2)} USD</span>
                )}
                {isPEN && (
                  <span className="text-sm text-muted-foreground">≈ ${effectiveUsd.toFixed(2)} USD</span>
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
                      <Button asChild size="lg" className="w-full text-lg h-14 shadow-lg shadow-primary/20">
                        <Link to={`/checkouts/${product.sku}`}>
                          Comprar ahora
                        </Link>
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

        const priceLabel = tier.loaded ? tier.priceLabel : displayFormatted;
        const originalLabel = tier.loaded ? tier.originalLabel : undefined;
        return (
          <>
            <StickyBuyBar
              price={priceLabel}
              originalPrice={originalLabel}
              currencyCode={tier.loaded ? tier.currencyCode : local.currency}
              flag={tier.isPeru ? "🇵🇪" : undefined}
              rating={4.8}
              reviewCount={120}
              productName={product.name}
              ctaText={"Comprar ahora"}
              buyUrl={`/checkouts/${product.sku}`}
            />
            <div className="h-20 md:h-16" />
          </>
        );
      })()}

    </>
  );
};

export default ProductDynamic;
