import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
const product5000BookImg = "/images/product-5000-book.webp";
import productoPrincipalInglesRelax from "@/assets/oferta-5000-ingles-gramatica.webp";
import reviewFb1 from "@/assets/review-fb-1.jpg";
import reviewFb2 from "@/assets/review-fb-2.jpg";
import reviewFb3 from "@/assets/review-fb-3.jpg";
import reviewFb4 from "@/assets/review-fb-4.jpg";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { LiveViewers } from "@/components/LiveViewers";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { DigitalProductNotice } from "@/components/DigitalProductNotice";
import { CompactBuyCard } from "@/components/CompactBuyCard";

// Lazy-loaded below-the-fold components for faster initial load
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));
const SalesNotification = lazy(() => import("@/components/SalesNotification"));

const CustomerReviewsCarousel = lazy(() => import("@/components/CustomerReviewsCarousel").then(m => ({ default: m.CustomerReviewsCarousel })));
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useNavigate } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { detectCurrency, formatPrice, useI18n } from "@/i18n";
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
import previewIndice from "@/assets/preview-indice.webp";
import previewGramatica from "@/assets/preview-gramatica-estructura.webp";
import previewFrases from "@/assets/preview-frases-verbos.webp";
import previewVocabulario from "@/assets/preview-vocabulario.webp";
const product5000Image = productoPrincipalInglesRelax;

// Bonus images (5 regalos)
import bonus1Estructuras from "@/assets/bonus-1-estructuras-gramaticas.webp";
import bonus5Estudiar from "@/assets/bonus-5-como-estudiar-ingles-6-meses.webp";

// About section image
import aboutIlingueRelax from "@/assets/about-ilingue-relax.webp";

// Partner logos
import logoAmazon from "@/assets/logo-amazon.png";
import logoEbay from "@/assets/logo-ebay.png";
import logoHotmart from "@/assets/logo-hotmart.svg";
import logoShopify from "@/assets/logo-shopify.png";
import logoKindle from "@/assets/logo-kindle.png";

// Components
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";

