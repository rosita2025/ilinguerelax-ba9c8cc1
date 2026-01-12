import { useState, useMemo } from "react";
import { useMetaPixelViewContent } from "@/hooks/useMetaPixel";
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
import { Star, Check, BookOpen, Globe, ArrowRight, ShoppingCart, Clock, Gift, Download, RefreshCw, Eye, ZoomIn, ChevronLeft, ChevronRight, User, Smartphone, FileText, GraduationCap, Lightbulb, CreditCard, X } from "lucide-react";

// Preview images
import previewIndice from "@/assets/preview-indice.png";
import previewGramatica from "@/assets/preview-gramatica.png";
import previewFrases from "@/assets/preview-frases.jpg";
import previewVocabulario from "@/assets/preview-vocabulario.png";
import product5000Image from "@/assets/product-5000.png";

// Partner logos
import logoAmazon from "@/assets/logo-amazon.png";
import logoEbay from "@/assets/logo-ebay.png";
import logoHotmart from "@/assets/logo-hotmart.svg";
import logoShopify from "@/assets/logo-shopify.png";
import logoKindle from "@/assets/logo-kindle.png";

// Components
import { StoreSubscriptionCard } from "@/components/StoreSubscriptionCard";
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
  description: "Aprende la fórmula completa: Sujeto + Verbo + Artículo + Objeto + Preposición + Lugar. Incluye ejemplos y pronunciación."
}, {
  icon: Globe,
  title: "Bonus 2: Diccionario Alfabético",
  description: "5,000 palabras organizadas alfabéticamente con pronunciación adaptada. Ideal para consultas rápidas."
}, {
  icon: BookOpen,
  title: "Bonus 3: Verbo To Be y Más",
  description: "Tablas prácticas del verbo To Be, artículos (a/an/the) y preposiciones (in/on/at) con ejemplos."
}, {
  icon: RefreshCw,
  title: "Bonus 4: Actualizaciones Gratis",
  description: "Acceso de por vida al contenido con todas las actualizaciones futuras y nuevas versiones sin costo adicional."
}];
const chapters = ["Casa y Hogar", "Comidas y Bebidas", "Transportes", "Profesiones", "Lugares", "Países y Ciudades", "Ambiente y Naturaleza", "Tecnología", "Universidad", "Vida Cotidiana", "Trabajo", "Viajes", "Emociones", "Deportes", "Expresiones Comunes", "Y mucho más..."];
const Product5000 = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Meta Pixel ViewContent event
  const pixelParams = useMemo(() => ({
    content_name: "Inglés Relax - 5,000 Palabras",
    content_category: "Digital Book",
    content_ids: ["product-5000"],
    content_type: "product",
    value: 17,
    currency: "USD"
  }), []);
  useMetaPixelViewContent(pixelParams);
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
  const handleBuy = () => {
    window.open("https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true", "_blank");
  };
  return <main className="min-h-screen bg-background">
      <SEO title="5,000 Palabras en Inglés con Pronunciación Español y Fonética UK/USA" description="Aprende 5,000 palabras en inglés con pronunciación adaptada para hispanohablantes. Incluye fonética UK/USA, 52 capítulos temáticos y 4 bonus gratis. Descarga inmediata." canonicalUrl="https://ilinguerelax.com/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa" image="https://ilinguerelax.com/product-5000.png" type="product" price="17" originalPrice="54" rating="4.8" reviewCount="800" sku="ILINGUE-5000" keywords="aprender inglés, vocabulario inglés 5000 palabras, pronunciación inglés hispanohablantes, libro digital inglés" />
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Gift className="w-4 h-4" />
                <span>Incluye 4 Bonus</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 5,000 Palabras con Pronunciación Español y
                Fonética UK/USA
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-accent text-accent" />)}
                </div>
                <span className="text-muted-foreground">(800 Reseñas)</span>
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={15} maxViewers={32} />
              </div>

              {/* Urgency Banner */}
              <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Clock className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-600">
                  🔥 ¡Oferta por tiempo limitado! Quedan pocas unidades
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-5xl font-bold text-foreground">$17</span>
                <span className="text-2xl text-muted-foreground line-through">
                  $54
                </span>
                <span className="px-3 py-1 rounded-full gradient-accent text-accent-foreground text-sm font-bold">
                  AHORRA 86%
                </span>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Pago Seguro</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Descarga Inmediata</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <RefreshCw className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">Garantía 7 días</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Star className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">+800 Reseñas</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="flex flex-wrap gap-4 mb-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span>Agregar al carrito</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Compra inmediata</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  <span>Entrega digital</span>
                </div>
              </div>

              {/* CTA */}
              <Button variant="hero" size="xl" className="w-full md:w-auto mb-4 animate-pulse" onClick={handleBuy}>
                QUIERO COMPRAR AHORA
                <ArrowRight className="w-5 h-5" />
              </Button>

              {/* Money Back Guarantee */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-700">Garantía de Devolución 7 Días</p>
                  <p className="text-xs text-green-600">Si no estás satisfecho, te devolvemos el 100% de tu dinero</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                🔒 Pago 100% seguro • Entrega inmediata • Garantía de satisfacción
              </p>
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
            {bonuses.map((bonus, index) => <div key={bonus.title} className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-hero transition-all duration-500">
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
              </div>)}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <ComparisonTable />

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



      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar price="$17" originalPrice="$54" productName="INGLÉS RELAX - 5,000 Palabras (Digital PDF)" rating={4.8} reviewCount={800} showReviews={true} buyUrl="https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true" />

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification />

      {/* Exit Intent Popup */}
      <ExitIntentPopup buyUrl="https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true" discount="15%" />

      {/* WhatsApp Support Button */}
      <WhatsAppButton />
    </main>;
};
export default Product5000;