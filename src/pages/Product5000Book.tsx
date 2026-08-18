import { useMemo, useState, useEffect, useRef } from "react";
import { useMetaPixelViewContent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { PhysicalBookCheckout } from "@/components/PhysicalBookCheckout";
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
  Loader2,
} from "lucide-react";

const product5000BookImage = "/images/product-5000-book.webp";
const product5000BookPerson = "/images/product-5000-book.webp";

import { PurchaseCounter } from "@/components/PurchaseCounter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LiveViewers } from "@/components/LiveViewers";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductReviews } from "@/components/ProductReviews";
import { useCartStore } from "@/stores/cartStore";
import { fetchShopifyProducts } from "@/lib/shopify";
import { toast } from "sonner";
import { PinterestSave } from "@/components/PinterestSave";

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
    title: "Envío internacional",
    description:
      "Compra directa con pago seguro y envío a USA, Canadá, UK, Australia y Nueva Zelanda.",
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
  { type: "image" as const, src: product5000BookPerson, alt: "Persona con libro Inglés Relax" },
  { type: "image" as const, src: "/images/product-5000-book-hero.webp", alt: "Inglés Relax 5,000 Palabras - Libro Físico y Digital" },
  { type: "video" as const, src: "/videos/product-5000-book.mp4", alt: "" },
];

