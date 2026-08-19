import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMetaPixelViewContent, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { ProductReviews } from "@/components/ProductReviews";
import { Navbar } from "@/components/Navbar";
import { StickyBuyBar } from "@/components/StickyBuyBar";

import { useCartStore } from "@/stores/cartStore";
import { fetchShopifyProducts } from "@/lib/shopify";
import { CountdownTimer } from "@/components/CountdownTimer";
import SalesNotification from "@/components/SalesNotification";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import beforeDictImg from "@/assets/diccionario-antes.webp";
import afterTopicsImg from "@/assets/temas-categorias-despues.webp";
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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Product images
const bookImages = [
  { src: "/images/8000-book-fisico-digital.webp", alt: "Libro Físico Inglés Relax + Digital Gratis" },
  { src: "/images/8000-book-cover.webp", alt: "Portada Inglés Relax 8,000 Palabras - Versión 1.5" },
  { src: "/images/8000-book-index.webp", alt: "Índice del libro - 89 capítulos organizados por nivel A1 a C1" },
  { src: "/images/8000-book-content.webp", alt: "Vocabulario con pronunciación adaptada y fonética UK/USA" },
  { src: "/images/8000-book-grammar.webp", alt: "Gramática con método fórmulas - paso a paso" },
  { src: "/images/8000-book-questions.webp", alt: "Preguntas en inglés con estructura TO BE - Nivel A1" },
  { src: "/images/8000-book-structures.webp", alt: "Estructuras gramaticales con ejemplos - Hábitos y negativas" },
];
// URL intermedia para tracking de clics en Google Analytics (redirige a Amazon)
const AMAZON_URL = "https://ilinguerelax.com/amazon";

// Conversion components
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { VideoTestimonial } from "@/components/VideoTestimonial";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LiveViewers } from "@/components/LiveViewers";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PinterestSave } from "@/components/PinterestSave";
const features = [
  "Más de 8,000 palabras y expresiones en inglés",
  "Pronunciación adaptada para hispanohablantes",
  "Estructuras gramaticales explicadas paso a paso",
  "Método tipo 'fórmulas' para aprender más fácil",
  "Contenido organizado por niveles A1 a C1",
  "Fonética UK y USA incluida",
  "Libro físico tapa blanda de alta calidad",
  "Traducción español-inglés incluida",
  "89 capítulos temáticos progresivos",
  "🎁 Incluye libro digital (PDF) GRATIS",
];

const benefits = [
  {
    icon: BookOpen,
    title: "Desde Nivel Cero hasta Avanzado",
    description:
      "Empieza desde cero (A1) y avanza hasta nivel avanzado (C1) en un solo libro. No necesitas conocimientos previos.",
  },
  {
    icon: Brain,
    title: "Método Fórmulas — Fácil de Entender",
    description:
      "Estructuras gramaticales explicadas como fórmulas simples. Sin complicaciones, aprende paso a paso.",
  },
  {
    icon: Sparkles,
    title: "Pronunciación para Hispanohablantes",
    description:
      "Cada palabra incluye pronunciación adaptada al español + fonética UK/USA. Habla inglés con confianza desde el primer día.",
  },
  {
    icon: Package,
    title: "Libro Físico + Digital GRATIS",
    description:
      "Recibe el libro impreso en tu puerta + la versión PDF digital gratis para empezar de inmediato mientras llega tu libro.",
  },
];

