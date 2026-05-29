import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Star, Gift, Search } from "lucide-react";
import { products, getProductLink } from "@/data/products";
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
      <section className="pt-6 pb-2 sticky top-16 z-30 bg-background/85 backdrop-blur-md border-b border-border/50">
        <div className="container px-4 md:px-6 max-w-5xl mx-auto">
          <div className="bg-card/80 backdrop-blur rounded-2xl border border-border shadow-sm p-3 md:p-4 space-y-3">
            {/* Top row: Search + Type tabs */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto, idioma…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-border/70 bg-background/70 focus-visible:ring-primary/40"
                />
              </div>
              <Tabs value={type} onValueChange={(v) => setType(v as typeof type)} className="sm:w-auto">
                <TabsList className="grid grid-cols-3 w-full sm:w-auto h-11 p-1 bg-muted/60 rounded-xl">
                  <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4">Todos</TabsTrigger>
                  <TabsTrigger value="digital" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4">Digital</TabsTrigger>
                  <TabsTrigger value="physical" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4">Físico</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Language chips */}
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">Idioma</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin flex-1">
                <button
                  type="button"
                  onClick={() => setLanguage("all")}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    language === "all"
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105"
                      : "bg-background text-foreground border-border/60 hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  🌐 Todos
                </button>
                {languages.map((l) => (
                  <button
                    key={l.flag}
                    type="button"
                    onClick={() => setLanguage(l.flag)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      language === l.flag
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105"
                        : "bg-background text-foreground border-border/60 hover:border-primary/40 hover:bg-primary/5"
                    }`}
                    title={l.label}
                  >
                    <span className="font-bold tracking-wide">{l.flag}</span>
                    <span className="hidden sm:inline opacity-80">{l.label}</span>
                  </button>
                ))}
              </div>
              <span className="shrink-0 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {filtered.length}
              </span>
            </div>
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
