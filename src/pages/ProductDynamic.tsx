import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Check, ArrowLeft, Download, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { DigitalProductNotice } from "@/components/DigitalProductNotice";

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

const COUNTRY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "auto", label: "🌐 Auto (detectar por IP)" },
  ...Object.entries(COUNTRY_INFO)
    .map(([code, info]) => ({ code, label: `${info.flag} ${info.name}` }))
    .sort((a, b) => a.label.localeCompare(b.label)),
];


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
  const [simCountry, setSimCountry] = useState<string>("auto");

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
    const unsubscribe = subscribeCatalogUpdates({ sku: slug, onUpdate: load });
    const channel = supabase
      .channel(`product_dynamic_${slug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "digital_products", filter: `sku=eq.${slug}` },
        () => { load(); }
      )
      .subscribe();
    return () => {
      cancelled = true;
      unsubscribe();
      supabase.removeChannel(channel);
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
    // navegar desde la home. Renderizamos nada mientras llega el catálogo.
    return <div className="min-h-dvh bg-background" />;
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
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <img
                src={cover}
                alt={`${product.name} — portada del PDF · ${LANG[product.target_language] ?? product.target_language} para hablantes de ${LANG[product.learner_language] ?? product.learner_language} · iLingue Relax`}
                title={product.name}
                className="w-full aspect-square object-cover"
                loading="eager"
              />
            </div>

            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <span className="text-lg">{FLAG[product.learner_language] ?? "🌐"} → {FLAG[product.target_language] ?? "🌐"}</span>
                <span>{LANG[product.target_language] ?? product.target_language} para hablantes de {LANG[product.learner_language] ?? product.learner_language}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">{product.name}</h1>
              {product.description && (
                <p className="text-muted-foreground mb-5 whitespace-pre-line">{product.description}</p>
              )}

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


              {(() => {
                const effectiveCountry = (simCountry === "auto" ? local.country : simCountry) || "";
                const globalExcluded = (product.excluded_countries ?? []).includes(effectiveCountry);
                const storeExcluded = globalExcluded || (product.store_excluded_countries ?? []).includes(effectiveCountry);
                const storeOn = product.store_enabled && !storeExcluded;

                if (!storeOn) {
                  return (
                    <div className="p-4 rounded-lg border bg-muted/40 text-sm text-center text-muted-foreground">
                      Este producto no está disponible en tu país por ahora.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    <Button asChild size="lg" className="w-full">
                      <Link to={`/checkouts/${product.sku}`}>
                        Comprar ahora
                      </Link>
                    </Button>
                  </div>
                );
              })()}

              {/* Simulador de país (pruebas) */}
              {(() => {
                const effectiveCountry = (simCountry === "auto" ? local.country : simCountry) || "";
                const info = COUNTRY_INFO[effectiveCountry];
                const globalExcluded = (product.excluded_countries ?? []).includes(effectiveCountry);
                const storeExcluded = globalExcluded || (product.store_excluded_countries ?? []).includes(effectiveCountry);
                const storeOn = product.store_enabled && !storeExcluded;
                return (
                  <div className="mt-4 p-3 border border-dashed border-primary/40 rounded-lg bg-muted/30 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">🧪 Simulador de país</span>
                      <span className="text-muted-foreground">IP real: <b>{local.country || "?"}</b></span>
                    </div>
                    <select
                      value={simCountry}
                      onChange={(e) => setSimCountry(e.target.value)}
                      className="w-full border rounded px-2 py-1 bg-background"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <div className="p-2 rounded bg-background border">
                      <div className="mb-1">
                        Para <b>{info ? `${info.flag} ${info.name}` : effectiveCountry || "?"}</b> se mostrará:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {storeOn ? (
                          <span className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30">
                            ✅ Botón Tienda ILINGUE RELAX (checkout interno con Hotmart 1 clic como opción)
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-destructive/10 text-destructive border border-destructive/30">
                            ❌ Ningún botón (país sin canal)
                          </span>
                        )}
                      </div>
                      {storeExcluded && (
                        <div className="mt-2 text-muted-foreground">• Tienda excluida en este país</div>
                      )}
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
        </div>
      </main>
      <Footer />

      {(() => {
        const effectiveCountry = (simCountry === "auto" ? local.country : simCountry) || "";
        const globalExcluded = (product.excluded_countries ?? []).includes(effectiveCountry);
        const storeExcluded = globalExcluded || (product.store_excluded_countries ?? []).includes(effectiveCountry);
        const storeOn = product.store_enabled && !storeExcluded;
        if (!storeOn) return null;
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