const Product5000Book = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shopifyVariantId, setShopifyVariantId] = useState<string | null>(null);
  const [shopifyProduct, setShopifyProduct] = useState<any>(null);
  const { addItem, isLoading: cartLoading } = useCartStore();

  // Fetch Shopify product variant for the physical book
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const products = await fetchShopifyProducts(10, "LIBRO FISICO 5,000");
        const book = products.find(p => 
          p.node.title.toLowerCase().includes("libro fisico") && 
          (p.node.title.toLowerCase().includes("5000") || p.node.title.toLowerCase().includes("5,000"))
        );
        if (book) {
          setShopifyProduct(book);
          const variant = book.node.variants.edges[0]?.node;
          if (variant) setShopifyVariantId(variant.id);
        }
      } catch (err) {
        console.error("Failed to load Shopify product:", err);
      }
    };
    loadProduct();
  }, []);

  const [physicalCheckoutOpen, setPhysicalCheckoutOpen] = useState(false);
  const handleAddToCart = async () => {
    setPhysicalCheckoutOpen(true);
  };

  const pixelParams = useMemo(() => ({
    content_name: "Inglés Relax - 5,000 Palabras Libro Físico + Digital",
    content_category: "Physical Book Bundle",
    content_ids: ["product-5000-book"],
    content_type: "product",
    value: 24.00,
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
        title="Libro Físico: 5,000 Palabras en Inglés"
        description="Libro físico con 5,000 palabras en inglés y pronunciación en español. Tapa blanda premium, envío mundial. Método iLingue Relax."
        canonicalUrl="https://ilinguerelax.com/products/5-000-palabras-libro-fisico"
        image="https://ilinguerelax.com/images/product-5000-book.webp"
        type="product"
        price="24.00"
        rating=""
        reviewCount=""
        sku="ILINGUE-5000-BOOK"
        keywords="libro de inglés físico, libro para aprender inglés, 5000 palabras en inglés libro, libro de vocabulario en inglés, libro de inglés con pronunciación en español, mejor libro para aprender inglés, libro de inglés para hispanohablantes, libro de inglés tapa blanda, iLingue Relax libro"
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
                <PinterestSave overlay />
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
                  <span>📦 Envío internacional</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 5,000 Palabras
                <br />
                <span className="text-primary">Libro Físico + Digital GRATIS</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-4">
                El método más vendido para aprender inglés sin estrés, ahora en formato libro físico premium.
                Perfecto para estudiar sin pantallas.
              </p>

              {/* Reviews */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-muted-foreground/30" />)}
                </div>
                <span className="text-muted-foreground">(0 Reseñas)</span>
              </div>

              {/* Purchase Counter */}
              <div className="mb-4">
                <PurchaseCounter baseCount={1247} lang="es" />
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={8} maxViewers={25} />
              </div>

              {/* Bundle Price Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative overflow-hidden rounded-2xl p-6 border-2 border-accent mb-6"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.18))" }}
              >
                {/* Bundle Badge */}
                <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl bg-accent text-accent-foreground text-xs font-black uppercase tracking-wider">
                  🎁 Pack Promoción
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-accent" />
                  <span className="text-accent font-bold text-sm uppercase">Libro Físico + Digital Incluido</span>
                </div>

                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$24.00</span>
                  <span className="text-lg text-muted-foreground line-through">$31.99</span>
                  <span className="text-primary font-bold">USD</span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  📖 Libro físico tapa blanda + 📱 Libro digital (PDF) gratis
                </p>

                {/* What's in the bundle */}
                <div className="flex flex-col gap-2 mt-3 p-3 rounded-xl bg-background/60">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">📖 Libro Físico Tapa Blanda — $24.00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">📱 Libro Digital (PDF) — <span className="line-through text-muted-foreground">$12.00</span> <span className="text-accent font-bold">GRATIS</span></span>
                  </div>
                </div>
              </motion.div>

              {/* Add to Cart Button - Primary */}
              <Button
                variant="hero"
                size="xl"
                className="w-full mb-3 text-lg py-6"
                onClick={handleAddToCart}
                disabled={cartLoading}
              >
                {cartLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-6 h-6 mr-2" />
                )}
                COMPRAR AHORA
              </Button>

              <div className="w-full mb-4 p-4 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/30">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-bold text-foreground flex items-center justify-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    Envío Internacional: $8.00 USD
                  </p>
                  <p className="text-[11px] text-muted-foreground text-center">
                    📦 Dirección y país de entrega se solicitan al finalizar el pago.
                  </p>
                  <p className="text-[11px] text-muted-foreground text-center">
                    ✈️ Disponible para: 🇺🇸 USA · 🇨🇦 Canadá · 🇬🇧 Reino Unido · 🇦🇺 Australia · 🇳🇿 Nueva Zelanda
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold text-center uppercase tracking-wider">
                    ✨ ENVÍO GRATIS en pedidos mayores a $50
                  </p>
                </div>
              </div>

              {/* Trust Badges */}

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
                  <p className="text-sm text-muted-foreground">Tapa blanda de alta calidad, 250-300 páginas. Envío internacional rápido.</p>
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

      {/* Video de detalles */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <video
              src="/videos/product-5000-book-details.mp4"
              controls
              playsInline
              className="w-full h-auto rounded-2xl shadow-hero"
            />
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

      {/* Reviews - disabled until physical book has reviews */}

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-primary">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              ¡Consigue tu libro físico ahora!
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8">
              Envío internacional a USA, Canadá, UK, Australia y Nueva Zelanda.
            </p>

            <div className="bg-card rounded-3xl shadow-hero p-8 mb-8">
                <div className="flex items-baseline justify-center gap-3 mb-2">
                  <span className="text-5xl font-bold text-foreground">$24.00</span>
                  <span className="text-lg text-muted-foreground line-through">$31.99</span>
                  <span className="text-primary font-bold">USD</span>
                </div>
                <p className="text-accent font-bold text-sm mb-1">🎁 PACK: Libro Físico + Digital GRATIS</p>
                <p className="text-muted-foreground mb-6">
                  Pago único • Envío internacional • Incluye PDF digital
                </p>
              <Button variant="hero" size="xl" className="w-full" onClick={handleAddToCart} disabled={cartLoading}>
                COMPRAR AHORA
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-primary-foreground/70">
              🔒 Compra segura con tarjeta • Garantía de satisfacción
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
            answer: "Haz clic en 'Comprar ahora' y completa el pago seguro con tarjeta. El libro se envía a tu dirección.",
            icon: ShoppingCart,
          },
          {
            question: "¿Cuánto tarda el envío?",
            answer: "El envío internacional tarda entre 7 y 15 días hábiles según tu país.",
            icon: Truck,
          },
          {
            question: "¿Qué incluye el libro físico?",
            answer: "El libro incluye 5,000 palabras esenciales en inglés con pronunciación adaptada para hispanohablantes y fonética UK/USA. Tapa blanda de alta calidad.",
            icon: BookOpen,
          },
          {
            question: "¿El libro viene con versión digital?",
            answer: "¡Sí! Al comprar el libro físico, recibes la versión digital (PDF) completamente GRATIS. Es un pack promocional: libro físico + digital por solo $24.00 USD.",
            icon: FileText,
          },
          {
            question: "¿Puedo comprar desde cualquier país?",
            answer: "Enviamos a USA, Canadá, Reino Unido, Australia y Nueva Zelanda. Envío estándar $8 (gratis en pedidos de $50+).",
            icon: Shield,
          },
        ]}
      />

      <Footer />
      <PhysicalBookCheckout open={physicalCheckoutOpen} onOpenChange={setPhysicalCheckoutOpen} book="english_5000" title="5,000 Palabras — Libro Físico · Pago seguro" />
      <StickyBuyBar
        productName="5,000 Palabras - Libro Físico"
        price="$24.00"
        ctaText="Comprar ahora"
        onBuyClick={handleAddToCart}
        isLoading={cartLoading}
        showReviews={false}
        isPhysical={true}
      />
      <SalesNotification />
      <ScrollToTop />
      <WhatsAppButton url="https://wa.link/iw9rv4" label="¿Dudas?" />
    </main>
  );
};

export default Product5000Book;