const Product8000Book = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const { isLoading: cartLoading } = useCartStore();
  const navigate = useNavigate();

  const PRODUCT_SKU = "8-000-palabras-libro-fisico";
  const handleAddToCart = async () => {
    navigate(`/checkouts/${PRODUCT_SKU}`);
  };

  const AMAZON_URL_8000 = "https://www.amazon.com/s?k=Ingl%C3%A9s+Relax+8000+Palabras";



  // Meta Pixel ViewContent event
  const pixelParams = useMemo(() => ({
    content_name: "Inglés Relax - 8,000 Palabras Libro Físico + Digital",
    content_category: "Physical Book Bundle",
    content_ids: ["product-8000-book"],
    content_type: "product",
    value: 34.99,
    currency: "USD",
  }), []);
  useMetaPixelViewContent(pixelParams);

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Libro Físico: 8,000 Palabras en Inglés Avanzado"
        description="Libro físico con 8,000 palabras en inglés y pronunciación en español. Nivel avanzado A1–C1, tapa blanda premium, envío mundial."
        canonicalUrl="https://ilinguerelax.com/products/8-000-palabras-libro-fisico"
        image="https://ilinguerelax.com/product-8000-book.webp"
        type="product"
        price="34.99"
        rating=""
        reviewCount=""
        sku="ILINGUE-8000-BOOK"
        keywords="libro de inglés avanzado, 8000 palabras en inglés libro, libro para aprender inglés fluido, libro de vocabulario en inglés, libro de inglés con pronunciación en español, libro de inglés tapa blanda, comprar libro de inglés, libro de inglés para hispanohablantes, iLingue Relax libro físico"
        availability="InStock"
        isPhysical={true}
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
                  src={bookImages[currentImage].src}
                  alt={bookImages[currentImage].alt}
                  className="w-full h-auto rounded-2xl shadow-hero aspect-square object-cover"
                />
                <PinterestSave overlay />
                {/* Thumbnail strip */}
                <div className="flex gap-2 mt-4 justify-center">
                  {bookImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImage === i ? "border-amber-500 ring-2 ring-amber-500/30" : "border-border opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 8,000 Palabras
                <br />
                <span className="text-amber-600">Libro Físico + Digital GRATIS</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-4">
                El libro <strong>Inglés Relax – 8,000 Palabras</strong> está diseñado para ayudarte a aprender inglés 
                desde nivel básico (A1) hasta avanzado (C1) de forma práctica y progresiva.
              </p>
              <p className="text-base text-muted-foreground mb-4">
                📘 Versión 1.5 — 104 capítulos temáticos, gramática con fórmulas, y pronunciación adaptada al español.
              </p>

              {/* Purchase Counter - Social Proof */}
              <div className="mb-4">
                <PurchaseCounter baseCount={245} lang="es" />
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={5} maxViewers={15} />
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
                  <span className="text-5xl md:text-6xl font-black text-foreground">$34.99</span>
                  <span className="text-lg text-muted-foreground line-through">$49.99</span>
                  <span className="text-primary font-bold">USD</span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  📖 Libro físico tapa blanda + 📱 Libro digital (PDF) gratis
                </p>

                {/* What's in the bundle */}
                <div className="flex flex-col gap-2 mt-3 p-3 rounded-xl bg-background/60">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">📖 Libro Físico Tapa Blanda — $34.99</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">📱 Libro Digital (PDF) — <span className="line-through text-muted-foreground">$20.00</span> <span className="text-accent font-bold">GRATIS</span></span>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Tarjeta 1 - Shopify (destacada) */}
                <div className="relative rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-5 shadow-lg flex flex-col">
                  <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                    ⭐ Recomendado
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-1 mt-1">
                    Comprar aquí (Shopify)
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-3">
                    MEJOR PRECIO + EBOOK GRATIS 🎁
                  </p>
                  <ul className="space-y-2 mb-4 flex-1">
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <BookOpen className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Libro físico</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <Gift className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Ebook PDF GRATIS</strong> (en 24h)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Envío: 13–15 días</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Pago seguro con tarjeta</span>
                    </li>
                  </ul>
                  <p className="text-xs italic text-emerald-700 dark:text-emerald-300 mb-3">
                    💚 Ahorra y recibe el ebook de regalo
                  </p>
                  <Button
                    size="lg"
                    className="w-full h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                  >
                    {cartLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="w-5 h-5 mr-2" />
                    )}
                    COMPRAR AHORA
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Tarjeta 2 - Envío internacional */}
                <div className="relative rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-5 shadow-md flex flex-col">
                  <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-amber-500 text-amber-950 text-[10px] font-black uppercase tracking-wider">
                    🚚 Envío rápido
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-amber-900 dark:text-amber-100 mb-1 mt-1">
                    Comprar ahora
                  </h3>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-3">
                    ENTREGA MÁS RÁPIDA 📦
                  </p>
                  <ul className="space-y-2 mb-4 flex-1">
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Libro físico</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <Truck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Envío internacional 7–15 días</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Pago seguro con tarjeta</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <Gift className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Ebook GRATIS enviando tu recibo a hola@ilinguerelax.com</span>
                    </li>
                  </ul>
                  <p className="text-xs italic text-amber-700 dark:text-amber-300 mb-3">
                    ⚡ Ideal si lo quieres lo antes posible
                  </p>
                  <Button
                    size="lg"
                    className="w-full h-14 rounded-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-base shadow-lg hover:shadow-xl transition-all"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Comprar ahora — Envío internacional
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Trust Badges & Shipping Info */}
              <div className="w-full mb-4 p-4 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/30">
                <div className="flex flex-col gap-2 text-center">
                  <p className="text-sm font-bold text-foreground flex items-center justify-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    Envío Internacional: $8.00 USD
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    📦 Dirección y país de entrega se solicitan al finalizar el pago.
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    🌍 Disponible para: 🇺🇸 USA · 🇨🇦 Canadá · 🇬🇧 Reino Unido · 🇦🇺 Australia · 🇳🇿 Nueva Zelanda
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    ✨ ENVÍO GRATIS EN PEDIDOS MAYORES A $50
                  </p>
                </div>
              </div>

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
        currentPrice="$34.99 USD"
        originalPrice="$45 USD"
        storageKey="countdown_book_physical"
      />

      {/* Benefits */}
      <section className="py-10 md:py-14 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-8">
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

      {/* ¿Para quién es? */}
      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              🎯 ¿Para quién es este libro?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "👉", title: "Empezar desde cero", desc: "Personas que no saben nada de inglés y quieren una guía clara." },
                { icon: "👉", title: "Avanzar rápido", desc: "Estudiantes que quieren pasar de básico a avanzado con un método organizado." },
                { icon: "👉", title: "Mejorar fluidez", desc: "Personas que desean mejorar su vocabulario, pronunciación y comprensión." },
              ].map((item) => (
                <div key={item.title} className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <span className="text-3xl mb-3 block">{item.icon}</span>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios reales */}
      <section className="py-8 md:py-12 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-6">
              🚀 Beneficios reales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Aprendes a comunicarte en situaciones reales",
                "Mejoras tu comprensión y vocabulario rápidamente",
                "Avanzas desde básico (A1) hasta avanzado (C1) en un solo libro",
                "Método fácil de entender — sin complicaciones",
                "No necesitas diccionarios ni apps adicionales",
                "Estudia sin pantallas, a tu propio ritmo",
              ].map((b) => (
                <div key={b} className="flex items-start gap-3 bg-card rounded-xl border border-border p-4">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <span className="text-foreground text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Book Preview Gallery */}
      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              📖 Mira el interior del libro
            </h2>
            <p className="text-muted-foreground mb-6">Contenido real del libro — vocabulario, gramática y pronunciación</p>
            {/* Before / After comparison */}
            <div className="max-w-2xl mx-auto mb-8">
              <p className="text-sm font-semibold text-primary mb-3">
                🔄 Diccionario tradicional vs. iLingue Relax — arrastra el control
              </p>
              <BeforeAfterSlider
                beforeSrc={beforeDictImg}
                afterSrc={afterTopicsImg}
                beforeAlt="Diccionario tradicional sin organización por temas"
                afterAlt="Temas por categorías con pronunciación y fonética UK/US"
                beforeLabel="DICCIONARIO"
                afterLabel="iLingue Relax"
              />
              <p className="text-xs text-muted-foreground text-center mt-3">
                👆 Arrastra el control central para ver la comparación antes/después
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookImages.slice(1).map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-card border border-border">
                  <img src={img.src} alt={img.alt} className="w-full h-auto" loading="lazy" />
                  <p className="text-xs text-muted-foreground p-3 bg-card">{img.alt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {/* What's Included - Checklist */}
      <section className="py-8 md:py-12 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-6">
              📚 ¿Qué incluye el libro?
            </h2>
            <div className="bg-card rounded-3xl border border-border shadow-card p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="py-10 md:py-14 bg-amber-500">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¡Consigue tu libro físico ahora!
            </h2>
            <p className="text-lg text-white/90 mb-6">
              Pack exclusivo: Libro Físico + Digital GRATIS por solo $34.99 USD.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
              {/* Tarjeta Shopify - Recomendado */}
              <div className="relative bg-card border-2 border-emerald-500 rounded-2xl shadow-card p-6 flex flex-col">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  ⭐ MEJOR PRECIO + BONUS
                </span>
                <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-2 mb-1">
                  Comprar aquí (Shopify) 🎁
                </h3>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-foreground">$34.99</span>
                  <span className="text-sm text-muted-foreground line-through">$49.99</span>
                </div>
                <ul className="space-y-2 text-sm text-foreground mb-4 flex-1">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Libro físico</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> <strong>Ebook PDF GRATIS</strong> (en 24h)</li>
                  <li className="flex items-start gap-2"><Truck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Envío: 13–15 días</li>
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Pago seguro con tarjeta</li>
                </ul>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mb-3">
                  💚 Ahorra y recibe el ebook de regalo
                </p>
                <Button
                  size="lg"
                  className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                >
                  {cartLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="w-5 h-5 mr-2" />
                  )}
                  COMPRAR AHORA
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Tarjeta - Envío internacional rápido */}
              <div className="relative bg-card border-2 border-amber-400 rounded-2xl shadow-card p-6 flex flex-col">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  🚚 ENVÍO RÁPIDO
                </span>
                <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-2 mb-1">
                  Comprar ahora
                </h3>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-foreground">$34.99</span>
                  <span className="text-sm text-muted-foreground">USD</span>
                </div>
                <ul className="space-y-2 text-sm text-foreground mb-4 flex-1">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /> Libro físico</li>
                  <li className="flex items-start gap-2"><Truck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /> <strong>Envío internacional 7–15 días</strong></li>
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /> Pago seguro con tarjeta</li>
                  <li className="flex items-start gap-2"><Gift className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /> Ebook GRATIS enviando recibo a hola@ilinguerelax.com</li>
                </ul>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold mb-3">
                  ⚡ Ideal si lo quieres lo antes posible
                </p>
                <Button
                  size="lg"
                  className="w-full h-14 rounded-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-base shadow-lg hover:shadow-xl transition-all"
                  onClick={handleAddToCart}
                >
                  <span className="inline-flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Comprar ahora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-white/80 mb-2">
              *Consulta costos de envío según tu ubicación
            </p>

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
            answer: "El libro físico está disponible para envío inmediato. Los tiempos de entrega dependen de tu ubicación. Recibirás actualizaciones por email sobre el estado de tu pedido.",
            icon: Truck,
          },
          {
            question: "¿Cuántas páginas tiene el libro?",
            answer: "El libro tiene entre 300 y 350 páginas de contenido práctico, organizado y fácil de estudiar.",
            icon: FileText,
          },
          {
            question: "¿Incluye la versión digital?",
            answer: "¡Sí! Al comprar el libro físico, recibes la versión digital (PDF) completamente GRATIS. Es un pack promocional: libro físico + digital por solo $34.99 USD.",
            icon: Package,
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

      {/* Sticky Buy Bar */}
      
      <StickyBuyBar
        price="$34.99"
        originalPrice="$49.99"
        productName="8,000 Words - Physical Book"
        ctaText="Comprar ahora"
        onBuyClick={handleAddToCart}
        isLoading={cartLoading}
        showReviews={true}
        rating={4.89}
        reviewCount={246}
        isPhysical={true}
        goesToInternalCheckout={true}
        sku="ILINGUE-8000-BOOK"
      />

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup - Disabled until product is available */}
      {/* <SalesNotification 
        productName="Libro Físico 8,000 Palabras" 
        productLabel="Libro Físico" 
      /> */}

      {/* Product Reviews */}
      <ProductReviews productType="english-book" />

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

      {/* WhatsApp Support Button */}
      <WhatsAppButton url="https://wa.link/zx3vwn" label="¿Dudas?" />
    </main>
  );
};

export default Product8000Book;
