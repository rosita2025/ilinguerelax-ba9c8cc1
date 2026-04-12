import { useState, useMemo } from "react";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
const product5000BookImg = "/images/product-5000-book.webp";
import ebookMockup from "@/assets/ebook-5000-mockup.png";
import reviewFb1 from "@/assets/review-fb-1.jpg";
import reviewFb2 from "@/assets/review-fb-2.jpg";
import reviewFb3 from "@/assets/review-fb-3.jpg";
import reviewFb4 from "@/assets/review-fb-4.jpg";
import reviewPhoto5 from "@/assets/review-photo-5.jpg";
import reviewPhoto6 from "@/assets/review-photo-6.jpg";
import reviewPhoto7 from "@/assets/review-photo-7.jpg";
import reviewPhoto8 from "@/assets/review-photo-8.jpg";
import reviewBookToc from "@/assets/review-book-toc.jpg";
import reviewBookContent from "@/assets/review-book-content.jpg";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { FAQ } from "@/components/FAQ";
import SalesNotification from "@/components/SalesNotification";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { LiveViewers } from "@/components/LiveViewers";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProductReviews } from "@/components/ProductReviews";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Star,
  Check,
  BookOpen,
  Globe,
  ArrowRight,
  ShoppingCart,
  Clock,
  Gift,
  Download,
  RefreshCw,
  Eye,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  User,
  Smartphone,
  FileText,
  GraduationCap,
  Lightbulb,
  CreditCard,
  X,
  Zap,
  Sparkles,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";

// Preview images
import previewIndice from "@/assets/preview-indice.png";
import previewGramatica from "@/assets/preview-gramatica-estructura.png";
import previewFrases from "@/assets/preview-frases-verbos.png";
import previewVocabulario from "@/assets/preview-vocabulario.png";
const product5000Image = "/images/product-5000.webp";

// Bonus images
import bonusEstructura from "@/assets/bonus-estructura.png";
import bonusDiccionario from "@/assets/bonus-diccionario.png";
import bonusArticulos from "@/assets/bonus-articulos.png";
import bonusPreview from "@/assets/bonus-preview.jpg";

// About section image
import aboutIlingueRelax from "@/assets/about-ilingue-relax.png";

// Partner logos
import logoAmazon from "@/assets/logo-amazon.png";
import logoEbay from "@/assets/logo-ebay.png";
import logoHotmart from "@/assets/logo-hotmart.svg";
import logoShopify from "@/assets/logo-shopify.png";
import logoKindle from "@/assets/logo-kindle.png";

// Components
import { StoreSubscriptionCard } from "@/components/StoreSubscriptionCard";
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";
import { TrustBadges } from "@/components/TrustBadges";
import { VideoTestimonial } from "@/components/VideoTestimonial";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProductCrossSell } from "@/components/ProductCrossSell";

