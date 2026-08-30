import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Star, Gift, Search, Download, BookOpen } from "lucide-react";
import { products as staticProducts, getProductLink, type Product } from "@/data/products";
import { useDigitalProducts } from "@/hooks/useDigitalProducts";
import { useCardPrice } from "@/hooks/useCardPrice";
import { cn } from "@/lib/utils";
import { ProductCoverImage } from "@/components/ProductCoverImage";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useI18n } from "@/i18n/I18nContext";
import type { LangCode } from "@/data/products";

const LANG_META: Record<LangCode, { flag: string; label: string }> = {
  es: { flag: "🇪🇸", label: "Español" },
  en: { flag: "🇬🇧", label: "English" },
  fr: { flag: "🇫🇷", label: "Français" },
  pt: { flag: "🇵🇹", label: "Português" },
  ko: { flag: "🇰🇷", label: "한국어" },
  de: { flag: "🇩🇪", label: "Deutsch" },
  it: { flag: "🇮🇹", label: "Italiano" },
  ja: { flag: "🇯🇵", label: "日本語" },
  nl: { flag: "🇳🇱", label: "Nederlands" },
  zh: { flag: "🇨🇳", label: "中文" },
};

const Products = () => {
  const { language: uiLang } = useI18n();
  // "Hablo" auto-defaults to the visitor's detected UI language (IP/subdomain-based).
  const defaultLearner: LangCode = (["es","en","fr","pt"].includes(uiLang) ? uiLang : "es") as LangCode;
  const [type, setType] = useState<"all" | "digital" | "physical">("all");
  const [learnerLang, setLearnerLang] = useState<LangCode | "all">(defaultLearner);
  const [targetLang, setTargetLang] = useState<LangCode | "all">("all");
  const [search, setSearch] = useState("");

  // Merge static catalog with products managed from /admin/productos.
  // DB products are appended, skipping any whose sku matches an existing static id/slug.
  const { items: dbProducts } = useDigitalProducts();
  const products = useMemo<Product[]>(() => {
    const existing = new Set(staticProducts.map((p) => p.id));
    const staticSlugs = new Set(staticProducts.map((p) => p.slug));
    const dbBySlug = new Map(dbProducts.map((p) => [p.slug, p] as const));
    // Static products keep their rich metadata, but admin's cover image wins
    // so edits made in /admin/productos show up here immediately.
    const merged = staticProducts.map((p) => {
      const db = dbBySlug.get(p.slug || p.id);
      return db && db.image && db.image !== "/placeholder.svg" ? { ...p, image: db.image, active: db.active !== false } : { ...p, active: true };
    });
    const extra = dbProducts.filter((p) => !existing.has(p.id) && !staticSlugs.has(p.slug));
    return [...merged, ...extra];
  }, [dbProducts]);


  // Pricing logic is now handled centrally by useCardPrice hook.
  // We keep a small local detection only for UI-specific tweaks if needed, 
  // but primary formatting MUST use cardPrice.
  const cardPrice = useCardPrice();
  
  const priceFor = (p: typeof products[number]) => p.price;

  // Collect available learner/target language codes from the merged catalog.
  const { learners, targets } = useMemo(() => {
    const l = new Set<LangCode>();
    const t = new Set<LangCode>();
    for (const p of products) {
      if (p.learnerLanguage) l.add(p.learnerLanguage);
      if (p.targetLanguage) t.add(p.targetLanguage);
    }
    return { learners: Array.from(l), targets: Array.from(t) };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      // Si el producto viene de la DB y tiene 'active' explícito, lo respetamos (filtramos borradores)
      // Nota: p.active puede estar en Product si lo mapeamos en useDigitalProducts
      if (p.active === false) return false;

      const formats = p.formats ?? (p.isPhysical ? ['physical'] : ['digital']);
      if (type === "digital" && !formats.includes('digital')) return false;
      if (type === "physical" && !formats.includes('physical')) return false;
      if (learnerLang !== "all" && p.learnerLanguage && p.learnerLanguage !== learnerLang) return false;
      if (targetLang !== "all" && p.targetLanguage && p.targetLanguage !== targetLang) return false;
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.subtitle.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q) &&
        !p.country.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [type, learnerLang, targetLang, search, products]);

  // Group products that share a groupId so digital + physical appear in a single card
  type Group = {
    key: string;
    primary: Product;
    digital: Product | null;
    physical: Product | null;
  };
  const grouped = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    const order: string[] = [];
    for (const p of filtered) {
      const key = p.groupId || p.id;
      let g = map.get(key);
      if (!g) {
        g = { key, primary: p, digital: null, physical: null };
        map.set(key, g);
        order.push(key);
      }
      if (p.isPhysical) g.physical = p;
      else g.digital = p;
      // Prefer physical product as primary visual (richer card)
      if (p.isPhysical) g.primary = p;
    }
    return order.map((k) => map.get(k)!);
  }, [filtered]);

  // Counts per language for the current format filter (for chip badges)
  const langCounts = useMemo(() => {
    const base = products.filter((p) => {
      const formats = p.formats ?? (p.isPhysical ? ['physical'] : ['digital']);
      if (type === "digital" && !formats.includes('digital')) return false;
      if (type === "physical" && !formats.includes('physical')) return false;
      return true;
    });
    // Count unique groups so the badge matches the rendered card count
    const seenAll = new Set<string>();
    const seenByFlag = new Map<string, Set<string>>();
    for (const p of base) {
      const key = p.groupId || p.id;
      seenAll.add(key);
      if (!seenByFlag.has(p.flag)) seenByFlag.set(p.flag, new Set());
      seenByFlag.get(p.flag)!.add(key);
    }
    const counts: Record<string, number> = { all: seenAll.size };
    for (const [flag, set] of seenByFlag) counts[flag] = set.size;
    return counts;
  }, [type, products]);

  const formats: { key: "digital" | "physical"; icon: typeof Download; label: string; desc: string }[] = [
    { key: "digital", icon: Download, label: "Digital", desc: "Descarga inmediata · PDF" },
    { key: "physical", icon: BookOpen, label: "Físico", desc: "Libro impreso · Envío" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Catálogo iLingue Relax · Libros de Idiomas PDF"
        description="Libros y ebooks para aprender inglés, coreano, francés, alemán, italiano, portugués y neerlandés con pronunciación en español. Descarga inmediata desde $10."
        canonicalUrl="https://ilinguerelax.com/products"
        keywords="libros para aprender idiomas, aprender inglés pdf, aprender coreano pdf, aprender francés pdf, aprender alemán pdf, aprender italiano pdf, aprender portugués pdf, aprender neerlandés pdf, ebooks de idiomas, libros con pronunciación en español, catálogo iLingue Relax, cursos de idiomas para hispanohablantes"
        productList={products.map((product) => ({
          name: product.title,
          description: product.description,
          price: product.price || 0,
          image: `https://ilinguerelax.com${product.image}`,
          url: `https://ilinguerelax.com/products/${product.slug}`,
          rating: product.rating,
          reviewCount: product.reviews,
        }))}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Catálogo de Libros de Idiomas con Pronunciación
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Elige el libro digital perfecto para tu nivel y comienza a aprender idiomas sin estrés
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="pt-8 pb-4 bg-secondary/30 border-b border-border/50">
        <div className="container px-3 md:px-6 max-w-3xl mx-auto">
          {/* Step 1: Format */}
          <p className="text-center text-xs md:text-sm font-semibold text-muted-foreground mb-3">
            1. Elige el formato
          </p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
            {formats.map((f) => {
              const Icon = f.icon;
              const isActive = type === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setType(isActive ? "all" : f.key)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl border-2 transition-all text-left min-h-[64px] active:scale-[0.98]",
                    isActive
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground text-sm sm:text-base leading-tight">{f.label}</div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground leading-tight mt-0.5 line-clamp-2 sm:truncate">
                      {f.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step 2: Hablo (native language) */}
          <p className="text-center text-xs md:text-sm font-semibold text-muted-foreground mb-3">
            2. Yo hablo / I speak
          </p>
          <div className="-mx-3 px-3 mb-4 md:mx-0 md:px-0">
            <div className="flex md:flex-wrap md:justify-center gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              <button
                onClick={() => setLearnerLang("all")}
                aria-pressed={learnerLang === "all"}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all shrink-0 snap-start min-h-[44px] active:scale-95",
                  learnerLang === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-card text-foreground border-border hover:border-foreground/40"
                )}
              >
                <span className="text-base">🌐</span>
                <span>Todos</span>
              </button>
              {learners.map((code) => {
                const meta = LANG_META[code];
                if (!meta) return null;
                const isActive = learnerLang === code;
                return (
                  <button
                    key={code}
                    onClick={() => setLearnerLang(code)}
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all shrink-0 snap-start min-h-[44px] active:scale-95",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-card text-foreground border-border hover:border-foreground/40"
                    )}
                  >
                    <span className="text-base font-bold">{meta.flag}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Quiero aprender (target language) */}
          <p className="text-center text-xs md:text-sm font-semibold text-muted-foreground mb-3">
            3. Quiero aprender / I want to learn
          </p>
          <div className="-mx-3 px-3 mb-4 md:mx-0 md:px-0">
            <div className="flex md:flex-wrap md:justify-center gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              <button
                onClick={() => setTargetLang("all")}
                aria-pressed={targetLang === "all"}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all shrink-0 snap-start min-h-[44px] active:scale-95",
                  targetLang === "all"
                    ? "bg-accent text-accent-foreground border-accent shadow-md scale-105"
                    : "bg-card text-foreground border-border hover:border-foreground/40"
                )}
              >
                <span className="text-base">🌐</span>
                <span>Todos</span>
              </button>
              {targets.map((code) => {
                const meta = LANG_META[code];
                if (!meta) return null;
                const isActive = targetLang === code;
                return (
                  <button
                    key={code}
                    onClick={() => setTargetLang(code)}
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all shrink-0 snap-start min-h-[44px] active:scale-95",
                      isActive
                        ? "bg-accent text-accent-foreground border-accent shadow-md scale-105"
                        : "bg-card text-foreground border-border hover:border-foreground/40"
                    )}
                  >
                    <span className="text-base font-bold">{meta.flag}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>


          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto, idioma…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-border/70 bg-background/70 focus-visible:ring-primary/40"
            />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-10 md:py-16">
        <div className="container px-4 md:px-6">
          {grouped.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No hay productos que coincidan con tu búsqueda.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {grouped.map(({ key, primary, digital, physical }) => {
              const product = primary;
              const hasBoth = !!digital && !!physical;
              return (
              <div
                key={key}
                className="group relative bg-card rounded-3xl border border-border shadow-card hover:shadow-hero transition-all duration-500 overflow-hidden"
              >
                {/* Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 rounded-full gradient-accent text-accent-foreground text-xs font-bold">
                    {product.badge}
                  </span>
                </div>

                {/* Format tags (Digital / Physical) - Top Left */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                  {(() => {
                    const formats = product.formats ?? (product.isPhysical ? ['physical'] : ['digital']);
                    return formats.map(f => (
                      <span key={f} className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm",
                        f === 'physical' ? "bg-orange-500 text-white" : "bg-primary text-primary-foreground"
                      )}>
                        {f === 'physical' ? <BookOpen className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                        {f}
                      </span>
                    ));
                  })()}
                </div>

                {/* Product Image Area */}
                <div className="relative h-72 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-8">
                  <ProductCoverImage
                    src={product.image}
                    alt={`${product.title} — ${product.country} · Portada del libro digital · iLingue Relax`}
                    title={product.title}
                    loading="lazy"
                    width={400}
                    height={400}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{product.flag}</span>
                    <span className="text-sm text-muted-foreground">{product.country}</span>
                  </div>

                  {/* Format tags (Digital / Physical) */}
                  {(() => {
                    const formats = product.formats ?? (product.isPhysical ? ['physical'] : ['digital']);
                    return (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {formats.includes('digital') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                            <Download className="w-3 h-3" /> Digital
                          </span>
                        )}
                        {formats.includes('physical') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
                            <BookOpen className="w-3 h-3" /> Físico
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-accent text-accent"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews} reseñas)
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {product.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    {product.subtitle}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Digital Free Badge for Physical Products (only when not grouped) */}
                  {product.isPhysical && !hasBoth && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        🎁 Incluye versión digital GRATIS
                      </span>
                    </div>
                  )}

                  {hasBoth ? (
                    /* Combined Digital + Physical options */
                    <div className="space-y-2.5">
                      {[
                        { p: digital!, icon: Download, label: "Digital", sub: "Descarga PDF" },
                        { p: physical!, icon: BookOpen, label: "Físico", sub: "Libro impreso" },
                      ].map(({ p, icon: Icon, label, sub }) => (
                        <Link
                          key={p.id}
                          to={getProductLink(p)}
                          className="flex items-center gap-3 p-3 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group/opt"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-foreground text-sm">{label}</span>
                              <span className="text-[11px] text-muted-foreground">{sub}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-foreground">{cardPrice.format(p.slug || p.id, priceFor(p))}</span>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-xs text-muted-foreground line-through">{cardPrice.formatOriginal(p.slug || p.id, p.originalPrice, p.price)}</span>
                              )}
                              <span className="text-[10px] text-accent font-semibold">{cardPrice.currencyLabel(p.slug)}</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{cardPrice.regionLabel}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/opt:text-primary group-hover/opt:translate-x-0.5 transition-all" />
                        </Link>
                      ))}
                      <p className="text-[11px] text-center text-muted-foreground pt-1">
                        🎁 El libro físico incluye la versión digital GRATIS
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Price */}
                      <div className="flex flex-col gap-1 mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-foreground">
                            {cardPrice.format(product.slug || product.id, priceFor(product))}
                          </span>
                          {(product.originalPrice || priceFor(product) > 0) && (
                            <span className="text-lg text-muted-foreground line-through opacity-70">
                              {cardPrice.formatOriginal(product.slug || product.id, product.originalPrice || priceFor(product) * 1.54, priceFor(product))}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-accent uppercase tracking-wider">{cardPrice.currencyLabel(product.slug)}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shadow-sm">{cardPrice.regionLabel}</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Link to={getProductLink(product)}>
                        <Button
                          variant="hero"
                          size="lg"
                          className="w-full text-sm font-black tracking-wide h-12 shadow-md hover:shadow-lg transition-all"
                        >
                          Ver Detalles
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
</main>
  );
};

export default Products;
