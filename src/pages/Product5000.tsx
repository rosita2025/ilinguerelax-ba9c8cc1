import { useState, useMemo } from "react";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
const product5000BookImg = "/images/product-5000-book.webp";
import productoPrincipalInglesRelax from "@/assets/oferta-5000-ingles-gramatica.png";
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
import { CompactBuyCard } from "@/components/CompactBuyCard";
import { CustomerReviewsCarousel } from "@/components/CustomerReviewsCarousel";
import { useCampaignPrice } from "@/hooks/useCampaignPrice";
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
const product5000Image = productoPrincipalInglesRelax;

// Bonus images (5 regalos)
import bonus1Estructuras from "@/assets/bonus-1-estructuras-gramaticas.webp";
import bonus2Verbos from "@/assets/bonus-2-1000-verbos-esenciales.webp";
import bonus3Frases from "@/assets/bonus-3-100-frases-nativos.webp";
import bonus4Preguntas from "@/assets/bonus-4-500-preguntas-frecuentes.webp";
import bonus5Estudiar from "@/assets/bonus-5-como-estudiar-ingles-6-meses.webp";

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
  "Estructura gramatical desde Nivel Cero hasta Avanzado C1",
  "52 capítulos temáticos organizados",
  "Significado en español de cada palabra",
  "Entrega digital inmediata",
  "Acceso de por vida",
];
const bonuses = [
  {
    icon: BookOpen,
    title: "Regalo 1: Estructuras Gramáticas A1 a B1",
    description:
      "Guía completa de estructuras gramaticales del nivel A1 al B1 para construir frases con confianza desde el primer día.",
    image: bonus1Estructuras,
  },
  {
    icon: RefreshCw,
    title: "Regalo 2: 1,000 Verbos Esenciales (Presente, Pasado y Futuro)",
    description:
      "Los 1,000 verbos más usados en inglés conjugados en presente, pasado y futuro con pronunciación adaptada para hispanohablantes.",
    image: bonus2Verbos,
  },
  {
    icon: Sparkles,
    title: "Regalo 3: 100 Frases Más Usadas por Nativos",
    description:
      "Las expresiones reales que usan los nativos todos los días para que hables como un local desde el principio.",
    image: bonus3Frases,
  },
  {
    icon: Globe,
    title: "Regalo 4: 500 Preguntas Frecuentes en Inglés",
    description:
      "Las preguntas más comunes que necesitas dominar para conversaciones reales: trabajo, viajes y vida diaria.",
    image: bonus4Preguntas,
  },
  {
    icon: BookOpen,
    title: "Regalo 5: Cómo Estudiar Inglés en 6 Meses",
    description:
      "Tu plan paso a paso para hablar inglés con confianza en solo 6 meses, sin perder tiempo ni motivación.",
    image: bonus5Estudiar,
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
  const campaign = useCampaignPrice(15, 54);
  const campaignFull = useCampaignPrice(15, 107);
  const heroImages = [productoPrincipalInglesRelax];
  const heroThumbs = [productoPrincipalInglesRelax];
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  // Meta Pixel ViewContent event - HOTMART PIXEL
  const pixelParams = useMemo(
    () => ({
      content_name: "Inglés Relax - 5,000 Palabras",
      content_category: "Digital Book",
      content_ids: ["product-5000"],
      content_type: "product",
      value: 15,
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
      value: 15,
      currency: "USD",
      num_items: 1,
    });
    window.open(
      "https://pay.hotmart.com/O100578526P?bid=1778299502267",
      "_blank",
    );
  };
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Inglés Relax: 5,000 Palabras con Pronunciación Español y Fonética UK/USA"
        description="Libro digital con 5,000 palabras en inglés y pronunciación para hispanohablantes. Fonética UK/USA, 52 capítulos, estructuras gramaticales desde Nivel Cero hasta Avanzado C1 y 5 regalos. Descarga inmediata, paga en moneda local."
        canonicalUrl="https://ilinguerelax.com/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa"
        image="https://ilinguerelax.com/images/product-5000.png"
        type="product"
        price="15"
        originalPrice="54"
        rating="4.8"
        reviewCount="800"
        sku="ILINGUE-5000"
        availability="InStock"
        keywords="aprender inglés, 5000 palabras inglés, vocabulario inglés con pronunciación, pronunciación inglés para hispanohablantes, fonética UK USA, inglés A1 C1, estructuras gramaticales inglés, libro digital inglés, PDF inglés descargable, inglés relax, aprender inglés en 6 meses, inglés Latinoamérica"
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
                  src={heroImages[currentHeroImage]}
                  alt={
                    currentHeroImage === 0
                      ? "Inglés Relax 5,000 palabras - Libro digital con pronunciación para hispanohablantes y fonética UK/USA"
                      : "Inglés Relax 5,000 palabras - Aprende inglés en 6 meses con estructuras gramaticales desde cero hasta intermedio"
                  }
                  className="w-full h-auto rounded-2xl shadow-hero"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Trending & Bonus Badge */}
              <div className="flex flex-nowrap items-center gap-2 mb-3 -mt-1">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 md:px-4 md:py-2 rounded-full bg-red-500/10 text-red-600 text-[11px] md:text-sm font-bold border border-red-500/20 whitespace-nowrap"
                >
                  <Zap className="w-3 h-3 md:w-4 md:h-4" />
                  <span>🔥 MÁS VENDIDO</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 md:px-4 md:py-2 rounded-full bg-accent/10 text-accent text-[11px] md:text-sm font-medium whitespace-nowrap"
                >
                  <Gift className="w-3 h-3 md:w-4 md:h-4" />
                  <span>5 Regalos Gratis</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 5,000 Palabras con Pronunciación Español y Fonética UK/USA
              </h1>
              <p className="text-base text-muted-foreground mb-4">
                📚 Incluye estructura gramatical completa desde{" "}
                <span className="font-bold text-foreground">Nivel Cero hasta Avanzado C1</span>. Perfecto para
                principiantes y estudiantes avanzados.
              </p>

              {/* Reviews - More Prominent */}
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs md:text-sm font-bold text-foreground">4.8/5</span>
                <span className="text-[11px] md:text-xs text-muted-foreground">(800+ Reseñas Verificadas)</span>
              </div>

              {/* Purchase Counter - Social Proof */}
              <div className="mb-4">
                <PurchaseCounter baseCount={1247} lang="es" />
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={18} maxViewers={42} />
              </div>

              {/* Price Section - compact */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative overflow-hidden rounded-xl px-4 py-3 border border-accent/30 mb-4 shadow-md"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--accent) / 0.10))" }}
              >
                {/* Header: oferta + ahorro */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3 h-3 text-accent flex-shrink-0" />
                    <span className="text-[10px] uppercase tracking-wider text-accent font-bold truncate">
                      Oferta lanzamiento
                    </span>
                  </div>
                  <motion.span
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex-shrink-0 px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] sm:text-[11px] font-black tracking-wide shadow-md whitespace-nowrap"
                  >
                    AHORRA 89%
                  </motion.span>
                </div>

                {/* Price row */}
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0 mb-2">
                  <span
                    className={`font-black text-foreground leading-none tracking-tight tabular-nums ${
                      campaignFull.price.length > 9
                        ? 'text-2xl sm:text-3xl md:text-4xl'
                        : campaignFull.price.length > 6
                          ? 'text-3xl sm:text-4xl md:text-5xl'
                          : 'text-4xl sm:text-5xl md:text-6xl'
                    }`}
                  >
                    {campaignFull.price}
                  </span>
                  <span className="text-sm md:text-base text-muted-foreground line-through tabular-nums">
                    {campaignFull.originalPrice}
                  </span>
                </div>

                {/* Métodos de pago */}
                <div className="pt-2 border-t border-border/40">
                  <span className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                    Métodos de pago
                  </span>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 max-w-full">
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-background/80 text-[10px] sm:text-[11px] md:text-xs font-semibold text-foreground border border-border/60 whitespace-nowrap">
                      💳 Tarjetas
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-background/80 text-[10px] sm:text-[11px] md:text-xs font-semibold text-foreground border border-border/60 whitespace-nowrap">
                      🏦 Transferencia
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-background/80 text-[10px] sm:text-[11px] md:text-xs font-semibold text-foreground border border-border/60 whitespace-nowrap">
                      💵 Efectivo
                    </span>
                  </div>
                </div>
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
                INCLUIDOS GRATIS • LATINOAMÉRICA 🌎
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                🎁 5 Regalos Para Ti
              </h2>
              <p className="text-muted-foreground mt-2">
                Incluye <span className="font-bold text-foreground">estructuras gramaticales</span> + pago en tu moneda local. Valorados en <span className="line-through">$62 USD</span> — <span className="font-bold text-accent">GRATIS</span> con tu compra hoy.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      <CustomerReviewsCarousel />

      <CompactBuyCard
        title="Inglés Relax 5,000"
        subtitle="Top-Rated Curso Digital con Pronunciación ES"
        price={campaignFull.price}
        originalPrice={campaignFull.originalPrice}
        discountLabel="AHORRA 89%"
        rating={4.8}
        reviewsCount="800+"
        badges={[
          "Pronunciación ES",
          "Fonética UK/USA",
          "Descarga inmediata",
          "4 Bonus GRATIS",
        ]}
        ctaText={`COMPRAR AHORA | ${campaignFull.price}`}
        onBuy={handleBuy}
        socialProof="María y 12,000+ personas más ya lo compraron"
        noteText="NOTA: Quedan pocas plazas a este precio. ¡No esperes!"
      />
      {/* Cross-sell: Other Product Option */}
      <ProductCrossSell currentProduct="5000" lang="es" />

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
        price={campaign.price}
        originalPrice={campaign.originalPrice}
        currencyCode={campaign.currency}
        productName="INGLÉS RELAX - 5,000 Palabras (Digital PDF)"
        rating={4.8}
        reviewCount={800}
        showReviews={true}
        ctaText="DESCARGAR AHORA - PAGO SEGURO"
        buyUrl="https://pay.hotmart.com/O100578526P?bid=1778299502267"
      />

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification />

      {/* Exit Intent Popup */}
      <ExitIntentPopup
        buyUrl="https://pay.hotmart.com/O100578526P?bid=1778299502267"
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
