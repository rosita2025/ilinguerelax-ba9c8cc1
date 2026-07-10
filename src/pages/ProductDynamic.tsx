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
}

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

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("digital_products")
        .select("id, sku, name, description, learner_language, target_language, price_usd, price_pen, cover_image_url, is_upsell, active, bonuses")
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
        ogImage={cover}
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

              <Button asChild size="lg" className="w-full">
                <Link to={`/checkouts/${product.sku}`}>Comprar ahora · {displayFormatted}</Link>
              </Button>

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
