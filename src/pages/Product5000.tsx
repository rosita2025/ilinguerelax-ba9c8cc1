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
    title: "Regalo 1: Estructuras Gramaticales",
    description:
      "Domina la fórmula completa: Sujeto + Verbo + Artículo + Objeto + Preposición + Lugar. Gramática paso a paso con ejemplos y pronunciación.",
    image: bonusEstructura,
  },
  {
    icon: Globe,
    title: "Regalo 2: Diccionario Alfabético",
    description: "5,000 palabras organizadas alfabéticamente con pronunciación adaptada. Ideal para consultas rápidas.",
    image: bonusDiccionario,
  },
  {
    icon: BookOpen,
    title: "Regalo 3: Verbo To Be y Más",
    description: "Tablas prácticas del verbo To Be, artículos (a/an/the) y preposiciones (in/on/at) con ejemplos.",
    image: bonusArticulos,
  },
  {
    icon: RefreshCw,
    title: "Regalo 4: Actualizaciones de por Vida",
    description:
      "Acceso de por vida al contenido con todas las actualizaciones futuras y nuevas versiones sin costo adicional.",
    image: bonusPreview,
  },
  {
    icon: Globe,
    title: "Regalo 5: Pago en Moneda Local 🌎",
    description:
      "Compra desde toda Latinoamérica en tu moneda local (MXN, COP, ARS, PEN, CLP, BOB, UYU y más) con métodos de pago locales.",
    image: bonusEstructura,
  },
  {
    icon: Sparkles,
    title: "Regalo 6: Garantía 7 Días Sin Riesgo",
    description:
      "Si no te encanta, te devolvemos el 100% de tu dinero. Sin preguntas. Compra con total tranquilidad.",
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
                  <span>6 Regalos Gratis</span>
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
                      <span className="text-sm text-foreground font-medium">🎁 Regalo 1: Estructuras Gramaticales</span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$12</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">🎁 Regalo 2: Diccionario Alfabético</span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$12</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">🎁 Regalo 3: Verbo To Be y Artículos</span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$10</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">
                        🎁 Regalo 4: Actualizaciones de por vida
                      </span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$10</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">🎁 Regalo 5: Pago en Moneda Local 🌎</span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$8</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">🎁 Regalo 6: Garantía 7 Días Sin Riesgo</span>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">$10</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Valor total:</span>
                    <span className="text-sm font-bold text-muted-foreground line-through">$107 USD</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$12</span>
                  <span className="text-2xl text-muted-foreground line-through">$107</span>
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg"
                  >
                    AHORRA 89%
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">💳 Pago único • 6 Regalos GRATIS • Paga en tu moneda local 🌎</p>
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
            {/* Reviews Card */}
            <div className="rounded-2xl border-2 border-border bg-card shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-primary px-6 py-4 flex items-center gap-3">
                <Star className="w-7 h-7 text-white fill-white" />
                <span className="text-white font-bold text-lg">Reseñas de Clientes</span>
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
              <div className="divide-y divide-border">
                {[
                  { name: "María G.", location: "🇲🇽 México", date: "Hace 2 días", text: "¡Increíble! La pronunciación adaptada al español me ayudó mucho. Ya puedo leer palabras en inglés sin miedo. Lo recomiendo al 100%.", stars: 5 },
                  { name: "Carlos R.", location: "🇨🇴 Colombia", date: "Hace 5 días", text: "Compré este libro para mi hija y le encantó. Los capítulos están muy bien organizados y los bonus son geniales. Vale cada peso.", stars: 5 },
                  { name: "Ana P.", location: "🇪🇸 España", date: "Hace 1 semana", text: "Llevaba años intentando aprender inglés y este método es el que mejor me ha funcionado. La fonética UK/USA es un plus enorme.", stars: 5 },
                  { name: "Jorge M.", location: "🇵🇪 Perú", date: "Hace 1 semana", text: "Muy buen material, práctico y fácil de seguir. Los 4 bonus incluidos hacen que sea una compra excelente por $12.", stars: 4 },
                  { name: "Laura S.", location: "🇦🇷 Argentina", date: "Hace 2 semanas", text: "Lo descargué y empecé a estudiar de inmediato. Muy completo, me sorprendió la cantidad de contenido por ese precio.", stars: 5 },
                  { name: "Roberto D.", location: "🇨🇱 Chile", date: "Hace 2 semanas", text: "Excelente para principiantes. Mi esposa y yo lo estudiamos juntos cada noche. La pronunciación es muy clara y fácil de seguir.", stars: 5 },
                  { name: "Sofía V.", location: "🇪🇨 Ecuador", date: "Hace 3 semanas", text: "Lo mejor es que no necesitas diccionario. Todo viene explicado con la pronunciación adaptada. Mis hijos también lo usan.", stars: 5 },
                  { name: "Fernando T.", location: "🇲🇽 México", date: "Hace 3 semanas", text: "Trabajo en turismo y necesitaba aprender inglés rápido. Este libro me dio el vocabulario que necesitaba. ¡Las propinas han subido!", stars: 5 },
                  { name: "Patricia M.", location: "🇨🇴 Colombia", date: "Hace 1 mes", text: "Tercer libro de inglés que compro pero el primero que realmente uso. La organización por temas es perfecta.", stars: 5 },
                  { name: "Diego L.", location: "🇪🇸 España", date: "Hace 1 mes", text: "Calidad-precio increíble. 5,000 palabras con pronunciación por $12. He pagado mucho más por mucho menos.", stars: 5 },
                ].map((review, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-sm">
                        {review.name.charAt(0)}
                      </div>
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
                    {i < 3 && (
                      <div className="mt-2 text-xs text-[#1877F2] font-medium">✓ Compra verificada</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">¿Ya compraste? ¡Cuéntanos tu experiencia!</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/dejar-resena">⭐ Deja tu Reseña</a>
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
        ctaText="DESCARGAR AHORA - PAGO SEGURO"
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
