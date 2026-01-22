import { useState, useMemo } from "react";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
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
import { Star, Check, BookOpen, Globe, ArrowRight, ShoppingCart, Clock, Gift, Download, RefreshCw, Eye, ZoomIn, ChevronLeft, ChevronRight, User, Smartphone, FileText, GraduationCap, Lightbulb, CreditCard, X, Zap, Sparkles, Shield } from "lucide-react";
import { motion } from "framer-motion";


// Preview images
import previewIndice from "@/assets/preview-indice.png";
import previewGramatica from "@/assets/preview-gramatica.png";
import previewFrases from "@/assets/preview-frases.jpg";
import previewVocabulario from "@/assets/preview-vocabulario.png";
import product5000Image from "@/assets/product-5000.png";

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

const partnerLogos = [{
  src: logoAmazon,
  alt: "Amazon",
  height: "h-10 md:h-14"
}, {
  src: logoEbay,
  alt: "eBay",
  height: "h-10 md:h-14"
}, {
  src: logoShopify,
  alt: "Shopify",
  height: "h-10 md:h-14"
}, {
  src: logoHotmart,
  alt: "Hotmart",
  height: "h-8 md:h-12"
}, {
  src: logoKindle,
  alt: "Amazon Kindle",
  height: "h-8 md:h-12"
}];
const previewImages = [{
  src: previewIndice,
  title: "Índice Completo",
  subtitle: "52 capítulos temáticos organizados"
}, {
  src: previewGramatica,
  title: "Estructura Gramatical",
  subtitle: "Fórmulas para construir frases A1-C1"
}, {
  src: previewFrases,
  title: "Frases con Ejemplos",
  subtitle: "Verbos profesionales y académicos"
}, {
  src: previewVocabulario,
  title: "Vocabulario 5,000 Palabras",
  subtitle: "Palabras con pronunciación y fonética"
}];
const features = ["5,000+ palabras más utilizadas en inglés", "Pronunciación adaptada para hispanohablantes", "Fonética internacional UK/USA incluida", "Nivel básico a intermedio", "52 capítulos temáticos organizados", "Significado en español de cada palabra", "Entrega digital inmediata", "Acceso de por vida"];
const bonuses = [{
  icon: BookOpen,
  title: "Bonus 1: Estructura de Frases",
  description: "Aprende la fórmula completa: Sujeto + Verbo + Artículo + Objeto + Preposición + Lugar. Incluye ejemplos y pronunciación.",
  image: bonusEstructura
}, {
  icon: Globe,
  title: "Bonus 2: Diccionario Alfabético",
  description: "5,000 palabras organizadas alfabéticamente con pronunciación adaptada. Ideal para consultas rápidas.",
  image: bonusDiccionario
}, {
  icon: BookOpen,
  title: "Bonus 3: Verbo To Be y Más",
  description: "Tablas prácticas del verbo To Be, artículos (a/an/the) y preposiciones (in/on/at) con ejemplos.",
  image: bonusArticulos
}, {
  icon: RefreshCw,
  title: "Bonus 4: Vista Previa del Libro",
  description: "Acceso de por vida al contenido con todas las actualizaciones futuras y nuevas versiones sin costo adicional.",
  image: bonusPreview
}];
const chapters = ["Casa y Hogar", "Comidas y Bebidas", "Transportes", "Profesiones", "Lugares", "Países y Ciudades", "Ambiente y Naturaleza", "Tecnología", "Universidad", "Vida Cotidiana", "Trabajo", "Viajes", "Emociones", "Deportes", "Expresiones Comunes", "Y mucho más..."];
const Product5000 = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bonusLightboxOpen, setBonusLightboxOpen] = useState(false);
  const [currentBonusIndex, setCurrentBonusIndex] = useState(0);

  // Meta Pixel ViewContent event - HOTMART PIXEL
  const pixelParams = useMemo(() => ({
    content_name: "Inglés Relax - 5,000 Palabras",
    content_category: "Digital Book",
    content_ids: ["product-5000"],
    content_type: "product",
    value: 10,
    currency: "USD"
  }), []);
  useHotmartPixel(pixelParams);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };
  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % previewImages.length);
  };
  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + previewImages.length) % previewImages.length);
  };
  const openBonusLightbox = (index: number) => {
    setCurrentBonusIndex(index);
    setBonusLightboxOpen(true);
  };
  const nextBonusImage = () => {
    setCurrentBonusIndex(prev => (prev + 1) % bonuses.length);
  };
  const prevBonusImage = () => {
    setCurrentBonusIndex(prev => (prev - 1 + bonuses.length) % bonuses.length);
  };
  const handleBuy = () => {
    // Track InitiateCheckout with Hotmart pixel
    trackHotmartEvent("InitiateCheckout", {
      content_name: "Inglés Relax - 5,000 Palabras",
      content_category: "Digital Book",
      content_ids: ["product-5000"],
      content_type: "product",
      value: 10,
      currency: "USD",
      num_items: 1,
    });
    window.open("https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true", "_blank");
  };
  return <main className="min-h-screen bg-background">
      <SEO title="5,000 Palabras en Inglés con Pronunciación Español y Fonética UK/USA" description="Aprende 5,000 palabras en inglés con pronunciación adaptada para hispanohablantes. Incluye fonética UK/USA, 52 capítulos temáticos y 4 bonus gratis. Descarga inmediata." canonicalUrl="https://ilinguerelax.com/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa" image="https://ilinguerelax.com/product-5000.png" type="product" price="10" originalPrice="54" rating="4.8" reviewCount="800" sku="ILINGUE-5000" keywords="aprender inglés, vocabulario inglés 5000 palabras, pronunciación inglés hispanohablantes, libro digital inglés" />
      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">
            {previewImages[currentImageIndex]?.title}
          </DialogTitle>
          <div className="relative flex items-center justify-center min-h-[80vh]">
            {/* Close button */}
            <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous button */}
            <button onClick={prevImage} className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>

            {/* Image */}
            <div className="flex flex-col items-center px-16">
              <img src={previewImages[currentImageIndex]?.src} alt={previewImages[currentImageIndex]?.title} className="max-h-[70vh] w-auto object-contain rounded-lg" />
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-white">
                  {previewImages[currentImageIndex]?.title}
                </h3>
                <p className="text-white/70 mt-1">
                  {previewImages[currentImageIndex]?.subtitle}
                </p>
                <p className="text-white/50 text-sm mt-2">
                  {currentImageIndex + 1} / {previewImages.length}
                </p>
              </div>
            </div>

            {/* Next button */}
            <button onClick={nextImage} className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bonus Lightbox Dialog */}
      <Dialog open={bonusLightboxOpen} onOpenChange={setBonusLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">
            {bonuses[currentBonusIndex]?.title}
          </DialogTitle>
          <div className="relative flex items-center justify-center min-h-[80vh]">
            {/* Close button */}
            <button onClick={() => setBonusLightboxOpen(false)} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous button */}
            <button onClick={prevBonusImage} className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
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
                <h3 className="text-xl font-bold text-white">
                  {bonuses[currentBonusIndex]?.title}
                </h3>
                <p className="text-white/70 mt-1 max-w-md">
                  {bonuses[currentBonusIndex]?.description}
                </p>
                <p className="text-white/50 text-sm mt-2">
                  {currentBonusIndex + 1} / {bonuses.length}
                </p>
              </div>
            </div>

            {/* Next button */}
            <button onClick={nextBonusImage} className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
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
                <img src={product5000Image} alt="Inglés Relax - 5,000 Palabras" className="w-full h-auto rounded-2xl shadow-hero" />
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
                Inglés Relax - 5,000 Palabras con Pronunciación Español y
                Fonética UK/USA
              </h1>

              {/* Reviews - More Prominent */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
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

              {/* Price Section - More Impactful */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20 mb-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-semibold text-sm uppercase">Precio Especial Por Tiempo Limitado</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$10</span>
                  <span className="text-2xl text-muted-foreground line-through">$54</span>
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg"
                  >
                    AHORRA 81%
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">
                  💳 Pago único • Sin suscripciones • Acceso de por vida
                </p>
              </motion.div>

              {/* Stock Counter - Scarcity */}
              <div className="mb-6">
                <StockCounter totalStock={50} remainingStock={12} lang="es" />
              </div>

              {/* CTA Button - More Impactful */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
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
                  <p className="text-sm text-green-600">Si no estás satisfecho, te devolvemos TODO tu dinero. Sin preguntas.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <CountdownTimer hoursFromNow={24} />

      {/* Collaboration Section */}
      <section className="py-10 md:py-14 bg-secondary/20 border-y border-border">
        <div className="container px-4 md:px-6">
          {/* Top - Static text */}
          <div className="text-center mb-8">
            <p className="text-primary font-semibold text-sm md:text-base uppercase tracking-wider mb-2">
              En colaboración
            </p>
            <h2 className="md:text-5xl font-bold text-foreground text-xl">
               ¡Libro Físico Muy Pronto!
            </h2>
            <p className="text-muted-foreground mt-2">Junio 2026</p>
          </div>

          {/* Store Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mb-8">
            <StoreSubscriptionCard logo={logoAmazon} storeName="Amazon" type="coming-soon" />
            <StoreSubscriptionCard logo={logoEbay} storeName="eBay" type="coming-soon" />
            <StoreSubscriptionCard logo={logoShopify} storeName="Shopify" type="available" buyLink="https://ilinguerelax.com/products/8-000-palabras-libro-fisico" />
          </div>
        </div>

        {/* Bottom - Logo Ticker */}
        <div className="overflow-hidden bg-gray-900 py-8 md:py-10 mt-6 rounded-2xl">
          <div className="flex animate-ticker" style={{
          width: 'max-content'
        }}>
            {[...Array(4)].map((_, setIndex) => <div key={setIndex} className="flex items-center shrink-0 gap-20 md:gap-32 px-10 md:px-16">
                {partnerLogos.map((logo, index) => <img key={`${setIndex}-${index}`} src={logo.src} alt={logo.alt} className={`${logo.height} w-auto object-contain shrink-0 brightness-0 invert opacity-90`} />)}
              </div>)}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
              5,000+ Palabras con{" "}
              <span className="text-gradient">Pronunciación Hispanohablante</span>
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Cada palabra incluye significado, pronunciación y fonética
              internacional
            </p>

            <div className="bg-card rounded-3xl border border-border shadow-card p-8 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map(feature => <div key={feature} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>)}
              </div>
            </div>

            {/* Benefits Grid with Preview Images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-500 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={previewIndice} 
                    alt="Índice Completo" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full gradient-hero flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h4 className="font-bold text-foreground mb-1">Índice Completo</h4>
                  <p className="text-sm text-muted-foreground">52 capítulos temáticos organizados</p>
                </div>
              </div>
              
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-500 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={previewGramatica} 
                    alt="Estructura Gramatical" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full gradient-hero flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h4 className="font-bold text-foreground mb-1">Estructura Gramatical</h4>
                  <p className="text-sm text-muted-foreground">Fórmulas para construir frases A1-C1</p>
                </div>
              </div>
              
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-500 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={previewFrases} 
                    alt="Frases con Ejemplos" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full gradient-hero flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h4 className="font-bold text-foreground mb-1">Frases con Ejemplos</h4>
                  <p className="text-sm text-muted-foreground">Verbos profesionales y académicos</p>
                </div>
              </div>
              
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-500 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={previewVocabulario} 
                    alt="Vocabulario 5,000 Palabras" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full gradient-hero flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h4 className="font-bold text-foreground mb-1">Vocabulario 5,000 Palabras</h4>
                  <p className="text-sm text-muted-foreground">Palabras con pronunciación y fonética</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bonuses */}
      <section className="py-12 md:py-16 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-accent text-accent-foreground text-sm font-bold mb-4">
              <Gift className="w-4 h-4" />
              INCLUIDOS CON TU COMPRA
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              4 Bonus Gratuitas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recibe estos recursos adicionales valorados en $50 completamente
              gratis con tu compra
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {bonuses.map((bonus, index) => (
              <div 
                key={bonus.title} 
                className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-500 group cursor-pointer"
                onClick={() => openBonusLightbox(index)}
              >
                {/* Bonus Image */}
                {bonus.image && (
                  <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-secondary/50 to-muted/30">
                    <img
                      src={bonus.image}
                      alt={bonus.title}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-bold">
                      GRATIS
                    </div>
                    {/* Zoom indicator */}
                    <div className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </div>
                )}
                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                      <bonus.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {bonus.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {bonus.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Testimonial */}
      <VideoTestimonial 
        videoUrl="https://youtu.be/bG35t0x3GkU"
        customerName="Cliente Verificado"
        customerLocation="Latinoamérica"
        testimonialQuote="Este libro cambió completamente mi forma de aprender inglés. La pronunciación adaptada al español hace que sea muy fácil de entender. ¡100% recomendado!"
        lang="es"
      />

      {/* Product Reviews Carousel */}
      <ProductReviews productType="english" />


      {/* FAQ Section */}
      <FAQ items={[{
      question: "¿Quién es el autor del libro?",
      answer: "INGLÉS RELAX es una obra de iLingue Relax, una marca educativa enfocada en aprender inglés de forma simple, práctica y sin estrés.",
      icon: User
    }, {
      question: "¿INGLÉS RELAX es un libro físico o digital?",
      answer: "Actualmente, INGLÉS RELAX es un producto digital disponible para compra inmediata. El libro puede descargarse y imprimirse en casa si el usuario lo desea. El libro físico (tapa blanda pegada) está previsto para junio de 2026. En algunas promociones futuras, el libro físico podrá incluir la versión digital (PDF) como bono.",
      icon: Smartphone
    }, {
      question: "¿Cuántas páginas tiene INGLÉS RELAX?",
      answer: "El libro digital tiene entre 300 y 350 páginas de contenido práctico, organizado y fácil de estudiar.",
      icon: FileText
    }, {
      question: "¿Es adecuado para estudiar solo/a?",
      answer: "Sí. INGLÉS RELAX está diseñado para autoestudio, para aprender a tu ritmo y sin presión.",
      icon: GraduationCap
    }, {
      question: "¿Necesito saber inglés antes de usar el libro?",
      answer: "No. Puedes empezar desde cero, sin conocimientos previos de inglés.",
      icon: Lightbulb
    }, {
      question: "¿El libro incluye pronunciación?",
      answer: "Sí. Todas las palabras incluyen pronunciación adaptada al español, pensada para hispanohablantes.",
      icon: BookOpen
    }, {
      question: "¿Cómo realizo el pago?",
      answer: "Puedes pagar de forma segura mediante: Tarjeta de crédito o débito internacional (Stripe) o Hotmart, donde puedes elegir distintos métodos de pago, incluyendo transferencias según tu país.",
      icon: CreditCard
    }]} title="Preguntas Frecuentes" subtitle="Resolvemos tus dudas sobre INGLÉS RELAX" />

      {/* Comparison Table */}
      <ComparisonTable />

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
                <span className="font-semibold text-white">Autora Crady by iLingue Relax</span> - 
                Creadora del método ILINGUE RELAX para aprender idiomas de forma simple, visual y relajada.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar price="$10" originalPrice="$54" productName="INGLÉS RELAX - 5,000 Palabras (Digital PDF)" rating={4.8} reviewCount={800} showReviews={true} buyUrl="https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true" />

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification />

      {/* Exit Intent Popup */}
      <ExitIntentPopup buyUrl="https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true" discount="15%" />

      {/* WhatsApp Support Button */}
      <WhatsAppButton />

      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={500} />
    </main>;
};
export default Product5000;