const partnerLogos = [
  {
    src: logoAmazon,
    alt: "Amazon",
    height: "h-10 md:h-14",
  },
  {
    src: logoEbay,
    alt: "eBay",
    height: "h-10 md:h-14",
  },
  {
    src: logoShopify,
    alt: "Shopify",
    height: "h-10 md:h-14",
  },
  {
    src: logoHotmart,
    alt: "Hotmart",
    height: "h-8 md:h-12",
  },
  {
    src: logoKindle,
    alt: "Amazon Kindle",
    height: "h-8 md:h-12",
  },
];
const previewImages = [
  {
    src: previewIndice,
    title: "Índice Completo",
    subtitle: "52 capítulos temáticos organizados",
  },
  {
    src: previewGramatica,
    title: "Estructura Gramatical",
    subtitle: "Fórmulas para construir frases A1-C1",
  },
  {
    src: previewFrases,
    title: "Frases con Ejemplos",
    subtitle: "Verbos profesionales y académicos",
  },
  {
    src: previewVocabulario,
    title: "Vocabulario 5,000 Palabras",
    subtitle: "Palabras con pronunciación y fonética",
  },
];
const features = [
  "5,000+ palabras más utilizadas en inglés",
  "Pronunciación adaptada para hispanohablantes",
  "Fonética internacional UK/USA incluida",
  "Estructura gramatical desde Nivel Cero hasta Intermedio B1",
  "52 capítulos temáticos organizados",
  "Significado en español de cada palabra",
  "Entrega digital inmediata",
  "Acceso de por vida",
];
const bonuses = [
  {
    icon: BookOpen,
    title: "Bonus 1: Estructura de Frases",
    description:
      "Aprende la fórmula completa: Sujeto + Verbo + Artículo + Objeto + Preposición + Lugar. Incluye ejemplos y pronunciación.",
    image: bonusEstructura,
  },
  {
    icon: Globe,
    title: "Bonus 2: Diccionario Alfabético",
    description: "5,000 palabras organizadas alfabéticamente con pronunciación adaptada. Ideal para consultas rápidas.",
    image: bonusDiccionario,
  },
  {
    icon: BookOpen,
    title: "Bonus 3: Verbo To Be y Más",
    description: "Tablas prácticas del verbo To Be, artículos (a/an/the) y preposiciones (in/on/at) con ejemplos.",
    image: bonusArticulos,
  },
  {
    icon: RefreshCw,
    title: "Bonus 4: Vista Previa del Libro",
    description:
      "Acceso de por vida al contenido con todas las actualizaciones futuras y nuevas versiones sin costo adicional.",
    image: bonusPreview,
  },
];
const chapters = [
  "Casa y Hogar",
  "Comidas y Bebidas",
  "Transportes",
  "Profesiones",
  "Lugares",
  "Países y Ciudades",
  "Ambiente y Naturaleza",
  "Tecnología",
  "Universidad",
  "Vida Cotidiana",
  "Trabajo",
  "Viajes",
  "Emociones",
  "Deportes",
  "Expresiones Comunes",
  "Y mucho más...",
];
const Product5000 = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bonusLightboxOpen, setBonusLightboxOpen] = useState(false);
  const [currentBonusIndex, setCurrentBonusIndex] = useState(0);

  // Meta Pixel ViewContent event - HOTMART PIXEL
  const pixelParams = useMemo(
    () => ({
      content_name: "Inglés Relax - 5,000 Palabras",
      content_category: "Digital Book",
      content_ids: ["product-5000"],
      content_type: "product",
      value: 12,
      currency: "USD",
    }),
    [],
  );
  useHotmartPixel(pixelParams);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % previewImages.length);
  };
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length);
  };
  const openBonusLightbox = (index: number) => {
    setCurrentBonusIndex(index);
    setBonusLightboxOpen(true);
  };
  const nextBonusImage = () => {
    setCurrentBonusIndex((prev) => (prev + 1) % bonuses.length);
  };
  const prevBonusImage = () => {
    setCurrentBonusIndex((prev) => (prev - 1 + bonuses.length) % bonuses.length);
  };
  const handleBuy = () => {
    // Track InitiateCheckout with Hotmart pixel
    trackHotmartEvent("InitiateCheckout", {
      content_name: "Inglés Relax - 5,000 Palabras",
      content_category: "Digital Book",
      content_ids: ["product-5000"],
      content_type: "product",
      value: 12,
      currency: "USD",
      num_items: 1,
    });
    window.open(
      "https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true",
      "_blank",
    );
  };
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="5,000 Palabras en Inglés con Pronunciación Español y Fonética UK/USA"
        description="Aprende 5,000 palabras en inglés con pronunciación adaptada para hispanohablantes. Incluye fonética UK/USA, 52 capítulos temáticos y 4 bonus gratis. Descarga inmediata."
        canonicalUrl="https://ilinguerelax.com/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa"
        image="https://ilinguerelax.com/product-5000.png"
        type="product"
        price="12"
        originalPrice="54"
        rating="4.8"
        reviewCount="800"
        sku="ILINGUE-5000"
        keywords="aprender inglés, vocabulario inglés 5000 palabras, pronunciación inglés hispanohablantes, libro digital inglés"
      />
      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">{previewImages[currentImageIndex]?.title}</DialogTitle>
          <div className="relative flex items-center justify-center min-h-[80vh]">
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous button */}
            <button
              onClick={prevImage}
              className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>

            {/* Image */}
            <div className="flex flex-col items-center px-16">
              <img
                src={previewImages[currentImageIndex]?.src}
                alt={previewImages[currentImageIndex]?.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-white">{previewImages[currentImageIndex]?.title}</h3>
                <p className="text-white/70 mt-1">{previewImages[currentImageIndex]?.subtitle}</p>
                <p className="text-white/50 text-sm mt-2">
                  {currentImageIndex + 1} / {previewImages.length}
                </p>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={nextImage}
              className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bonus Lightbox Dialog */}
      <Dialog open={bonusLightboxOpen} onOpenChange={setBonusLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">{bonuses[currentBonusIndex]?.title}</DialogTitle>
          <div className="relative flex items-center justify-center min-h-[80vh]">
            {/* Close button */}
            <button
              onClick={() => setBonusLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous button */}
            <button
              onClick={prevBonusImage}
              className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>

            {/* Image */}
            <div className="flex flex-col items-center px-16">
              <img
                src={bonuses[currentBonusIndex]?.image}
                alt={bonuses[currentBonusIndex]?.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />

              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-bold mb-2">
                  GRATIS
                </div>
                <h3 className="text-xl font-bold text-white">{bonuses[currentBonusIndex]?.title}</h3>
                <p className="text-white/70 mt-1 max-w-md">{bonuses[currentBonusIndex]?.description}</p>
                <p className="text-white/50 text-sm mt-2">
                  {currentBonusIndex + 1} / {bonuses.length}
                </p>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={nextBonusImage}
              className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Navbar />

      {/* Hero Section */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative">
                {/* Vista Previa Label */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                  <Eye className="w-4 h-4" />
                  VISTA PREVIA O DEMO
                </div>
                <img
                  src={product5000Image}
                  alt="Inglés Relax - 5,000 Palabras"
                  className="w-full h-auto rounded-2xl shadow-hero"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Trending & Bonus Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 text-sm font-bold border border-red-500/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>🔥 MÁS VENDIDO</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium"
                >
                  <Gift className="w-4 h-4" />
                  <span>4 Bonus Gratis</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 5,000 Palabras con Pronunciación Español y Fonética UK/USA
              </h1>
              <p className="text-base text-muted-foreground mb-4">
                📚 Incluye estructura gramatical completa desde{" "}
                <span className="font-bold text-foreground">Nivel Cero hasta Intermedio B1</span>. Perfecto para
                principiantes.
              </p>

              {/* Reviews - More Prominent */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-foreground">4.8/5</span>
                <span className="text-muted-foreground">(800+ Reseñas Verificadas)</span>
              </div>

              {/* Purchase Counter - Social Proof */}
              <div className="mb-4">
                <PurchaseCounter baseCount={1247} lang="es" />
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={18} maxViewers={42} />
              </div>

              {/* Price Section with Value Stack */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative overflow-hidden rounded-2xl p-6 border-2 border-accent mb-6"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.18))" }}
              >
                {/* Badge */}
                <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl bg-accent text-accent-foreground text-xs font-black uppercase tracking-wider">
                  🎁 Todo Incluido
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <span className="text-accent font-bold text-sm uppercase">Lo que recibes hoy</span>
                </div>

                {/* Value Stack */}
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-background/60 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">📖 5,000 Palabras con Pronunciación</span>
                    </div>
                    <span className="text-sm text-muted-foreground">$30</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">📚 Gramática Nivel Cero → B1</span>
                    </div>
                    <span className="text-sm text-muted-foreground">$15</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">🎁 Bonus 1: Estructura de Frases</span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$12</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">🎁 Bonus 2: Diccionario Alfabético</span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$12</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">🎁 Bonus 3: Verbo To Be y Artículos</span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$10</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">
                        🎁 Bonus 4: Actualizaciones de por vida
                      </span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$10</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Valor total:</span>
                    <span className="text-sm font-bold text-muted-foreground line-through">$89 USD</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$12</span>
                  <span className="text-2xl text-muted-foreground line-through">$89</span>
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg"
                  >
                    AHORRA 86%
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">💳 Pago único • 4 Bonus GRATIS • Acceso de por vida</p>
              </motion.div>

              {/* Stock Counter - Scarcity */}
              <div className="mb-6">
                <StockCounter totalStock={50} remainingStock={12} lang="es" />
              </div>

              {/* CTA Button - More Impactful */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mb-4 text-lg py-6 shadow-2xl relative overflow-hidden group"
                  onClick={handleBuy}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  ¡QUIERO COMPRAR AHORA!
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </motion.div>

              {/* Secondary CTA */}
              <p className="text-center text-sm text-muted-foreground mb-6">
                👆 Haz clic para asegurar tu copia al precio de oferta
              </p>

              {/* Trust Badges */}
              <TrustBadges lang="es" variant="grid" />

              {/* Money Back Guarantee - Enhanced */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-2 border-green-500/30 mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-green-700">🛡️ Garantía de Devolución 100% - 7 Días</p>
                  <p className="text-sm text-green-600">
                    Si no estás satisfecho, te devolvemos TODO tu dinero. Sin preguntas.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Cards - Compact */}
      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
              📖 Vista Previa del Contenido
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={previewIndice} alt="Índice Completo" className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-3 text-center">
                  <h4 className="font-bold text-foreground text-sm">Índice Completo</h4>
                  <p className="text-xs text-muted-foreground">52 capítulos</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={previewGramatica} alt="Gramática" className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-3 text-center">
                  <h4 className="font-bold text-foreground text-sm">Estructura Gramatical</h4>
                  <p className="text-xs text-muted-foreground">Sujeto + Verbo TO BE + Sustantivos</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={previewVocabulario} alt="Vocabulario" className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-3 text-center">
                  <h4 className="font-bold text-foreground text-sm">5,000 Palabras</h4>
                  <p className="text-xs text-muted-foreground">Con pronunciación</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Bonus GRATIS Section */}
      <section className="py-10 md:py-14 bg-gradient-to-b from-accent/5 to-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold mb-3">
                <Gift className="w-4 h-4" />
                INCLUIDOS GRATIS
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                🎁 4 Bonus que Recibes HOY
              </h2>
              <p className="text-muted-foreground mt-2">Valorados en $44 USD — GRATIS con tu compra</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bonuses.map((bonus, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-xl border border-border shadow-card overflow-hidden cursor-pointer group"
                  onClick={() => openBonusLightbox(i)}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={bonus.image}
                      alt={bonus.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-accent text-accent-foreground text-xs font-black">
                      GRATIS
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-foreground text-sm">{bonus.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bonus.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mid-page CTA after Bonuses */}
      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-muted-foreground text-sm mb-3">
              📦 Todo esto por solo <span className="font-bold text-foreground">$12 USD</span> en vez de <span className="line-through">$89</span>
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="hero"
                size="xl"
                className="w-full text-lg py-6 shadow-2xl relative overflow-hidden group"
                onClick={handleBuy}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <ShoppingCart className="w-6 h-6 mr-2" />
                ¡COMPRAR AHORA — $12 USD!
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </motion.div>
            <p className="text-xs text-muted-foreground mt-2">🛡️ Garantía 7 días • Descarga inmediata • Pago seguro</p>
          </div>
        </div>
      </section>
      <VideoTestimonial
        videoUrl="https://youtu.be/bG35t0x3GkU"
        customerName="Cliente Verificado"
        customerLocation="Latinoamérica"
        testimonialQuote="Este libro cambió completamente mi forma de aprender inglés. La pronunciación adaptada al español hace que sea muy fácil de entender. ¡100% recomendado!"
        lang="es"
      />

      {/* Cross-sell: Other Product Option */}
      <ProductCrossSell currentProduct="5000" lang="es" />

      {/* Digital Only Option */}
      <section className="py-10 md:py-14 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              💡 ¿Solo quieres la versión digital?
            </h3>
            <p className="text-muted-foreground mb-4">
              Ya la tienes en esta página por solo <span className="font-bold text-foreground">$12 USD</span> — sin
              envío, descarga inmediata.
            </p>
            <div className="flex items-baseline gap-3 justify-center mb-4">
              <span className="text-4xl font-black text-foreground">$12</span>
              <span className="text-lg text-muted-foreground line-through">$89</span>
              <span className="text-primary font-bold">USD</span>
            </div>
            <Button variant="hero" size="xl" className="w-full max-w-md" onClick={handleBuy}>
              <Download className="w-5 h-5 mr-2" />
              📱 Comprar Digital — $12
            </Button>
          </div>
        </div>
      </section>

      {/* Ebook Mockup + Facebook Reviews Section */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            {/* Ebook Image */}
            <div className="flex justify-center mb-10">
              <motion.img
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                src={ebookMockup}
                alt="Ebook Inglés Relax - 5,000 Palabras"
                className="w-48 md:w-64 h-auto drop-shadow-2xl"
                loading="lazy"
                width={800}
                height={800}
              />
            </div>

            {/* Facebook-style Reviews Card */}
            <div className="rounded-2xl border-2 border-border bg-card shadow-xl overflow-hidden">
              {/* Header - Facebook style */}
              <div className="bg-[#1877F2] px-6 py-4 flex items-center gap-3">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-white font-bold text-lg">Reseñas de Clientes en Facebook</span>
              </div>

              {/* Rating Summary */}
              <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row items-center gap-4">
                <div className="text-center">
                  <div className="text-5xl font-black text-foreground">4.8</div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">800+ reseñas</p>
                </div>
                <div className="flex-1 w-full max-w-xs space-y-1.5">
                  {[
                    { stars: 5, pct: 78 },
                    { stars: 4, pct: 15 },
                    { stars: 3, pct: 5 },
                    { stars: 2, pct: 1 },
                    { stars: 1, pct: 1 },
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-muted-foreground">{row.stars}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="w-8 text-xs text-muted-foreground">{row.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Reviews */}
              {(() => {
                const allReviews = [
                  { name: "Sarah M.", location: "🇺🇸 USA", date: "2 days ago", text: "Amazing book! The phonetic pronunciation guide made it so easy to learn Spanish words. I can now order food in Spanish on my trips to Mexico!", stars: 5, photo: reviewPhoto5, verified: true },
                  { name: "James T.", location: "🇬🇧 UK", date: "3 days ago", text: "Bought this for my retirement trip to Spain. The chapters are well organized — from basics to advanced. The 4 free bonuses are incredible value for $12.", stars: 5, photo: reviewPhoto6, verified: true },
                  { name: "Emily R.", location: "🇺🇸 USA", date: "4 days ago", text: "I've tried Duolingo, Babbel, and Rosetta Stone. This book is the only resource that helped me actually REMEMBER the words. The pronunciation adapted for English speakers is genius!", stars: 5, photo: reviewPhoto7, verified: true },
                  { name: "Robert & Linda K.", location: "🇨🇦 Canada", date: "5 days ago", text: "We bought this together for our anniversary trip to Colombia. We've been studying every evening and it's become our favorite activity. Highly recommend for couples!", stars: 5, photo: reviewPhoto8, verified: true },
                  { name: "Michael B.", location: "🇺🇸 USA", date: "1 week ago", text: "The table of contents alone shows how well-structured this is. 49 chapters covering everything from food to emergencies. Downloaded it instantly and started learning.", stars: 5, photoImg: reviewBookToc, verified: true },
                  { name: "Jessica L.", location: "🇦🇺 Australia", date: "1 week ago", text: "Love the layout! English, Spanish, and pronunciation side by side in clean tables. The health & emergency chapter is super practical for travelers.", stars: 5, photoImg: reviewBookContent, verified: true },
                  { name: "David W.", location: "🇺🇸 USA", date: "1 week ago", text: "Best $12 I've ever spent on language learning. 5,000 words organized by topic with pronunciation — this is exactly what I needed for my work in Texas.", stars: 5, verified: true },
                  { name: "Amanda C.", location: "🇬🇧 UK", date: "1 week ago", text: "I teach ESL and bought this for my Spanish-speaking students' parents. They love it! The bilingual format works both ways.", stars: 5, verified: true },
                  { name: "Chris P.", location: "🇺🇸 USA", date: "8 days ago", text: "Downloaded the PDF and printed it at home. Now I carry it everywhere. The clothing chapter helped me shop in Barcelona last month!", stars: 5, verified: true },
                  { name: "Karen H.", location: "🇨🇦 Canada", date: "9 days ago", text: "My daughter is dating a Mexican guy and I wanted to learn some Spanish. This book made it fun and easy. His family was impressed!", stars: 5, verified: true },
                  { name: "Daniel F.", location: "🇺🇸 USA", date: "10 days ago", text: "As a nurse in Miami, I needed to learn medical Spanish quickly. The health chapter with body parts and symptoms is a lifesaver — literally!", stars: 5, verified: true },
                  { name: "Rachel S.", location: "🇬🇧 UK", date: "10 days ago", text: "The pronunciation guide is the best feature. I was always afraid of saying things wrong. Now I feel confident speaking basic Spanish.", stars: 5, verified: true },
                  { name: "Mark J.", location: "🇺🇸 USA", date: "11 days ago", text: "I manage a construction crew with Spanish speakers. This book helped me communicate better. The transportation and tools chapters are gold!", stars: 4, verified: true },
                  { name: "Lisa D.", location: "🇦🇺 Australia", date: "12 days ago", text: "Planning a 3-month trip to South America. This book is my travel bible now. The food, accommodation, and emergency chapters are essential.", stars: 5, verified: true },
                  { name: "Tom N.", location: "🇺🇸 USA", date: "12 days ago", text: "I've been studying Spanish for 2 years with apps. This book filled ALL the vocabulary gaps. The topics are practical, not random like most apps.", stars: 5, verified: true },
                  { name: "Sophie W.", location: "🇬🇧 UK", date: "13 days ago", text: "Bought it on impulse and don't regret it at all. The digital format is convenient and the content is incredibly thorough for the price.", stars: 5, verified: true },
                  { name: "Brian M.", location: "🇨🇦 Canada", date: "2 weeks ago", text: "My wife is from Peru and her family doesn't speak English. This book is helping me connect with them. The family and relationships chapter is perfect!", stars: 5, verified: true },
                  { name: "Jennifer A.", location: "🇺🇸 USA", date: "2 weeks ago", text: "I homeschool my kids and we use this as our Spanish curriculum. The visual organization makes it easy for children aged 10+ to follow along.", stars: 5, verified: true },
                  { name: "Steve R.", location: "🇬🇧 UK", date: "2 weeks ago", text: "Retired and learning Spanish for fun. This book doesn't overwhelm you — it's relaxing to study, just like the name says!", stars: 5, verified: true },
                  { name: "Megan T.", location: "🇺🇸 USA", date: "2 weeks ago", text: "The jewelry and accessories chapter is so unique. No other book covers these topics. Perfect for my fashion business dealing with Latin American vendors.", stars: 4, verified: true },
                  { name: "Patrick O.", location: "🇮🇪 Ireland", date: "2 weeks ago", text: "Moving to Costa Rica next year. This book is my preparation companion. Practical, well-organized, and the bonuses are fantastic.", stars: 5, verified: true },
                  { name: "Nancy B.", location: "🇺🇸 USA", date: "3 weeks ago", text: "I work in a hotel in Florida and needed basic Spanish. This book covers hospitality vocabulary perfectly. My tips have gone up!", stars: 5, verified: true },
                  { name: "Andrew G.", location: "🇬🇧 UK", date: "3 weeks ago", text: "Third language book I've bought but the first one I've actually finished. The structure keeps you motivated. Brilliant work!", stars: 5, verified: true },
                  { name: "Michelle K.", location: "🇺🇸 USA", date: "3 weeks ago", text: "The food and restaurant chapter alone is worth the $12. I can now read a menu and order in Spanish without Google Translate!", stars: 5, verified: true },
                  { name: "Peter H.", location: "🇦🇺 Australia", date: "3 weeks ago", text: "Great for self-study. I do 30 minutes every morning before work. Already noticing improvement in my conversations with Spanish-speaking colleagues.", stars: 5, verified: true },
                  { name: "Laura C.", location: "🇺🇸 USA", date: "3 weeks ago", text: "I'm a real estate agent in Texas. Knowing Spanish vocabulary for housing and accommodation has helped me close more deals!", stars: 5, verified: true },
                  { name: "Kevin D.", location: "🇨🇦 Canada", date: "3 weeks ago", text: "Bought this before a cruise to the Caribbean. The basic phrases and pronunciation guide saved me so many times. Thank you!", stars: 5, verified: true },
                  { name: "Maria T.", location: "🇺🇸 USA", date: "3 weeks ago", text: "As a heritage speaker who never learned to read in Spanish, this helped me formalize my vocabulary. Great for all levels!", stars: 4, verified: true },
                  { name: "George L.", location: "🇬🇧 UK", date: "4 weeks ago", text: "The sportswear and clothing chapters are surprisingly detailed. Perfect for my job at an international sports brand.", stars: 5, verified: true },
                  { name: "Sandra E.", location: "🇺🇸 USA", date: "4 weeks ago", text: "I volunteer at a community center with many Spanish speakers. This book helped me break the language barrier. People are so grateful!", stars: 5, verified: true },
                  { name: "Ryan W.", location: "🇺🇸 USA", date: "4 weeks ago", text: "Simple, clean, effective. No fluff, no complicated grammar explanations. Just the words you need with how to say them. 10/10.", stars: 5, verified: true },
                  { name: "Helen P.", location: "🇳🇿 New Zealand", date: "4 weeks ago", text: "Planning to teach English in Colombia. Learning Spanish vocabulary first with this book. The education chapter is very helpful!", stars: 5, verified: true },
                  { name: "Jason F.", location: "🇺🇸 USA", date: "1 month ago", text: "I'm a firefighter and the emergencies chapter is exactly what I needed. Now I can communicate with Spanish-speaking residents during calls.", stars: 5, verified: true },
                  { name: "Catherine S.", location: "🇬🇧 UK", date: "1 month ago", text: "Beautiful layout, easy to read. I keep it on my iPad and study during my commute. Already on chapter 20!", stars: 5, verified: true },
                  { name: "Matt V.", location: "🇺🇸 USA", date: "1 month ago", text: "Downloaded for my trip to Mexico City. The food chapter helped me discover amazing street food I would've never tried without knowing the names!", stars: 5, verified: true },
                  { name: "Diana R.", location: "🇨🇦 Canada", date: "1 month ago", text: "I'm a nurse practitioner in Toronto. Many patients speak Spanish. This book's health section is now my quick reference at work!", stars: 5, verified: true },
                  { name: "Paul A.", location: "🇺🇸 USA", date: "1 month ago", text: "The winter accessories and fabrics chapters — who else covers that?! So thorough. This book thinks of everything.", stars: 4, verified: true },
                  { name: "Angela M.", location: "🇬🇧 UK", date: "1 month ago", text: "Gifted this to my mum who's retiring to Spain. She calls me every day to tell me new words she learned. Best £10 gift ever!", stars: 5, verified: true },
                  { name: "Tyler B.", location: "🇺🇸 USA", date: "1 month ago", text: "College student here. This book has more practical vocabulary than my $200 textbook. Using it alongside my Spanish 101 class.", stars: 5, verified: true },
                  { name: "Christine L.", location: "🇦🇺 Australia", date: "1 month ago", text: "The bags and personal accessories chapter is unique. I work in fashion retail and it's helped me serve our Latin American customers better.", stars: 5, verified: true },
                  { name: "Derek J.", location: "🇺🇸 USA", date: "5 weeks ago", text: "I coach a youth soccer team with many Latino kids. Learning their language through this book has made me a better coach and mentor.", stars: 5, verified: true },
                  { name: "Samantha N.", location: "🇬🇧 UK", date: "5 weeks ago", text: "The destinations and tourism chapter is perfect for planning our family holiday to Tenerife. Kids are learning too!", stars: 5, verified: true },
                  { name: "Frank O.", location: "🇺🇸 USA", date: "5 weeks ago", text: "I run a landscaping business in California. This book helped me communicate with my crew. Productivity is up and everyone's happier!", stars: 5, verified: true },
                  { name: "Victoria H.", location: "🇨🇦 Canada", date: "5 weeks ago", text: "Third time buying — gave copies to my two best friends. We study together on Zoom every Sunday. It's become our fun tradition!", stars: 5, verified: true },
                  { name: "Marcus T.", location: "🇺🇸 USA", date: "6 weeks ago", text: "The condiments and spices chapter is wild — I didn't even know half these words in English! Learning both languages at once haha.", stars: 4, verified: true },
                  { name: "Olivia K.", location: "🇬🇧 UK", date: "6 weeks ago", text: "I'm a travel blogger and this has become my go-to resource for Spanish-speaking countries. The vocabulary covers EVERYTHING you need.", stars: 5, verified: true },
                  { name: "Benjamin S.", location: "🇺🇸 USA", date: "6 weeks ago", text: "Excellent PDF quality. Clean fonts, well-spaced tables. Easy on the eyes even after studying for an hour. Great design!", stars: 5, verified: true },
                  { name: "Hannah W.", location: "🇳🇿 New Zealand", date: "6 weeks ago", text: "My husband and I are learning together before our honeymoon in Argentina. This book makes it competitive and fun between us!", stars: 5, verified: true },
                  { name: "Carlos G.", location: "🇺🇸 USA", date: "7 weeks ago", text: "Born in the US but my grandparents speak Spanish. This book helped me reconnect with my roots. The pronunciation section is spot-on.", stars: 5, verified: true },
                  { name: "Emma D.", location: "🇬🇧 UK", date: "7 weeks ago", text: "I teach primary school and use some of these vocabulary lists in my lessons. The kids love learning Spanish words with the fun pronunciation guide!", stars: 5, verified: true },
                  { name: "William R.", location: "🇺🇸 USA", date: "2 months ago", text: "Military stationed in Honduras. This book was a game-changer for daily life off base. Recommended it to my entire unit.", stars: 5, verified: true },
                  { name: "Natalie F.", location: "🇨🇦 Canada", date: "2 months ago", text: "As a social worker in Vancouver, I serve many Spanish-speaking families. This book gave me the vocabulary I needed to build trust.", stars: 5, verified: true },
                  { name: "Greg P.", location: "🇺🇸 USA", date: "2 months ago", text: "I own a restaurant in Arizona. Half my staff speaks Spanish. This book improved our kitchen communication 100%. Money well spent!", stars: 5, verified: true },
                ];

                const [showAllReviews, setShowAllReviews] = useState(false);
                const visibleReviews = showAllReviews ? allReviews : allReviews.slice(0, 8);

                return (
                  <>
                    <div className="divide-y divide-border">
                      {visibleReviews.map((review, i) => (
                        <div key={i} className="px-6 py-4">
                          <div className="flex items-center gap-3 mb-2">
                            {review.photo ? (
                              <img src={review.photo} alt={review.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-sm">
                                {review.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-sm">{review.name}</span>
                                <span className="text-xs text-muted-foreground">{review.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5">
                                  {[...Array(review.stars)].map((_, j) => (
                                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">• {review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">{review.text}</p>
                          {review.photoImg && (
                            <img src={review.photoImg} alt="Review photo" className="mt-3 rounded-lg max-h-48 object-cover border border-border" loading="lazy" />
                          )}
                          {review.verified && (
                            <div className="mt-2 text-xs text-[#1877F2] font-medium">✓ Verified Purchase</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {!showAllReviews && (
                      <div className="px-6 py-4 text-center border-t border-border">
                        <Button variant="outline" size="sm" onClick={() => setShowAllReviews(true)}>
                          Show all {allReviews.length} reviews ↓
                        </Button>
                      </div>
                    )}
                    {showAllReviews && (
                      <div className="px-6 py-4 text-center border-t border-border">
                        <Button variant="outline" size="sm" onClick={() => setShowAllReviews(false)}>
                          Show less ↑
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Already purchased? Share your experience!</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/dejar-resena">⭐ Leave a Review</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ
        items={[
          {
            question: "¿Quién es el autor del libro?",
            answer:
              "INGLÉS RELAX es una obra de iLingue Relax, una marca educativa enfocada en aprender inglés de forma simple, práctica y sin estrés.",
            icon: User,
          },
          {
            question: "¿INGLÉS RELAX es un libro físico o digital?",
            answer:
              "Actualmente, INGLÉS RELAX es un producto digital disponible para compra inmediata. El libro puede descargarse y imprimirse en casa si el usuario lo desea. El libro físico (tapa blanda pegada) está previsto para junio de 2026. En algunas promociones futuras, el libro físico podrá incluir la versión digital (PDF) como bono.",
            icon: Smartphone,
          },
          {
            question: "¿Cuántas páginas tiene INGLÉS RELAX?",
            answer:
              "El libro digital tiene entre 300 y 350 páginas de contenido práctico, organizado y fácil de estudiar.",
            icon: FileText,
          },
          {
            question: "¿Es adecuado para estudiar solo/a?",
            answer: "Sí. INGLÉS RELAX está diseñado para autoestudio, para aprender a tu ritmo y sin presión.",
            icon: GraduationCap,
          },
          {
            question: "¿Necesito saber inglés antes de usar el libro?",
            answer: "No. Puedes empezar desde cero, sin conocimientos previos de inglés.",
            icon: Lightbulb,
          },
          {
            question: "¿El libro incluye pronunciación?",
            answer: "Sí. Todas las palabras incluyen pronunciación adaptada al español, pensada para hispanohablantes.",
            icon: BookOpen,
          },
          {
            question: "¿Cómo realizo el pago?",
            answer:
              "Puedes pagar de forma segura mediante: Tarjeta de crédito o débito internacional (Stripe) o Hotmart, donde puedes elegir distintos métodos de pago, incluyendo transferencias según tu país.",
            icon: CreditCard,
          },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre INGLÉS RELAX"
      />

      {/* About Me / Sobre Mí Section */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,69,180,0.3)_0%,_transparent_70%)]" />

        <div className="container px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto"
          >
            {/* Full Width Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={aboutIlingueRelax}
                alt="Acerca del ILINGUE RELAX - Autora Crady by iLingue Relax"
                className="w-full h-auto"
              />
            </div>

            {/* Additional Content Below */}
            <div className="mt-8 text-center">
              <p className="text-white/80 text-lg md:text-xl max-w-3xl mx-auto">
                <span className="font-semibold text-white">Autora Crady by iLingue Relax</span> - Creadora del método
                ILINGUE RELAX para aprender idiomas de forma simple, visual y relajada.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar
        price="$12"
        originalPrice="$54"
        productName="INGLÉS RELAX - 5,000 Palabras (Digital PDF)"
        rating={4.8}
        reviewCount={800}
        showReviews={true}
        buyUrl="https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true"
      />

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification />

      {/* Exit Intent Popup */}
      <ExitIntentPopup
        buyUrl="https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true"
        discount="15%"
      />

      {/* WhatsApp Support Button */}
      <WhatsAppButton />

      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={500} />
    </main>
  );
};
export default Product5000;
