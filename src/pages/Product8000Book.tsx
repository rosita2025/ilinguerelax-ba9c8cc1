import { useMemo } from "react";
import { useMetaPixelViewContent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { CountdownTimer } from "@/components/CountdownTimer";
import SalesNotification from "@/components/SalesNotification";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Check,
  BookOpen,
  Sparkles,
  ArrowRight,
  Gift,
  Truck,
  Brain,
  User,
  FileText,
  GraduationCap,
  Lightbulb,
  CreditCard,
  Package,
  Clock,
  Star,
  Shield,
  ShoppingCart,
} from "lucide-react";

// Product image
import product8000BookImage from "@/assets/product-8000-book.png";

// Conversion components
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { TrustBadges } from "@/components/TrustBadges";
import { VideoTestimonial } from "@/components/VideoTestimonial";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LiveViewers } from "@/components/LiveViewers";

const features = [
  "8,000 palabras esenciales del inglés",
  "Pronunciación en español incluida",
  "Diseñado para hispanohablantes",
  "Sin necesidad de diccionarios",
  "Metodología paso a paso sin estrés",
  "Fonética UK y USA incluida",
  "Libro físico tapa blanda de alta calidad",
  "Entre 300-350 páginas",
];

const benefits = [
  {
    icon: BookOpen,
    title: "Libro Físico Premium",
    description:
      "Tapa blanda de alta calidad, impresión profesional. Perfecto para estudiar sin pantallas y tomar notas.",
  },
  {
    icon: Package,
    title: "Envío a Tu Puerta",
    description:
      "Recibe tu libro físico directamente en casa. Envío disponible a múltiples países.",
  },
  {
    icon: Sparkles,
    title: "Método Sin Estrés",
    description:
      "Aprende a tu propio ritmo con nuestra metodología relajada que respeta tu proceso de aprendizaje.",
  },
  {
    icon: Brain,
    title: "Sin Diccionarios",
    description:
      "Todo lo que necesitas está incluido. Significados, pronunciación y ejemplos en un solo lugar.",
  },
];

