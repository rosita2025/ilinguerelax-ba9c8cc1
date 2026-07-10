import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Check, ArrowLeft, Download, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";

interface DBProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  learner_language: string;
  target_language: string;
  price_usd: number;
  price_pen: number | null;
  cover_image_url: string | null;
  is_upsell: boolean;
  active: boolean;
  bonuses: unknown;
  hotmart_url: string | null;
  store_enabled: boolean;
  excluded_countries: string[] | null;
  store_excluded_countries: string[] | null;
  hotmart_excluded_countries: string[] | null;
}

const COUNTRY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "auto", label: "🌐 Auto (detectar por IP)" },
  { code: "PE", label: "🇵🇪 Perú" },
  { code: "MX", label: "🇲🇽 México" },
  { code: "CO", label: "🇨🇴 Colombia" },
  { code: "AR", label: "🇦🇷 Argentina" },
  { code: "CL", label: "🇨🇱 Chile" },
  { code: "BR", label: "🇧🇷 Brasil" },
  { code: "US", label: "🇺🇸 Estados Unidos" },
  { code: "CA", label: "🇨🇦 Canadá" },
  { code: "GB", label: "🇬🇧 Reino Unido" },
  { code: "ES", label: "🇪🇸 España" },
  { code: "FR", label: "🇫🇷 Francia" },
  { code: "DE", label: "🇩🇪 Alemania" },
  { code: "JP", label: "🇯🇵 Japón" },
  { code: "KR", label: "🇰🇷 Corea" },
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
    (async () => {
      const { data, error } = await supabase
        .from("digital_products")
        .select("id, sku, name, description, learner_language, target_language, price_usd, price_pen, cover_image_url, is_upsell, active, bonuses, hotmart_url, store_enabled, excluded_countries")
        .eq("sku", slug)
        .eq("active", true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) setNotFound(true);
      else setProduct(data as unknown as DBProduct);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const local = useLocalCurrency(product ? Number(product.price_usd) : 0);

  if (notFound) return <Navigate to="/404" replace />;
  if (loading || !product) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando producto…</div>
      </div>
    );
  }

  const isPEN = local.country === "PE" && product.price_pen != null;
  const displayPrice = isPEN ? Number(product.price_pen) : local.amount;
  const displayFormatted = isPEN
    ? `S/ ${Number(product.price_pen).toFixed(2)}`
    : local.formatted;

  const cover = product.cover_image_url || "/placeholder.svg";
  const bonusList = Array.isArray(product.bonuses)
    ? (product.bonuses as Array<{ name?: string }>).filter((b) => b?.name)
    : [];
  const canonical = `https://ilinguerelax.com/products/${product.sku}`;

  return (
    <>
      <SEO
        title={`${product.name} | ILINGUE RELAX`}
        description={product.description || `${product.name} — descarga digital inmediata.`}
        canonicalUrl={canonical}
        image={cover}
      />
      <Navbar />
      <main className="min-h-dvh bg-background pt-4 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> Todos los productos
          </Link>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <img src={cover} alt={product.name} className="w-full aspect-square object-cover" loading="eager" />
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
                  <span className="text-sm text-muted-foreground">≈ ${Number(product.price_usd).toFixed(2)} USD</span>
                )}
                {isPEN && (
                  <span className="text-sm text-muted-foreground">≈ ${Number(product.price_usd).toFixed(2)} USD</span>
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

              {(() => {
                const effectiveCountry = (simCountry === "auto" ? local.country : simCountry) || "";
                const excluded = (product.excluded_countries ?? []).includes(effectiveCountry);
                const storeOn = product.store_enabled && !excluded;
                const hotmartOn = !!product.hotmart_url && !excluded;

                if (!storeOn && !hotmartOn) {
                  return (
                    <div className="p-4 rounded-lg border bg-muted/40 text-sm text-center text-muted-foreground">
                      Este producto no está disponible en tu país por ahora.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {storeOn && (
                      <Button asChild size="lg" className="w-full">
                        <Link to={`/checkouts/${product.sku}`}>
                          {hotmartOn ? "Comprar en la tienda" : "Comprar ahora"} · {displayFormatted}
                        </Link>
                      </Button>
                    )}
                    {hotmartOn && (
                      <Button asChild size="lg" className="w-full bg-[#EF4E23] hover:bg-[#d73f18] text-white">
                        <a href={product.hotmart_url!} target="_blank" rel="noopener noreferrer">
                          Comprar en Hotmart · {displayFormatted}
                        </a>
                      </Button>
                    )}
                  </div>
                );
              })()}

              {/* Simulador de región (solo visual, para pruebas) */}
              <details className="mt-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none">🧪 Simular país (pruebas)</summary>
                <select
                  value={simCountry}
                  onChange={(e) => setSimCountry(e.target.value)}
                  className="mt-2 w-full border rounded px-2 py-1 bg-background"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <p className="mt-1">País detectado por IP: <b>{local.country || "?"}</b></p>
              </details>

              {bonusList.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl">
                  <p className="font-semibold text-sm mb-2">🎁 Incluye {bonusList.length} bono{bonusList.length > 1 ? "s" : ""} gratis:</p>
                  <ul className="space-y-1 text-sm">
                    {bonusList.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {b.name}
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
    </>
  );
};

export default ProductDynamic;