import { ScrollToTop } from "@/components/ScrollToTop";
import { PinterestSave } from "@/components/PinterestSave";

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
    icon: BookOpen,
    title: "Regalo 2: Cómo Estudiar Inglés Relax Paso a Paso en 6 Meses",
    description:
      "Tu plan paso a paso para hablar inglés con confianza en solo 6 meses con el método Inglés Relax, sin perder tiempo ni motivación.",
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
  const { currency, countryCode } = useI18n();
  const ADMIN_SKU_5000 = "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa";
  const PRODUCT_SKU = "5-000-palabras-libro-fisico";
  const TIENDA_CHECKOUT_5000 = `/checkouts/${PRODUCT_SKU}`;
  const HOTMART_5000_LATAM = "https://pay.hotmart.com/O100578526P?checkoutMode=10&bid=1779846934153";
  const pricing5000 = useAdminPricing(ADMIN_SKU_5000);
  const tier = useCountryTierRouting(ADMIN_SKU_5000, {
    tiendaPath: TIENDA_CHECKOUT_5000,
  });
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  
  // Precarga el paquete de JS del checkout en segundo plano (mismo fix que
  // en ProductDynamic.tsx) para evitar la pantalla en blanco de 3-5s al
  // tocar "comprar".
  useEffect(() => {
    const prefetch = () => { import("@/pages/Checkout"); };
    const w = window as typeof window & { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(prefetch);
      return;
    }
    const timeoutId = window.setTimeout(prefetch, 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);
  
  const { isPeru, priceUsd: priceUSD, priceGlobalUsd, priceLatamUsd, priceTiendaUsd, pricePen, country } = tier;
  const isLatam = false; // Internal checkout for everyone
  const pricing5000Ready = tier.loaded;
  const displayCurrency = currency;
  // Fuente única: los labels del hook (respetan los montos exactos por moneda
  // fijados en /admin/productos/:sku y el formato local punto/coma).
  const displayPrice = tier.priceLabel;
  const displayOriginalPrice = tier.originalLabel;
  const regionLabel = isPeru ? "PE" : isLatam ? "LATAM" : "Global";
  const buyUrl = TIENDA_CHECKOUT_5000;
  const safePriceLabel = pricing5000Ready ? displayPrice : "Cargando precio…";

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
      value: priceUSD,
      currency: "USD",
    }),
    [priceUSD],
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
  // Fires Meta Pixel InitiateCheckout — only invoked when we navigate to our
  // own /checkouts page. Hotmart routes skip this: Hotmart embeds the same
  // pixel id (24959578143733255) and would double-count the event.
  const handleBuyClick = () => {
    trackHotmartEvent("InitiateCheckout", {
      content_name: "Inglés Relax - 5,000 Palabras",
      content_category: "Digital Book",
      content_ids: ["product-5000"],
      content_type: "product",
      value: priceUSD,
      currency: "USD",
      num_items: 1,
    });
  };

  // Protección contra doble-toque (ver mismo fix en ProductDynamic.tsx).
  const buyClickedRef = useRef(false);
  const handleBuy = async () => {
    if (!pricing5000Ready) return;
    if (buyClickedRef.current) return;
    buyClickedRef.current = true;
    trackHotmartEvent("InitiateCheckout", {
      content_name: "Inglés Relax - 5,000 Palabras",
      content_category: "Digital Book",
      content_ids: ["product-5000"],
      content_type: "product",
      value: priceUSD,
      currency: "USD",
      num_items: 1,
    });
    
    addItem({
      id: "5000-palabras-ingles",
      name: "Inglés Relax · 5,000 Palabras (Digital PDF)",
      price: priceUSD,
      regionPrices: { 
        latam: priceLatamUsd, 
        global: priceGlobalUsd, 
        tienda: priceTiendaUsd 
      },
      pricePen: pricePen ?? undefined,
      localUsdPrices: pricing5000.localUsdPrices ?? undefined,
      image: "/images/product-5000-book.webp",
      description: "5,000 palabras del inglés con pronunciación en español y fonética UK/USA",
      quantity: 1,
    });
    
    sonnerToast.success("Producto agregado al carrito");
    navigate(TIENDA_CHECKOUT_5000);
  };
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={pricing5000.name ?? "5,000 Palabras en Inglés PDF con Pronunciación"}
        description={pricing5000.description ?? "Libro digital con 5,000 palabras en inglés, pronunciación en español y fonética UK/USA. 52 capítulos, nivel A1–C1. PDF descargable al instante."}
        canonicalUrl="https://ilinguerelax.com/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa"
        image={pricing5000.coverImageUrl ?? "https://ilinguerelax.com/images/product-5000.webp"}
        type="product"
        price={priceUSD.toString()}
        originalPrice={(priceUSD * 2.5).toString()}
        rating={pricing5000.rating?.toString() ?? "4.8"}
        reviewCount={pricing5000.reviewCount?.toString() ?? "800"}
        sku={ADMIN_SKU_5000}
        availability="InStock"
        keywords="5000 palabras en inglés, vocabulario en inglés con pronunciación, libro de inglés pdf, aprender inglés desde cero, inglés para hispanohablantes, pronunciación inglés adaptada al español, fonética inglés UK USA, inglés A1 A2 B1 B2 C1, ebook de inglés, descargar libro de inglés, aprender inglés en Perú, aprender inglés en México"
      />
      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">{previewImages[currentImageIndex]?.title}</DialogTitle>
          <div className="relative flex items-center justify-center min-h-[80vh]">
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              aria-label="Cerrar vista previa"
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous button */}
            <button
              onClick={prevImage}
              aria-label="Imagen anterior"
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
                <p className="text-white/75 text-sm mt-2">
                  {currentImageIndex + 1} / {previewImages.length}
                </p>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={nextImage}
              aria-label="Imagen siguiente"
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
              aria-label="Cerrar vista previa"
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous button */}
            <button
              onClick={prevBonusImage}
              aria-label="Bonus anterior"
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
                <p className="text-white/75 text-sm mt-2">
                  {currentBonusIndex + 1} / {bonuses.length}
                </p>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={nextBonusImage}
              aria-label="Bonus siguiente"
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
                  fetchPriority="high"
                  decoding="async"
                />
                <PinterestSave overlay />
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
                  <span>2 Regalos Gratis</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {pricing5000.name ?? "Inglés Relax - 5,000 Palabras con Pronunciación Español y Fonética UK/USA"}
              </h1>
              <p className="text-base text-muted-foreground mb-4">
                {pricing5000.description ?? (<>📚 Incluye estructura gramatical completa desde{" "}
                <span className="font-bold text-foreground">Nivel Cero hasta Avanzado C1</span>. Perfecto para
                principiantes y estudiantes avanzados.</>)}
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
                    AHORRA 35%
                  </motion.span>
                </div>

                {/* Price row */}
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0 mb-2">
                  <span
                    className={`font-black text-foreground leading-none tracking-tight tabular-nums ${
                      safePriceLabel.length > 9
                        ? 'text-2xl sm:text-3xl md:text-4xl'
                        : safePriceLabel.length > 6
                          ? 'text-3xl sm:text-4xl md:text-5xl'
                          : 'text-4xl sm:text-5xl md:text-6xl'
                    }`}
                  >
                    {safePriceLabel}
                  </span>
                  {pricing5000Ready && (
                    <span className="text-sm md:text-base text-muted-foreground line-through tabular-nums">
                      {displayOriginalPrice}
                    </span>
                  )}
                  {pricing5000Ready && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shadow-sm">
                      {displayCurrency} · {regionLabel}
                    </span>
                  )}
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

              <div className="mb-4">
                <DigitalProductNotice compact />
              </div>

              {/* Stock Counter - Scarcity */}
              <div className="mb-6">
                <StockCounter totalStock={50} remainingStock={12} lang="es" />
              </div>

              {/* CTA Button - More Impactful */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  variant="hero"
                  size="xl"
                  className="w-full mb-4 text-lg py-6 shadow-2xl relative overflow-hidden group"
                >
                  <button
                    className="flex items-center justify-center w-full h-full"
                    onClick={handleBuy}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <ShoppingCart className="w-6 h-6 mr-2" />
                    LO QUIERO
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </button>
                </Button>
              </motion.div>

              {/* Secondary CTA */}
              <p className="text-center text-sm text-muted-foreground mb-6">
                {isPeru
                  ? "👆 Pago local en soles (Yape, Plin, tarjetas, transferencia)"
                  : "👆 Pago seguro en USD (tarjetas internacionales)"}
              </p>


              {/* Trust Badges */}


              {/* Quality & Brand Trust */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Material PDF de marca iLingue Relax — NO es basura
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Máxima calidad garantizada. Satisfacción 100% asegurada.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* WhatsApp Support */}
              <motion.a
                href="https://wa.link/lkvwgr"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-lg">💬</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-700">¿Tienes alguna pregunta hoy?</p>
                  <p className="text-xs text-green-600">Escríbeme por WhatsApp y te respondo al instante</p>
                </div>
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Cards - Compact */}
      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-3">
              📖 Vista Previa del Contenido
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
              🔍 Te recomendamos ver la vista previa antes de comprar para conocer exactamente lo que recibirás.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={previewIndice} alt="Vista previa del índice completo del libro de inglés" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-bold text-foreground text-sm">Índice Completo</h3>
                  <p className="text-xs text-muted-foreground">52 capítulos</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={previewVocabulario} alt="Vista previa del vocabulario inglés con pronunciación" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-bold text-foreground text-sm">5,000 Palabras</h3>
                  <p className="text-xs text-muted-foreground">Con pronunciación</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 Bonus GRATIS Section */}
      <section className="py-10 md:py-14 bg-gradient-to-b from-accent/5 to-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold mb-3">
                <Gift className="w-4 h-4" />
                INCLUIDOS GRATIS • LATINOAMÉRICA
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                2 Regalos Gratis Incluidos al Comprar el Libro Inglés Relax
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                Paga con <span className="font-bold text-foreground">tarjeta</span>, transferencia o efectivo en tu moneda local.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/40 bg-accent/10 shadow-sm">
                <span className="text-[11px] md:text-xs font-semibold text-muted-foreground line-through tabular-nums">
                  {pricing5000Ready ? displayOriginalPrice : "—"}
                </span>
                <span className="text-[11px] md:text-xs font-black uppercase tracking-wide text-accent">
                  GRATIS hoy
                </span>
              </div>
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
                      decoding="async"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-accent text-accent-foreground text-xs font-black">
                      GRATIS
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-foreground text-sm">{bonus.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bonus.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <CustomerReviewsCarousel />
      </Suspense>

      <CompactBuyCard
        title="Inglés Relax 5,000"
        subtitle="Top-Rated Curso Digital con Pronunciación ES"
        price={safePriceLabel}
        originalPrice={pricing5000Ready ? displayOriginalPrice : undefined}
        discountLabel="AHORRA 35%"
        rating={4.8}
        reviewsCount="800+"
        badges={[
          "Pronunciación ES",
          "Fonética UK/USA",
          "Descarga inmediata",
          "2 Bonus GRATIS",
        ]}
        ctaText={"LO QUIERO"}
        onBuy={handleBuy}
        socialProof="María y 12,000+ personas más ya lo compraron"
        noteText="NOTA: Quedan pocas plazas a este precio. ¡No esperes!"
      />
      {/* FAQ Section */}
      <Suspense fallback={null}>
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
      </Suspense>

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
                alt="Acerca del iLingue Relax - Autora Crady by iLingue Relax"
                loading="lazy"
                decoding="async"
                className="w-full h-auto"
              />
            </div>

            {/* Additional Content Below */}
            <div className="mt-8 text-center">
              <p className="text-white/80 text-lg md:text-xl max-w-3xl mx-auto">
                <span className="font-semibold text-white">Autora Crady by iLingue Relax</span> - Creadora del método
                iLingue Relax para aprender idiomas de forma simple, visual y relajada.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp Banner - Final CTA */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)]" />
        <div className="container px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              ¿Tienes alguna pregunta antes de comprar?
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-6 max-w-lg mx-auto">
              Escríbeme directamente por WhatsApp y te respondo al instante. Estoy aquí para ayudarte.
            </p>
            <motion.a
              href="https://wa.link/lkvwgr"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-green-700 font-bold text-lg shadow-2xl hover:shadow-green-500/30 transition-shadow"
            >
              <span className="text-2xl">💬</span>
              ESCRIBIR POR WHATSAPP
            </motion.a>
            <p className="text-white/60 text-sm mt-4">
              Respuesta en minutos · Sin compromiso
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar
        sku={PRODUCT_SKU}
        price={safePriceLabel}
           originalPrice={pricing5000Ready ? displayOriginalPrice : undefined}
           currencyCode={displayCurrency}
           usdValue={priceUSD}
           flag={tier.country ? (code => String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397)))(tier.country) : undefined}
        productName={pricing5000.name ?? "Inglés Relax - 5,000 Palabras"}
        rating={4.8}
        reviewCount={800}
        showReviews={true}
        ctaText={"LO QUIERO"}
        onBuyClick={handleBuy}
      />

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup */}
      <Suspense fallback={null}>
        <SalesNotification />
      </Suspense>

      {/* Exit Intent Popup */}
      <Suspense fallback={null}>
</Suspense>

      {/* WhatsApp Support Button */}
      <WhatsAppButton url="https://wa.link/ixti9p" label="¿Dudas?" />

      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={500} />
    </main>
  );
};
export default Product5000;
