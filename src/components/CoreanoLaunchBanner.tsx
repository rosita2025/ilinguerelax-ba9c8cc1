import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import coverAsset from "@/assets/coreano-100-mapas-cover.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useCardPrice } from "@/hooks/useCardPrice";

interface LaunchProduct {
  sku: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  target_language: string;
}

const FLAG: Record<string, string> = {
  es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", pt: "🇵🇹", ko: "🇰🇷",
  de: "🇩🇪", it: "🇮🇹", ja: "🇯🇵", nl: "🇳🇱",
};
const LANG_NAME: Record<string, string> = {
  es: "Español", en: "Inglés", fr: "Francés", pt: "Portugués", ko: "Coreano",
  de: "Alemán", it: "Italiano", ja: "Japonés", nl: "Neerlandés",
};

const FALLBACK: LaunchProduct[] = [
  {
    sku: "100-mapas-mentales-para-aprender-coreano-hangul-c1",
    name: "Aprende coreano con +100 Mapas Mentales",
    description: "Método visual y natural conectado con k-dramas, K-pop y cultura coreana. Desde cero (A1) hasta nivel avanzado.",
    cover_image_url: coverAsset.url,
    target_language: "ko",
  },
];

export const CoreanoLaunchBanner = () => {
  const cardPrice = useCardPrice();
  const [products, setProducts] = useState<LaunchProduct[]>(FALLBACK);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("digital_products")
        .select("sku, name, description, cover_image_url, target_language, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(2);
      if (!cancelled && data && data.length > 0) {
        setProducts(data as LaunchProduct[]);
        setIndex(0);
      }
    };
    load();

    // Realtime desactivado por seguridad (la fila completa incluía los enlaces).
    const poll = window.setInterval(() => { load(); }, 120000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, []);

  // Auto-rotate every 6s when there are 2+ products.
  useEffect(() => {
    if (products.length < 2) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % products.length);
    }, 6000);
    return () => clearInterval(t);
  }, [products.length]);

  const product = products[index] ?? FALLBACK[0];
  const flag = FLAG[product.target_language] ?? "🌟";
  const langName = LANG_NAME[product.target_language] ?? "idioma";
  const hasMultiple = products.length > 1;

  const go = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + dir + products.length) % products.length);
  };

  return (
    <section className="py-10 md:py-14 bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="container mx-auto px-4">
        <div className="relative">
          <Link
            key={product.sku}
            to={`/products/${product.sku}`}
            className="group block rounded-2xl border border-primary/20 bg-card shadow-lg hover:shadow-xl transition-all overflow-hidden animate-fade-in"
          >
            <div className="grid md:grid-cols-2 gap-0 items-center">
              <div className="relative aspect-[4/3] md:aspect-auto md:h-full overflow-hidden bg-muted">
                <img
                  src={product.cover_image_url || coverAsset.url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-bold shadow">
                  <Sparkles className="w-3 h-3" /> NUEVO LANZAMIENTO
                </span>
              </div>

              <div className="p-6 md:p-8 space-y-3">
                <p className="text-sm font-semibold text-primary">{flag} Nuevo en {langName}</p>
                <h2 className="text-2xl md:text-3xl font-bold text-balance">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="text-muted-foreground text-pretty line-clamp-3">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <span className="text-3xl font-bold text-primary">{cardPrice.format(product.sku, 10)}</span>
                  <span className="text-sm text-muted-foreground">{cardPrice.currencyLabel(product.sku)} · pago único</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">{cardPrice.regionLabel}</span>
                </div>
                <div className="inline-flex items-center gap-2 text-primary font-semibold pt-2 group-hover:gap-3 transition-all">
                  Ver el producto <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          {hasMultiple && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={go(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/90 hover:bg-background border border-border shadow p-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={go(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/90 hover:bg-background border border-border shadow p-2"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex justify-center gap-2 mt-4">
                {products.map((p, i) => (
                  <button
                    key={p.sku}
                    type="button"
                    aria-label={`Ir al producto ${i + 1}`}
                    onClick={(e) => { e.preventDefault(); setIndex(i); }}
                    className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-primary/30"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
