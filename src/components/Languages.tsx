import { useState, useMemo } from "react";
import { Clock, Star, Sparkles, ShoppingCart, Download, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { products, comingSoonLanguages, getProductLink, type Product } from "@/data/products";
import { useI18n } from "@/i18n/I18nContext";
import { useCardPrice } from "@/hooks/useCardPrice";
import { useDigitalProducts } from "@/hooks/useDigitalProducts";
import { cn } from "@/lib/utils";
import { ProductCoverImage } from "@/components/ProductCoverImage";

type LangKey = "english" | "spanish" | "portuguese" | "korean" | "soon";
type FormatKey = "digital" | "physical";

// Map each product to a language tab
const getProductLangKey = (p: Product): LangKey => {
  if (p.id === "coreano-relax" || p.targetLanguage === "ko") return "korean";
  if (p.id === "portuguese-5000" || p.targetLanguage === "pt") return "portuguese";
  // Coming soon languages (other than portuguese) go to "soon"
  if (p.comingSoon && ["german-5000", "italian-5000", "french-5000", "dutch-5000"].includes(p.id)) {
    return "soon";
  }
  // English-target products (for Spanish speakers learning English)
  const englishIds = ["5000", "8000", "5000-book", "8000-book", "1000-verbos", "500-preguntas", "patrones-especiales"];
  if (englishIds.includes(p.id) || p.targetLanguage === "en") return "english";
  // Spanish-target products (for English speakers learning Spanish)
  return "spanish";
};


// Tailwind color tokens per language tab
const langStyles: Record<LangKey, { ring: string; bg: string; chip: string; tabActive: string }> = {
  english: {
    ring: "hover:border-blue-500/60",
    bg: "from-blue-500/5 to-blue-500/10",
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    tabActive: "bg-blue-500 text-white border-blue-500",
  },
  spanish: {
    ring: "hover:border-amber-500/60",
    bg: "from-amber-500/5 to-red-500/10",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    tabActive: "bg-amber-500 text-white border-amber-500",
  },
  portuguese: {
    ring: "hover:border-green-500/60",
    bg: "from-green-500/5 to-emerald-500/10",
    chip: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
    tabActive: "bg-green-600 text-white border-green-600",
  },
  korean: {
    ring: "hover:border-pink-500/60",
    bg: "from-pink-500/5 to-rose-500/10",
    chip: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30",
    tabActive: "bg-pink-500 text-white border-pink-500",
  },
  soon: {
    ring: "hover:border-muted-foreground/40",
    bg: "from-muted/30 to-muted/10",
    chip: "bg-muted text-muted-foreground border-border",
    tabActive: "bg-foreground text-background border-foreground",
  },

};

export const Languages = () => {
  const { language, formatPrice } = useI18n();
  const cardPrice = useCardPrice();
  const { items: adminItems } = useDigitalProducts();
  const [activeFormat, setActiveFormat] = useState<FormatKey>("digital");
  const [activeTab, setActiveTab] = useState<LangKey>("english");

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : i < rating
            ? "text-yellow-400 fill-yellow-400/50"
            : "text-gray-300"
        }`}
      />
    ));
  };

  // Language-specific content
  const content = {
    es: {
      badge: "Nuestros Productos",
      title: "Elige tu libro",
      titleHighlight: "digital o físico",
      subtitle: "Libros digitales diseñados con el método iLingue Relax para aprender sin estrés",
      reviews: "reseñas",
      buy: "Comprar",
      comingSoon: "Próximamente más idiomas",
      tabs: { english: "Inglés", spanish: "Español", portuguese: "Portugués", korean: "Coreano", soon: "Pronto" },
      soonLabel: "Muy pronto",
      step1: "1. Elige el formato",
      step2: "2. Elige el idioma",
      digital: "Digital",
      physical: "Físico",
      digitalDesc: "Descarga inmediata · PDF",
      physicalDesc: "Libro impreso · Envío",
      empty: "No hay productos disponibles en esta combinación.",
    },
    en: {
      badge: "Our Products",
      title: "Choose your",
      titleHighlight: "digital or physical book",
      subtitle: "Digital books designed with the iLingue Relax method to learn stress-free",
      reviews: "reviews",
      buy: "Buy",
      comingSoon: "More languages coming soon",
      tabs: { english: "English", spanish: "Spanish", portuguese: "Portuguese", korean: "Korean", soon: "Coming Soon" },
      soonLabel: "Coming soon",
      step1: "1. Choose the format",
      step2: "2. Choose the language",
      digital: "Digital",
      physical: "Physical",
      digitalDesc: "Instant download · PDF",
      physicalDesc: "Printed book · Shipping",
      empty: "No products available for this combination.",
    },
    fr: {
      badge: "Nos Produits",
      title: "Choisissez votre livre",
      titleHighlight: "numérique ou physique",
      subtitle: "Livres numériques conçus avec la méthode iLingue Relax pour apprendre sans stress",
      reviews: "avis",
      buy: "Acheter",
      comingSoon: "Plus de langues bientôt",
      tabs: { english: "Anglais", spanish: "Espagnol", portuguese: "Portugais", korean: "Coréen", soon: "Bientôt" },
      soonLabel: "Bientôt disponible",
      step1: "1. Choisissez le format",
      step2: "2. Choisissez la langue",
      digital: "Numérique",
      physical: "Physique",
      digitalDesc: "Téléchargement immédiat · PDF",
      physicalDesc: "Livre imprimé · Livraison",
      empty: "Aucun produit disponible pour cette combinaison.",
    },
    pt: {
      badge: "Nossos Produtos",
      title: "Escolha seu livro",
      titleHighlight: "digital ou físico",
      subtitle: "Livros digitais projetados com o método iLingue Relax para aprender sem estresse",
      reviews: "avaliações",
      buy: "Comprar",
      comingSoon: "Mais idiomas em breve",
      tabs: { english: "Inglês", spanish: "Espanhol", portuguese: "Português", korean: "Coreano", soon: "Em breve" },
      soonLabel: "Em breve",
      step1: "1. Escolha o formato",
      step2: "2. Escolha o idioma",
      digital: "Digital",
      physical: "Físico",
      digitalDesc: "Download imediato · PDF",
      physicalDesc: "Livro impresso · Envio",
      empty: "Nenhum produto disponível nesta combinação.",
    },
  };

  const c = content[language];

  // Merge static products with admin (DB) products, dedup by slug.
  // Static entry keeps rich metadata (discount, features), but admin's cover
  // image always overrides so /admin/productos updates propagate to homepage.
  // IDs excluded from homepage (Muy Pronto placeholders that should not display)
  const HIDDEN_IDS = new Set(["german-5000", "italian-5000", "french-5000", "dutch-5000", "portuguese-5000"]);
  const merged: Product[] = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      if (HIDDEN_IDS.has(p.id)) return;
      map.set(p.slug, p);
    });
    adminItems.forEach((p) => {
      if (HIDDEN_IDS.has(p.id)) return;
      const existing = map.get(p.slug);
      if (!existing) {
        map.set(p.slug, p);
      } else if (p.image && p.image !== "/placeholder.svg") {
        map.set(p.slug, { ...existing, image: p.image });
      }
    });
    return Array.from(map.values());
  }, [adminItems]);

  // Filter by selected format first, then group by language
  const grouped = useMemo(() => {
    const g: Record<LangKey, Product[]> = { english: [], spanish: [], portuguese: [], korean: [], soon: [] };
    merged
      .filter((p) => {
        const fmts = (p as Product & { formats?: string[] }).formats;
        if (fmts?.length) return fmts.includes(activeFormat);
        return activeFormat === "physical" ? !!p.isPhysical : !p.isPhysical;
      })
      .forEach((p) => g[getProductLangKey(p)].push(p));
    return g;
  }, [activeFormat, merged]);

  const tabs: { key: LangKey; flag: string }[] = [
    { key: "english", flag: "🇬🇧" },
    { key: "korean", flag: "🇰🇷" },
    { key: "spanish", flag: "🇪🇸" },
    { key: "portuguese", flag: "🇧🇷" },
    { key: "soon", flag: "✨" },
  ];


  const visibleProducts = grouped[activeTab];

  const formats: { key: FormatKey; icon: typeof Download; label: string; desc: string }[] = [
    { key: "digital", icon: Download, label: c.digital, desc: c.digitalDesc },
    { key: "physical", icon: BookOpen, label: c.physical, desc: c.physicalDesc },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container px-3 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {c.badge}
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4 px-2">
            {c.title} <span className="text-gradient">{c.titleHighlight}</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            {c.subtitle}
          </p>
        </div>

        {/* Step 1: Format Toggle */}
        <div className="max-w-2xl mx-auto mb-6">
          <p className="text-center text-xs md:text-sm font-semibold text-muted-foreground mb-3">{c.step1}</p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {formats.map((f) => {
              const Icon = f.icon;
              const isActive = activeFormat === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFormat(f.key)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl border-2 transition-all text-left min-h-[64px] active:scale-[0.98]",
                    isActive
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground text-sm sm:text-base leading-tight">{f.label}</div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground leading-tight mt-0.5 line-clamp-2 sm:truncate">{f.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Language Tabs */}
        <p className="text-center text-xs md:text-sm font-semibold text-muted-foreground mb-3">{c.step2}</p>
        {/* Mobile: horizontal scroll. Desktop: centered wrap */}
        <div className="-mx-3 px-3 mb-8 md:mx-0 md:px-0">
          <div className="flex md:flex-wrap md:justify-center gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = grouped[tab.key].length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all shrink-0 snap-start min-h-[44px] active:scale-95",
                  isActive
                    ? langStyles[tab.key].tabActive + " shadow-md scale-105"
                    : "bg-card text-foreground border-border hover:border-foreground/40"
                )}
              >
                <span className="text-base">{tab.flag}</span>
                <span>{c.tabs[tab.key]}</span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-white/25" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
          </div>
        </div>

        {/* Korean demo CTA */}
        {activeTab === "korean" && (
          <div className="max-w-3xl mx-auto mb-8 p-5 md:p-6 rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-rose-500/10 text-center">
            <p className="text-base md:text-lg text-foreground text-pretty">
              ¿Te gustaría recibir una <strong>vista previa</strong> o un <strong>pequeño demo gratis</strong> para revisar la calidad del material ahora mismo? 😊✨
            </p>
            <Link
              to="/products/100-mapas-mentales-para-aprender-coreano-hangul-c1#vista-previa"
              className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold transition-colors"
            >
              📄 Ver demo gratis de Coreano
            </Link>
          </div>
        )}

        {/* Products */}

        {visibleProducts.length === 0 ? (
          <div className="max-w-2xl mx-auto mb-12 p-8 text-center rounded-2xl border border-dashed border-border bg-card/50">
            <p className="text-muted-foreground">{c.empty}</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {visibleProducts.map((product) => {
            const styles = langStyles[getProductLangKey(product)];
            return (
            <div
              key={product.id}
              className={cn(
                "group relative bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-hero transition-all duration-300 hover:-translate-y-2",
                styles.ring
              )}
            >
              {/* Discount Badge */}
              {product.discount && (
                <div className="absolute top-3 left-3 z-10">
                  <div className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    -{product.discount}% OFF
                  </div>
                </div>
              )}

              {/* Product Badge */}
              <div className="absolute top-3 right-3 z-10">
                <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border", styles.chip)}>
                  {product.comingSoon ? c.soonLabel : product.badge}
                </div>
              </div>

              {/* Product Image - Clickable */}
              <Link to={getProductLink(product)}>
                <div className={cn("aspect-[4/3] bg-gradient-to-br p-6 flex items-center justify-center cursor-pointer", styles.bg)}>
                  <ProductCoverImage
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="p-5 border-t border-border/50">
                {/* Country Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{product.flag}</span>
                  <span className="text-sm text-muted-foreground">{product.country}</span>
                </div>

                {/* Title */}
                <Link to={getProductLink(product)}>
                  <h3 className="text-xl font-bold text-foreground mb-1 hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-3">{product.description}</p>

                {/* Reviews */}
                {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">{renderStars(product.rating)}</div>
                  <span className="text-sm font-medium text-foreground">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews.toLocaleString()} {c.reviews})
                  </span>
                </div>
                )}

                {/* Pricing & Buy Button */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-2xl font-bold text-primary">
                        {product.price === 0
                          ? "GRATIS"
                          : cardPrice.format(product.slug || product.id, product.price)}
                      </span>
                      {product.originalPrice ? (
                        <span className="text-sm text-muted-foreground line-through">
                          {cardPrice.formatOriginal(product.slug || product.id, product.originalPrice, product.price)}
                        </span>
                      ) : product.price > 0 ? (
                        <span className="text-sm text-muted-foreground line-through">
                          {cardPrice.formatOriginal(product.slug || product.id, product.price * 1.54, product.price)}
                        </span>
                      ) : null}
                      {product.price > 0 && (
                        <>
                          <span className="text-[10px] text-accent font-semibold">{cardPrice.currencyLabel(product.slug)}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{cardPrice.regionLabel}</span>
                        </>
                      )}
                    </div>

                    <Link to={getProductLink(product)}>
                      <Button
                        size="sm"
                        className={cn(
                          "rounded-full px-6 font-bold shadow-sm transition-all active:scale-95 shrink-0",
                          styles.tabActive
                        )}
                      >
                        {c.buy}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
        )}

        {/* Coming Soon Languages */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            <span>{c.comingSoon}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {comingSoonLanguages.map((lang) => (
              <div
                key={lang.name}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-muted/50 border border-border/50"
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-muted-foreground font-medium">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
