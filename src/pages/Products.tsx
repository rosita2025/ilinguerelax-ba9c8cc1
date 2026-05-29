import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Star, Gift, Search, Download, BookOpen } from "lucide-react";
import { products, getProductLink } from "@/data/products";
import { cn } from "@/lib/utils";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const Products = () => {
  const [type, setType] = useState<"all" | "digital" | "physical">("all");
  const [language, setLanguage] = useState<string>("all");
  const [search, setSearch] = useState("");

  // IP-based regional pricing for product "5000" (Latam vs USA/EU/UK/CA/AU)
  const LATAM = new Set(["MXN","ARS","PEN","COP","CLP","BRL","UYU","BOB","PYG","GTQ","DOP","CRC","HNL","NIO","VES"]);
  const readCurrency = () => {
    if (typeof window === "undefined") return "USD";
    try {
      const raw = localStorage.getItem("campaign_currency_v5");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.currency) return String(p.currency).toUpperCase();
      }
    } catch { /* ignore */ }
    return "USD";
  };
  const [detectedCurrency, setDetectedCurrency] = useState<string>(readCurrency);
  useEffect(() => {
    const sync = () => setDetectedCurrency(readCurrency());
    sync();
    const id = window.setInterval(sync, 1500);
    window.addEventListener("campaign-currency-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("campaign-currency-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const isLatam = LATAM.has(detectedCurrency);
  const priceFor = (p: typeof products[number]) =>
    p.id === "5000" ? (isLatam ? 14.39 : 28) : p.price;

  const languages = useMemo(() => {
    const map = new Map<string, { flag: string; label: string }>();
    for (const p of products) {
      if (!map.has(p.flag)) map.set(p.flag, { flag: p.flag, label: p.country });
    }
    return Array.from(map.values());
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (type === "digital" && p.isPhysical) return false;
      if (type === "physical" && !p.isPhysical) return false;
      if (language !== "all" && p.flag !== language) return false;
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
  }, [type, language, search]);

  // Counts per language for the current format filter (for chip badges)
  const langCounts = useMemo(() => {
    const base = products.filter((p) => {
      if (type === "digital" && p.isPhysical) return false;
      if (type === "physical" && !p.isPhysical) return false;
      return true;
    });
    const counts: Record<string, number> = { all: base.length };
    for (const p of base) counts[p.flag] = (counts[p.flag] || 0) + 1;
    return counts;
  }, [type]);

  const formats: { key: "digital" | "physical"; icon: typeof Download; label: string; desc: string }[] = [
    { key: "digital", icon: Download, label: "Digital", desc: "Descarga inmediata · PDF" },
    { key: "physical", icon: BookOpen, label: "Físico", desc: "Libro impreso · Envío" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Libros Digitales de Inglés con Pronunciación - Catálogo"
        description="Libros digitales para aprender inglés: 5,000 y 8,000 palabras con pronunciación adaptada para hispanohablantes. Fonética UK/USA. Descarga inmediata desde $10."
        canonicalUrl="https://ilinguerelax.com/products"
        keywords="comprar libros inglés digital, vocabulario inglés 5000 8000 palabras, libros pronunciación inglés español, diccionario inglés fonética UK USA, aprender inglés hispanohablantes"
        productList={products.map((product) => ({
          name: product.title,
          description: product.description,
          price: product.price,
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
              Nuestros Productos
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

          {/* Step 2: Language */}
          <p className="text-center text-xs md:text-sm font-semibold text-muted-foreground mb-3">
            2. Elige el idioma
          </p>
          <div className="-mx-3 px-3 mb-4 md:mx-0 md:px-0">
            <div className="flex md:flex-wrap md:justify-center gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              <button
                onClick={() => setLanguage("all")}
                aria-pressed={language === "all"}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all shrink-0 snap-start min-h-[44px] active:scale-95",
                  language === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-card text-foreground border-border hover:border-foreground/40"
                )}
              >
                <span className="text-base">🌐</span>
                <span>Todos</span>
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    language === "all" ? "bg-white/25" : "bg-muted text-muted-foreground"
                  )}
                >
                  {langCounts.all || 0}
                </span>
              </button>
              {languages.map((l) => {
                const isActive = language === l.flag;
                const count = langCounts[l.flag] || 0;
                return (
                  <button
                    key={l.flag}
                    onClick={() => setLanguage(l.flag)}
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all shrink-0 snap-start min-h-[44px] active:scale-95",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-card text-foreground border-border hover:border-foreground/40"
                    )}
                  >
                    <span className="text-base font-bold">{l.flag}</span>
                    <span>{l.label}</span>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        isActive ? "bg-white/25" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
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
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No hay productos que coincidan con tu búsqueda.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group relative bg-card rounded-3xl border border-border shadow-card hover:shadow-hero transition-all duration-500 overflow-hidden"
              >
                {/* Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 rounded-full gradient-accent text-accent-foreground text-xs font-bold">
                    {product.badge}
                  </span>
                </div>

                {/* Product Image Area */}
                <div className="relative h-72 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-8">
                  <img
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{product.flag}</span>
                    <span className="text-sm text-muted-foreground">{product.country}</span>
                  </div>

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
                  <p className="text-muted-foreground mb-4">
                    {product.description}
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

                  {/* Digital Free Badge for Physical Products */}
                  {product.isPhysical && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        🎁 Incluye versión digital GRATIS
                      </span>
                    </div>
                  )}

                   {/* Price */}
                   <div className="flex items-baseline gap-2 mb-6">
                     <span className="text-3xl font-bold text-foreground">
                       ${priceFor(product)}
                     </span>
                    {product.isPhysical && (
                      <span className="text-sm text-muted-foreground">
                        (valor pack: ${product.id === "5000-book" ? "31.99" : "49.99"})
                      </span>
                    )}
                    {product.originalPrice && !product.isPhysical && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                    <span className="text-sm text-accent font-medium">USD</span>
                  </div>

                  {/* CTA */}
                  <Link to={getProductLink(product)}>
                    <Button variant="hero" size="lg" className="w-full">
                      Ver Detalles
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
      <ExitIntentPopup 
        discount="10%"
        couponCode="NEW10"
        lang="es"
        storageKey="exit_intent_products"
      />
    </main>
  );
};

export default Products;