const Product8000Book = () => {
  // Meta Pixel ViewContent event
  const pixelParams = useMemo(() => ({
    content_name: "Inglés Relax - 8,000 Palabras Libro Físico",
    content_category: "Physical Book",
    content_ids: ["product-8000-book"],
    content_type: "product",
    value: 32.99,
    currency: "USD",
  }), []);
  useMetaPixelViewContent(pixelParams);

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Libro Físico: 8,000 Palabras en Inglés - Compra Anticipada"
        description="Reserva el libro físico de 8,000 palabras en inglés con pronunciación para hispanohablantes. Tapa blanda premium, envío a domicilio. Precio especial de compra anticipada."
        canonicalUrl="https://ilinguerelax.com/products/8-000-palabras-libro-fisico"
        image="https://ilinguerelax.com/product-8000-book.png"
        type="product"
        price="32.99"
        rating="4.9"
        reviewCount="800"
        sku="ILINGUE-8000-BOOK"
        keywords="libro físico inglés, vocabulario inglés, pronunciación inglés hispanohablantes, libro inglés impreso"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative">
                <img
                  src={product8000BookImage}
                  alt="Inglés Relax - 8,000 Palabras Libro Físico"
                  className="w-full h-auto rounded-2xl shadow-hero"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Pre-order Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold border border-amber-500/20"
                >
                  <Clock className="w-4 h-4" />
                  <span>📦 COMPRA ANTICIPADA</span>
                </motion.div>
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium"
                >
                  <Gift className="w-4 h-4" />
                  <span>Envío Junio 2026</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 8,000 Palabras
                <br />
                <span className="text-amber-600">Libro Físico Tapa Blanda</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-4">
                El mismo método completo para aprender inglés sin estrés, ahora en formato libro físico premium. 
                Perfecto para estudiar sin pantallas.
              </p>

              {/* Reviews - More Prominent */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                </div>
                <span className="font-bold text-foreground">4.9/5</span>
                <span className="text-muted-foreground">(800+ Reseñas de la versión digital)</span>
              </div>

              {/* Purchase Counter - Social Proof */}
              <div className="mb-4">
                <PurchaseCounter baseCount={245} lang="es" />
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={5} maxViewers={15} />
              </div>

              {/* Price Section */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20 mb-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-600 font-semibold text-sm uppercase">Precio de Compra Anticipada</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$32.99</span>
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg"
                  >
                    PRECIO ANTICIPADO
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">
                  📦 Libro físico + PDF digital incluido • Envío a domicilio
                </p>
              </motion.div>

              {/* CTA Button - Disabled */}
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full mb-4 text-lg py-6 bg-amber-500/50 cursor-not-allowed"
                disabled
              >
                <Clock className="w-6 h-6 mr-2" />
                PRÓXIMAMENTE - JUNIO 2026
              </Button>

              <p className="text-center text-sm text-muted-foreground mb-6">
                📧 Regístrate para recibir notificación cuando esté disponible
              </p>

              {/* Trust Badges */}
              <TrustBadges lang="es" variant="grid" />

              {/* Pre-order Info */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-2 border-amber-500/30 mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-amber-700">📖 Libro Físico Premium</p>
                  <p className="text-sm text-amber-600">Tapa blanda de alta calidad, 300-350 páginas. Incluye versión PDF digital.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <CountdownTimer 
        hoursFromNow={48} 
        currentPrice="$32.99 USD"
        originalPrice="$45 USD"
        storageKey="countdown_book_physical"
      />

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¿Por qué elegir el{" "}
              <span className="text-amber-600">Libro Físico</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              La mejor experiencia de aprendizaje sin pantallas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-hero transition-all duration-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
              Todo lo que incluye
            </h2>

            <div className="bg-card rounded-3xl border border-border shadow-card p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-amber-500">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¡Reserva tu libro físico ahora!
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Precio especial de compra anticipada. Envío programado para Junio 2026.
            </p>

            <div className="bg-card rounded-3xl shadow-hero p-8 mb-8">
              <div className="flex items-baseline justify-center gap-3 mb-4">
                <span className="text-5xl font-bold text-foreground">$32.99</span>
                <span className="text-amber-600 font-bold">USD</span>
              </div>
              <p className="text-muted-foreground mb-6">
                Pago único • Envío incluido* • Incluye PDF digital
              </p>
              <Button variant="hero" size="xl" className="w-full bg-amber-500/50 cursor-not-allowed" disabled>
                PRÓXIMAMENTE
                <Clock className="w-5 h-5" />
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                *Consulta costos de envío según tu ubicación
              </p>
            </div>

            <p className="text-sm text-white/70">
              🔒 Pago 100% seguro • Garantía de satisfacción
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ
        items={[
          {
            question: "¿Quién es el autor del libro?",
            answer: "INGLÉS RELAX es una obra de iLingue Relax, una marca educativa enfocada en aprender inglés de forma simple, práctica y sin estrés.",
            icon: User,
          },
          {
            question: "¿Cuándo recibiré mi libro físico?",
            answer: "El libro físico está en compra anticipada. Los envíos están programados para comenzar en Junio de 2026. Recibirás actualizaciones por email sobre el estado de tu pedido.",
            icon: Truck,
          },
          {
            question: "¿Cuántas páginas tiene el libro?",
            answer: "El libro tiene entre 300 y 350 páginas de contenido práctico, organizado y fácil de estudiar.",
            icon: FileText,
          },
          {
            question: "¿Incluye la versión digital?",
            answer: "Sí. Al comprar el libro físico en compra anticipada, recibirás inmediatamente acceso a la versión digital (PDF) para que puedas comenzar a estudiar mientras esperas tu libro.",
            icon: Gift,
          },
          {
            question: "¿Hacen envíos internacionales?",
            answer: "Sí, realizamos envíos a múltiples países. Los costos de envío pueden variar según tu ubicación.",
            icon: Package,
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
            answer: "Puedes pagar de forma segura mediante tarjeta de crédito o débito internacional.",
            icon: CreditCard,
          },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre el libro físico"
      />

      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar
        price="$32.99"
        originalPrice="$45"
        productName="INGLÉS RELAX v1.0 - 8,000 Palabras en Inglés con pronunciación en español y fonética USA/UK - Libro físico"
        buyUrl="#"
        ctaText="PRÓXIMAMENTE"
        disabled={true}
        showReviews={false}
      />

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup - Disabled until product is available */}
      {/* <SalesNotification 
        productName="Libro Físico 8,000 Palabras" 
        productLabel="Libro Físico" 
      /> */}

      {/* Video Testimonial */}
      <VideoTestimonial 
        videoUrl="https://youtu.be/bG35t0x3GkU"
        customerName="Cliente Verificado"
        customerLocation="Latinoamérica"
        testimonialQuote="Este libro cambió completamente mi forma de aprender inglés. La pronunciación adaptada al español hace que sea muy fácil de entender. ¡100% recomendado!"
        lang="es"
      />

      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={500} />
    </main>
  );
};

export default Product8000Book;
