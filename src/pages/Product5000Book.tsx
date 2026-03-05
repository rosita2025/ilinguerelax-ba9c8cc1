import { useMemo, useState, useEffect, useRef } from "react";
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
  Star,
  Shield,
  ShoppingCart,
  ExternalLink,
} from "lucide-react";

import product5000BookImage from "@/assets/product-5000-book.png";
import product5000BookPerson from "@/assets/product-5000-book-person.jpg";

import { PurchaseCounter } from "@/components/PurchaseCounter";
import { TrustBadges } from "@/components/TrustBadges";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LiveViewers } from "@/components/LiveViewers";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductReviews } from "@/components/ProductReviews";

const features = [
  "5,000 palabras esenciales del inglés",
  "Pronunciación en español incluida",
  "Diseñado para hispanohablantes",
  "Sin necesidad de diccionarios",
  "Metodología paso a paso sin estrés",
  "Fonética UK y USA incluida",
  "Libro físico tapa blanda de alta calidad",
  "Entre 200 Paginas",
];

const benefits = [
  {
    icon: BookOpen,
    title: "Libro Físico Premium",
    description:
      "Tapa blanda de alta calidad, impresión profesional. Perfecto para estudiar sin pantallas y tomar notas.",
  },
  {
    icon: Truck,
    title: "Disponible en Amazon",
    description:
      "Compra directamente en Amazon con envío rápido a tu puerta. Disponible en múltiples países.",
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

const AMAZON_URL = "https://www.amazon.com/dp/B0GDTV8GWR";

const MEDIA_SLIDES = [
  { type: "image" as const, src: product5000BookImage, alt: "Inglés Relax - 5,000 Palabras Libro Físico" },
  { type: "video" as const, src: "/videos/product-5000-book.mp4", alt: "" },
  { type: "image" as const, src: product5000BookPerson, alt: "Persona con libro Inglés Relax" },
];

const Product5000Book = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const pixelParams = useMemo(() => ({
    content_name: "Inglés Relax - 5,000 Palabras Libro Físico",
    content_category: "Physical Book",
    content_ids: ["product-5000-book"],
    content_type: "product",
    value: 19.99,
    currency: "USD",
  }), []);
  useMetaPixelViewContent(pixelParams);

  useEffect(() => {
    const slide = MEDIA_SLIDES[currentSlide];
    if (slide.type === "video") {
      const vid = videoRef.current;
      if (vid) {
        vid.currentTime = 0;
        vid.play();
        const onEnded = () => setCurrentSlide((c) => (c + 1) % MEDIA_SLIDES.length);
        vid.addEventListener("ended", onEnded);
        return () => vid.removeEventListener("ended", onEnded);
      }
    }
    const timer = setTimeout(() => setCurrentSlide((c) => (c + 1) % MEDIA_SLIDES.length), 3500);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Libro Físico: 5,000 Palabras en Inglés con Pronunciación | Comprar en Amazon"
        description="Compra el libro físico de 5,000 palabras en inglés con pronunciación para hispanohablantes. Tapa blanda premium disponible en Amazon. Método iLingue Relax."
        canonicalUrl="https://ilinguerelax.com/products/5-000-palabras-libro-fisico"
        image="https://ilinguerelax.com/product-5000-book.png"
        type="product"
        price="19.99"
        rating="4.8"
        reviewCount="1247"
        sku="ILINGUE-5000-BOOK"
        keywords="libro físico inglés, 5000 palabras inglés, pronunciación inglés hispanohablantes, libro inglés impreso, Amazon"
        availability="InStock"
        isPhysical={true}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Media Carousel */}
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative overflow-hidden rounded-2xl shadow-hero">
                {MEDIA_SLIDES.map((slide, i) => (
                  <div
                    key={i}
                    className={`transition-opacity duration-700 ${i === currentSlide ? "opacity-100" : "opacity-0 absolute inset-0"}`}
                  >
                    {slide.type === "image" ? (
                      <img src={slide.src} alt={slide.alt} className="w-full h-auto" />
                    ) : (
                      <video
                        ref={videoRef}
                        src={slide.src}
                        muted
                        playsInline
                        className="w-full h-auto"
                      />
                    )}
                  </div>
                ))}
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {MEDIA_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? "bg-primary scale-125" : "bg-foreground/30"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Available Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 text-sm font-bold border border-green-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>✅ DISPONIBLE AHORA</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium"
                >
                  <Package className="w-4 h-4" />
                  <span>📦 Envío por Amazon</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 5,000 Palabras
                <br />
                <span className="text-primary">Libro Físico Tapa Blanda</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-4">
                El método más vendido para aprender inglés sin estrés, ahora en formato libro físico premium.
                Perfecto para estudiar sin pantallas.
              </p>

              {/* Reviews */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                </div>
                <span className="font-bold text-foreground">4.8/5</span>
                <span className="text-muted-foreground">(1,247+ Reseñas)</span>
              </div>

              {/* Purchase Counter */}
              <div className="mb-4">
                <PurchaseCounter baseCount={1247} lang="es" />
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={8} maxViewers={25} />
              </div>

              {/* Price Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20 mb-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-primary font-semibold text-sm uppercase">Disponible en Amazon</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$19.99</span>
                  <span className="text-primary font-bold">USD</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  📖 Libro físico tapa blanda • Envío por Amazon
                </p>
              </motion.div>

              {/* Buy Button */}
              <Button
                variant="hero"
                size="xl"
                className="w-full mb-4 text-lg py-6"
                asChild
              >
                <a href={AMAZON_URL} target="_blank" rel="noopener noreferrer">
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  COMPRAR AHORA EN AMAZON
                  <ExternalLink className="w-5 h-5 ml-2" />
                </a>
              </Button>

              {/* Trust Badges */}
              <TrustBadges lang="es" variant="grid" />

              {/* Amazon Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/30 mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Package className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">📖 Libro Físico Premium</p>
                  <p className="text-sm text-muted-foreground">Tapa blanda de alta calidad, 250-300 páginas. Disponible en Amazon con envío rápido.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¿Por qué elegir el{" "}
              <span className="text-primary">Libro Físico</span>?
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
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
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
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ProductReviews productType="english" />

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-primary">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              ¡Consigue tu libro físico ahora!
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8">
              Disponible en Amazon con envío rápido a tu puerta.
            </p>

            <div className="bg-card rounded-3xl shadow-hero p-8 mb-8">
              <div className="flex items-baseline justify-center gap-3 mb-4">
                <span className="text-5xl font-bold text-foreground">$19.99</span>
                <span className="text-primary font-bold">USD</span>
              </div>
              <p className="text-muted-foreground mb-6">
                Pago único • Envío por Amazon • Libro físico tapa blanda
              </p>
              <Button variant="hero" size="xl" className="w-full" asChild>
                <a href={AMAZON_URL} target="_blank" rel="noopener noreferrer">
                  COMPRAR AHORA EN AMAZON
                  <ExternalLink className="w-5 h-5 ml-2" />
                </a>
              </Button>
            </div>

            <p className="text-sm text-primary-foreground/70">
              🔒 Compra segura en Amazon • Garantía de satisfacción
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ
        items={[
          {
            question: "¿Quién es el autor del libro?",
            answer: "INGLÉS RELAX es una obra de iLingue Relax, una marca educativa enfocada en aprender inglés de forma simple, práctica y sin estrés.",
            icon: User,
          },
          {
            question: "¿Dónde puedo comprar el libro?",
            answer: "El libro está disponible directamente en Amazon. Haz clic en 'Comprar Ahora en Amazon' para ir a la página del producto.",
            icon: ShoppingCart,
          },
          {
            question: "¿Cuánto tarda el envío?",
            answer: "El envío es gestionado por Amazon. Los tiempos varían según tu ubicación, pero normalmente recibes tu libro en pocos días.",
            icon: Truck,
          },
          {
            question: "¿Qué incluye el libro físico?",
            answer: "El libro incluye 5,000 palabras esenciales en inglés con pronunciación adaptada para hispanohablantes y fonética UK/USA. Tapa blanda de alta calidad.",
            icon: BookOpen,
          },
          {
            question: "¿El libro viene con versión digital?",
            answer: "El libro físico se vende por separado. También puedes adquirir la versión digital (PDF) en nuestra tienda online.",
            icon: FileText,
          },
          {
            question: "¿Puedo comprar desde cualquier país?",
            answer: "Sí, Amazon realiza envíos internacionales. Consulta la disponibilidad y costos de envío en la página de Amazon para tu país.",
            icon: Shield,
          },
        ]}
      />

      <Footer />
      <StickyBuyBar
        productName="5,000 Palabras - Libro Físico"
        price="$19.99"
        ctaText="Comprar en Amazon"
        buyUrl={AMAZON_URL}
      />
      <SalesNotification />
      <ScrollToTop />
      <WhatsAppButton />
    </main>
  );
};

export default Product5000Book;
