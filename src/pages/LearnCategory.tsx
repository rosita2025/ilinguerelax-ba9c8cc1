import { Link, Navigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Download, BookOpen } from "lucide-react";
import { products as staticProducts, getProductLink, type Product } from "@/data/products";
import { useDigitalProducts } from "@/hooks/useDigitalProducts";
import { useCardPrice } from "@/hooks/useCardPrice";
import { useI18n } from "@/i18n/I18nContext";
import { LANG_LABEL, LEARN_PAIRS, defaultPairFor, parsePairSlug } from "@/lib/learnPairs";
import { ProductCoverImage } from "@/components/ProductCoverImage";

/**
 * Dedicated learning-category page:  /aprender/:pair  (e.g. /aprender/es-en)
 * - Auto-redirects the empty /aprender to the visitor's detected pair (IP-based).
 * - No pickers: the URL fixes the pair, so elderly users can't get lost.
 * - Coherent with the /products "Yo hablo · Quiero aprender" filters.
 */
const LearnCategory = () => {
  const { pair: pairSlug } = useParams();
  const { language: uiLang } = useI18n();
  const { items: dbProducts } = useDigitalProducts();
  const cardPrice = useCardPrice();

  // /aprender (no slug) → redirect to detected pair.
  if (!pairSlug) {
    const [f, t] = defaultPairFor(uiLang);
    return <Navigate to={`/aprender/${f}-${t}`} replace />;
  }

  const pair = parsePairSlug(pairSlug);
  if (!pair) return <Navigate to="/aprender" replace />;
  const [from, to] = pair;

  const fromMeta = LANG_LABEL[from];
  const toMeta = LANG_LABEL[to];
  const inEnglish = from === "en";

  const products = useMemo<Product[]>(() => {
    const existing = new Set(staticProducts.map((p) => p.id));
    const staticSlugs = new Set(staticProducts.map((p) => p.slug));
    const dbBySlug = new Map(dbProducts.map((p) => [p.slug, p] as const));
    // Admin's cover image wins over the static one so /admin/productos edits propagate.
    const merged = staticProducts.map((p) => {
      const db = dbBySlug.get(p.slug);
      return db && db.image && db.image !== "/placeholder.svg" ? { ...p, image: db.image } : p;
    });
    const extra = dbProducts.filter((p) => !existing.has(p.id) && !staticSlugs.has(p.slug));
    return [...merged, ...extra].filter(
      (p) => p.learnerLanguage === from && p.targetLanguage === to,
    );
  }, [dbProducts, from, to]);

  const title = inEnglish
    ? `Learn ${toMeta.en} for ${fromMeta.en} speakers · iLingue Relax`
    : `Aprender ${toMeta.es} para ${fromMeta.native.toLowerCase()}hablantes · iLingue Relax`;
  const description = inEnglish
    ? `Digital books and courses to learn ${toMeta.en} designed for ${fromMeta.en} speakers. Native pronunciation, PDF download, lifetime access.`
    : `Libros digitales y cursos para aprender ${toMeta.es} pensados para ${fromMeta.native.toLowerCase()}hablantes. Pronunciación nativa, descarga PDF, acceso de por vida.`;
  const h1 = inEnglish
    ? `Learn ${toMeta.en} · Made for ${fromMeta.en} speakers`
    : `Aprende ${toMeta.es} · Pensado para ${fromMeta.native.toLowerCase()}hablantes`;
  const kw = inEnglish
    ? `learn ${toMeta.en.toLowerCase()}, ${toMeta.en.toLowerCase()} for ${fromMeta.en.toLowerCase()} speakers, ${toMeta.en.toLowerCase()} pdf, ${toMeta.en.toLowerCase()} course, ${toMeta.en.toLowerCase()} pronunciation`
    : `aprender ${toMeta.es}, ${toMeta.es} para ${fromMeta.native.toLowerCase()}hablantes, ${toMeta.es} pdf, curso de ${toMeta.es}, pronunciación en ${fromMeta.native.toLowerCase()}`;

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={title}
        description={description}
        canonicalUrl={`https://ilinguerelax.com/aprender/${from}-${to}`}
        keywords={kw}
        productList={products.map((p) => ({
          name: p.title,
          description: p.description,
          price: p.price,
          image: `https://ilinguerelax.com${p.image}`,
          url: `https://ilinguerelax.com/products/${p.slug}`,
          rating: p.rating,
          reviewCount: p.reviews,
        }))}
        breadcrumbs={[
          { name: inEnglish ? "Home" : "Inicio", url: "https://ilinguerelax.com" },
          { name: inEnglish ? "Learn" : "Aprender", url: "https://ilinguerelax.com/aprender" },
          { name: `${fromMeta.native} → ${toMeta.native}`, url: `https://ilinguerelax.com/aprender/${from}-${to}` },
        ]}
      />
      <Navbar />

      <section className="pt-32 pb-12 gradient-hero">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white/10 text-primary-foreground/90 text-sm font-semibold">
            <span className="text-lg">{fromMeta.flag}</span>
            <span>→</span>
            <span className="text-lg">{toMeta.flag}</span>
            <span>{fromMeta.native} → {toMeta.native}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">{h1}</h1>
          <p className="text-lg text-primary-foreground/90">{description}</p>
        </div>
      </section>

      {/* Cross-links to other pairs — SEO-friendly, single row, no picker. */}
      <nav aria-label="Otras categorías de aprendizaje" className="py-4 border-b border-border/50 bg-secondary/30">
        <div className="container px-3 md:px-6 max-w-4xl mx-auto flex flex-wrap gap-2 justify-center">
          {LEARN_PAIRS.map(([f, t]) => {
            const active = f === from && t === to;
            return (
              <Link
                key={`${f}-${t}`}
                to={`/aprender/${f}-${t}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/50"
                }`}
              >
                <span>{LANG_LABEL[f].flag}</span>→<span>{LANG_LABEL[t].flag}</span>
                <span className="hidden md:inline">{LANG_LABEL[f].native} → {LANG_LABEL[t].native}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <section className="py-10 md:py-16">
        <div className="container px-4 md:px-6">
          {products.length === 0 ? (
            <div className="text-center py-12 max-w-lg mx-auto">
              <p className="text-muted-foreground mb-4">
                {inEnglish
                  ? "New titles coming soon for this pair."
                  : "Muy pronto añadiremos títulos para esta combinación."}
              </p>
              <Link to="/products">
                <Button variant="outline">
                  {inEnglish ? "Browse full catalog" : "Ver catálogo completo"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-card rounded-3xl border border-border shadow-card hover:shadow-hero transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 rounded-full gradient-accent text-accent-foreground text-xs font-bold">
                      {product.badge}
                    </span>
                  </div>
                  <div className="relative h-64 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-8">
                    <ProductCoverImage
                      src={product.image}
                      alt={`${product.title} — ${fromMeta.native} → ${toMeta.native} · iLingue Relax`}
                      title={product.title}
                      loading="lazy"
                      width={400}
                      height={400}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{product.flag}</span>
                      <span className="text-sm text-muted-foreground">{product.country}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(product.formats ?? (product.isPhysical ? ['physical'] : ['digital'])).includes('digital') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                          <Download className="w-3 h-3" /> Digital
                        </span>
                      )}
                      {(product.formats ?? (product.isPhysical ? ['physical'] : ['digital'])).includes('physical') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
                          <BookOpen className="w-3 h-3" /> Físico
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">({product.reviews})</span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-1">{product.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{product.subtitle}</p>
                    <div className="flex items-baseline gap-2 mb-6 flex-wrap">
                      <span className="text-3xl font-bold text-foreground">{cardPrice.format(product.slug, product.price)}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-lg text-muted-foreground line-through">${product.originalPrice}</span>
                      )}
                      <span className="text-sm text-accent font-medium">{cardPrice.currencyLabel(product.slug)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">{cardPrice.regionLabel}</span>
                    </div>
                    <Link to={getProductLink(product)}>
                      <Button variant="hero" size="lg" className="w-full">
                        {inEnglish ? "View details" : "Ver detalles"}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default LearnCategory;
