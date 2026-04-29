import { useState, useMemo } from "react";
import { Clock, Star, Sparkles, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { products, comingSoonLanguages, getProductLink, type Product } from "@/data/products";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

type LangKey = "english" | "spanish" | "portuguese" | "soon";

// Map each product to a language tab
const getProductLangKey = (p: Product): LangKey => {
  if (p.id === "portuguese-5000") return "portuguese";
  // Coming soon languages (other than portuguese) go to "soon"
  if (p.comingSoon && ["german-5000", "italian-5000", "french-5000", "dutch-5000"].includes(p.id)) {
    return "soon";
  }
  // English-target products (for Spanish speakers learning English)
  const englishIds = ["5000", "8000", "5000-book", "8000-book", "1000-verbos", "500-preguntas", "1000-free"];
  if (englishIds.includes(p.id)) return "english";
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
  soon: {
    ring: "hover:border-muted-foreground/40",
    bg: "from-muted/30 to-muted/10",
    chip: "bg-muted text-muted-foreground border-border",
    tabActive: "bg-foreground text-background border-foreground",
  },
};

export const Languages = () => {
  const { language, formatPrice } = useI18n();
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
      title: "Elige tu libro digital de",
      titleHighlight: "Idioma",
      subtitle: "Libros digitales diseñados con el método iLingue Relax para aprender sin estrés",
      reviews: "reseñas",
      buy: "Comprar",
      comingSoon: "Próximamente más idiomas",
      tabs: { english: "Inglés", spanish: "Español", portuguese: "Portugués", soon: "Pronto" },
      soonLabel: "Muy pronto",
    },
    en: {
      badge: "Our Products",
      title: "Choose your digital book for",
      titleHighlight: "Language",
      subtitle: "Digital books designed with the iLingue Relax method to learn stress-free",
      reviews: "reviews",
      buy: "Buy",
      comingSoon: "More languages coming soon",
      tabs: { english: "English", spanish: "Spanish", portuguese: "Portuguese", soon: "Coming Soon" },
      soonLabel: "Coming soon",
    },
    fr: {
      badge: "Nos Produits",
      title: "Choisissez votre livre numérique de",
      titleHighlight: "Langue",
      subtitle: "Livres numériques conçus avec la méthode iLingue Relax pour apprendre sans stress",
      reviews: "avis",
      buy: "Acheter",
      comingSoon: "Plus de langues bientôt",
      tabs: { english: "Anglais", spanish: "Espagnol", portuguese: "Portugais", soon: "Bientôt" },
      soonLabel: "Bientôt disponible",
    },
    pt: {
      badge: "Nossos Produtos",
      title: "Escolha seu livro digital de",
      titleHighlight: "Idioma",
      subtitle: "Livros digitais projetados com o método iLingue Relax para aprender sem estresse",
      reviews: "avaliações",
      buy: "Comprar",
      comingSoon: "Mais idiomas em breve",
      tabs: { english: "Inglês", spanish: "Espanhol", portuguese: "Português", soon: "Em breve" },
      soonLabel: "Em breve",
    },
  };

  const c = content[language];

  const grouped = useMemo(() => {
    const g: Record<LangKey, Product[]> = { english: [], spanish: [], portuguese: [], soon: [] };
    products.forEach((p) => g[getProductLangKey(p)].push(p));
    return g;
  }, []);

  const tabs: { key: LangKey; flag: string }[] = [
    { key: "english", flag: "🇬🇧" },
    { key: "spanish", flag: "🇪🇸" },
    { key: "portuguese", flag: "🇧🇷" },
    { key: "soon", flag: "✨" },
  ];

  const visibleProducts = grouped[activeTab];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {c.badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {c.title} <span className="text-gradient">{c.titleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {c.subtitle}
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = grouped[tab.key].length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all",
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

        {/* Products */}
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
                  <img
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
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {product.price === 0 ? "GRATIS" : formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="gap-2" asChild>
                    <Link to={getProductLink(product)}>
                      <ShoppingCart className="w-4 h-4" />
                      {product.price === 0 ? (language === 'en' ? 'Free' : 'Gratis') : c.buy}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

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
