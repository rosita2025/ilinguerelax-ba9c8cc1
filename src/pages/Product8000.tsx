import { prefetchCheckoutProduct } from "@/lib/checkoutProductCache";
import { useEffect, useMemo } from "react";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";

import SalesNotification from "@/components/SalesNotification";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Star,
  Check,
  BookOpen,
  Sparkles,
  ArrowRight,
  Gift,
  Download,
  RefreshCw,
  Brain,
  User,
  Smartphone,
  FileText,
  GraduationCap,
  Lightbulb,
  CreditCard,
  Zap,
  Shield,
  ShoppingCart,
  Loader2
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

// Product image
const product8000Image = "/images/product-8000.webp";
const product8000BookImg = "/images/product-8000-book.webp";

// Partner logos
import logoAmazon from "@/assets/logo-amazon.png";
import logoEtsy from "@/assets/logo-etsy.png";
import logoShopify from "@/assets/logo-shopify.png";
import logoHotmart from "@/assets/logo-hotmart.svg";
import logoKindle from "@/assets/logo-kindle.png";

// Conversion components
import { Product8000Preview } from "@/components/Product8000Preview";
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";
import { VideoTestimonial } from "@/components/VideoTestimonial";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LiveViewers } from "@/components/LiveViewers";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductReviews } from "@/components/ProductReviews";

// Bonus images (5 regalos - same as 5,000 page)
import bonus1Estructuras from "@/assets/bonus-1-estructuras-gramaticas.webp";
import bonus2Verbos from "@/assets/bonus-2-1000-verbos-esenciales.webp";
import bonus3Frases from "@/assets/bonus-3-100-frases-nativos.webp";
import bonus4Preguntas from "@/assets/bonus-4-500-preguntas-frecuentes.webp";
import bonus5Estudiar from "@/assets/bonus-5-como-estudiar-ingles-6-meses.webp";
import { PinterestSave } from "@/components/PinterestSave";

const bonuses8000 = [
  {
    title: "Regalo 1: Estructuras Gramáticas A1 a B1",
    description: "Guía completa de estructuras gramaticales del nivel A1 al B1 para construir frases con confianza desde el primer día.",
    image: bonus1Estructuras,
  },
  {
    title: "Regalo 2: 1,000 Verbos Esenciales (Presente, Pasado y Futuro)",
    description: "Los 1,000 verbos más usados en inglés conjugados en presente, pasado y futuro con pronunciación adaptada para hispanohablantes.",
    image: bonus2Verbos,
  },
  {
    title: "Regalo 3: 100 Frases Más Usadas por Nativos",
    description: "Las expresiones reales que usan los nativos todos los días para que hables como un local desde el principio.",
    image: bonus3Frases,
  },
  {
    title: "Regalo 4: 500 Preguntas Frecuentes en Inglés",
    description: "Las preguntas más comunes que necesitas dominar para conversaciones reales: trabajo, viajes y vida diaria.",
    image: bonus4Preguntas,
  },
  {
    title: "Regalo 5: Cómo Estudiar Inglés en 6 Meses",
    description: "Tu plan paso a paso para hablar inglés con confianza en solo 6 meses, sin perder tiempo ni motivación.",
    image: bonus5Estudiar,
  },
];

const partnerLogos = [
{ src: logoAmazon, alt: "Amazon", height: "h-10 md:h-14" },
{ src: logoEtsy, alt: "Etsy", height: "h-10 md:h-14" },
{ src: logoShopify, alt: "Shopify", height: "h-10 md:h-14" },
{ src: logoHotmart, alt: "Hotmart", height: "h-8 md:h-12" },
{ src: logoKindle, alt: "Amazon Kindle", height: "h-8 md:h-12" }];


const features = [
"8,000 palabras esenciales del inglés",
"Pronunciación en español incluida",
"Diseñado para hispanohablantes",
"Sin necesidad de diccionarios",
"Metodología paso a paso sin estrés",
"Fonética UK y USA incluida",
"Actualizaciones gratuitas de por vida",
"Soporte personalizado"];


const benefits = [
{
  icon: BookOpen,
  title: "Pronunciación en Español",
  description:
  "Cada palabra incluye su pronunciación adaptada al español para que aprendas correctamente desde el primer día."
},
{
  icon: BookOpen,
  title: "8,000 Palabras Esenciales",
  description:
  "El vocabulario más importante organizado por frecuencia de uso para máximo impacto en tu aprendizaje."
},
{
  icon: Sparkles,
  title: "Método Sin Estrés",
  description: "Aprende a tu propio ritmo con nuestra metodología relajada que respeta tu proceso de aprendizaje."
},
{
  icon: Brain,
  title: "Sin Diccionarios",
  description: "Todo lo que necesitas está incluido. Significados, pronunciación y ejemplos en un solo lugar."
}];


const ADMIN_SKU_8000 = "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa";
// Página digital → checkout con el SKU DIGITAL (antes apuntaba al libro físico).
const PRODUCT_SKU = ADMIN_SKU_8000;
const TIENDA_PATH_8000 = `/checkouts/${PRODUCT_SKU}`;
const HOTMART_8000_LATAM = "https://pay.hotmart.com/U103990323W?checkoutMode=10";

const Product8000 = () => {
  const { currency, countryCode } = useI18n();
  const pricing = useAdminPricing(ADMIN_SKU_8000);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const tier = useCountryTierRouting(ADMIN_SKU_8000, {
    tiendaPath: TIENDA_PATH_8000,
  });
  const { priceUsd, priceGlobalUsd, priceLatamUsd, priceTiendaUsd, pricePen } = tier;

  // Precarga el bundle del checkout + los datos del producto mientras el
  // visitante lee, para que "comprar" abra el checkout ya pintado.
  useEffect(() => {
    const prefetch = () => { import("@/pages/Checkout"); prefetchCheckoutProduct(ADMIN_SKU_8000); };
    const w = window as typeof window & { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(prefetch);
      return;
    }
    const timeoutId = window.setTimeout(prefetch, 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);


  // Meta Pixel ViewContent event - HOTMART PIXEL
  const pixelParams = useMemo(
    () => ({
      content_name: "Inglés Relax - 8,000 Palabras Digital",
      content_category: "Digital Book",
      content_ids: ["product-8000"],
      content_type: "product",
      value: priceUsd || 20,
      currency: "USD"
    }),
    [priceUsd]
  );
  useHotmartPixel(pixelParams);

  // Handle Buy Now — 4-tier routing (Perú/VE-CU-NI/Global → tienda interna · LATAM → Hotmart)
  const handleBuyNow = () => {
    trackHotmartEvent("AddToCart", {
      content_name: "Inglés Relax - 8,000 Palabras Digital",
      content_category: "Digital Book",
      content_ids: ["product-8000"],
      content_type: "product",
      value: priceUsd || 20,
      currency: "USD",
      num_items: 1
    });
    navigate(TIENDA_PATH_8000);
  };

  const handleAddToCart = async () => {
    navigate(TIENDA_PATH_8000);
  };


  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="8,000 Palabras en Inglés PDF Nivel Avanzado"
        description="8,000 palabras en inglés con pronunciación en español y fonética UK/USA. Nivel A1 a C1, sin diccionarios. PDF descargable al instante."
        canonicalUrl="https://ilinguerelax.com/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa"
        image="https://ilinguerelax.com/product-8000.webp"
        type="product"
        price="20"
        originalPrice="54"
        rating="4.9"
        reviewCount="892"
        sku="ILINGUE-8000"
        keywords="8000 palabras en inglés, vocabulario avanzado inglés, libro de inglés avanzado pdf, inglés nivel C1, aprender inglés fluido, inglés para hispanohablantes, pronunciación inglés adaptada al español, fonética UK USA, ebook inglés avanzado, descargar libro inglés" />
      
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
                  src={product8000Image}
                  alt="Inglés Relax - 8,000 Palabras"
                  className="w-full h-auto rounded-2xl shadow-hero" />
                <PinterestSave overlay />
                
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 text-sm font-bold border border-red-500/20">
                  
                  <Zap className="w-4 h-4" />
                  <span>🔥 PREMIUM</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
                  
                  <Gift className="w-4 h-4" />
                  <span>4 Bonus Gratis</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 8,000 Palabras con Pronunciación Español y Fonética UK/USA
              </h1>

              <p className="text-lg text-muted-foreground mb-4">
                El método completo para aprender inglés sin estrés, sin diccionarios, paso a paso. Diseñado
                exclusivamente para hispanohablantes.
              </p>

              {/* Reviews - More Prominent */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) =>
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  )}
                </div>
                <span className="font-bold text-foreground">4.9/5</span>
                <span className="text-muted-foreground">(20+ Estudiantes Satisfechos)</span>
              </div>

              {/* Purchase Counter - Social Proof */}
              <div className="mb-4">
                <PurchaseCounter baseCount={892} lang="es" />
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={12} maxViewers={35} />
              </div>

              {/* Price Section - More Impactful */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20 mb-6">
                
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-semibold text-sm uppercase">
                    Precio Especial Por Tiempo Limitado
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span className="text-5xl md:text-6xl font-black text-foreground">{tier.priceLabel}</span>
                  <span className="text-2xl text-muted-foreground line-through">{tier.originalLabel}</span>
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg">
                    
                    OFERTA
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">💳 Pago único • Sin suscripciones • Acceso de por vida</p>
              </motion.div>

              {/* Stock Counter - Scarcity */}
              <div className="mb-6">
                <StockCounter totalStock={50} remainingStock={8} lang="es" />
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="hero" size="xl" className="w-full text-lg py-6 shadow-2xl" onClick={handleBuyNow}>
                    <CreditCard className="w-6 h-6 mr-2" />
                    ¡COMPRAR AHORA! — {tier.priceLabel}
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline" 

                    size="xl" 
                    className="w-full text-lg py-6 border-2 border-primary/30 hover:bg-primary/5" 
                    onClick={handleAddToCart}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-6 h-6 mr-2" />
                    )}
                    Agregar al Carrito 🛒
                  </Button>
                </motion.div>
              </div>

              <p className="text-center text-sm text-muted-foreground mb-6 mt-4">
                👆 Haz clic para asegurar tu copia al precio de oferta
              </p>

              {/* Trust Badges */}

              {/* Money Back Guarantee - Enhanced */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-2 border-green-500/30 mt-6">
                
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

      {/* Partner Logos Ticker */}
      <section className="py-6">
        <div className="container px-4 md:px-6">
          <div className="overflow-hidden bg-gray-900 py-8 md:py-10 rounded-2xl">
            <div className="flex animate-ticker" style={{ width: "max-content" }}>
              {[...Array(4)].map((_, setIndex) =>
              <div key={setIndex} className="flex items-center shrink-0 gap-20 md:gap-32 px-10 md:px-16">
                  {partnerLogos.map((logo, index) =>
                <img
                  key={`${setIndex}-${index}`}
                  src={logo.src}
                  alt={logo.alt}
                  className={`${logo.height} w-auto object-contain shrink-0 brightness-0 invert opacity-90`} />

                )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 md:py-16 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¿Por qué elegir el <span className="text-gradient">Libro Digital Completo</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para dominar el inglés en un solo paquete
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit) =>
            <div
              key={benefit.title}
              className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-hero transition-all duration-500">
              
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What You Get Today - Value Stack */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                🎯 <span className="text-gradient">¿Qué recibes HOY por solo {tier.priceLabel}?</span>
              </h2>
              <p className="text-muted-foreground">Todo esto incluido en un solo pago</p>
            </div>
            
            <div className="bg-card rounded-2xl border-2 border-primary/30 shadow-hero p-6 md:p-8 space-y-4">
              {[
                { label: "📘 8,000 Palabras organizadas por temas y niveles (A1 → C1)", value: "$30" },
                { label: "🔊 Pronunciación adaptada al español para cada palabra", value: "$15" },
                { label: "🇬🇧🇺🇸 Fonética UK + USA (dos acentos en una sola palabra)", value: "$10" },
                { label: "📗 35 Estructuras Gramaticales (desde cero hasta avanzado)", value: "$20" },
                { label: "📝 Formulario de Repaso Gramatical", value: "$8" },
                { label: "💡 Ejemplos de Estructuras en Contexto", value: "$8" },
                { label: "❌ Errores Comunes de Hispanohablantes", value: "$5" },
                { label: "📒 Lista de Notas y Apuntes Personales", value: "$4" },
                { label: "🔄 Actualizaciones gratuitas de por vida", value: "∞" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-foreground text-sm md:text-base">{item.label}</span>
                  </div>
                  <span className="text-muted-foreground line-through text-sm flex-shrink-0">{item.value}</span>
                </div>
              ))}
              
              <div className="pt-4 border-t-2 border-primary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-muted-foreground">Valor total:</span>
                  <span className="text-xl font-bold text-muted-foreground line-through">$100+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-foreground">Hoy pagas solo:</span>
                  <span className="text-3xl font-black text-primary">{tier.priceLabel}</span>
                </div>
              </div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                <Button variant="hero" size="xl" className="w-full text-lg py-6 shadow-2xl" onClick={handleBuyNow}>
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  ¡SÍ, QUIERO MI COPIA AHORA!
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </motion.div>
              <p className="text-center text-xs text-muted-foreground">
                🔒 Pago seguro • Garantía 7 días • Acceso inmediato
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews carousel (moved above preview) */}
      <ProductReviews productType="english" />

      {/* Preview & Bonus Sections */}
      <Product8000Preview />

      {/* 5 Regalos GRATIS Section */}
      <section className="py-10 md:py-14 bg-gradient-to-b from-accent/5 to-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold mb-3">
                <Gift className="w-4 h-4" />
                INCLUIDOS GRATIS
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                5 Regalos Gratis Incluidos al Comprar Inglés Relax 8,000
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                Bonos exclusivos para acelerar tu aprendizaje desde el primer día.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/40 bg-accent/10 shadow-sm">
                <span className="text-[11px] md:text-xs font-semibold text-muted-foreground line-through tabular-nums">
                  $62 USD
                </span>
                <span className="text-[11px] md:text-xs font-black uppercase tracking-wide text-accent">
                  GRATIS hoy
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bonuses8000.map((bonus, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-xl border border-border shadow-card overflow-hidden group"
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

      {/* Final CTA */}
      <section className="py-20 md:py-28 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              ¿Listo para dominar el inglés sin estrés?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8">
              Únete a más de 10,000 estudiantes que ya están aprendiendo con iLingue Relax
            </p>

            <div className="bg-card rounded-3xl shadow-hero p-8 mb-8">
              <div className="flex items-baseline justify-center gap-3 mb-4 flex-wrap">
                <span className="text-5xl font-bold text-foreground">{tier.priceLabel}</span>
                <span className="text-2xl text-muted-foreground line-through">{tier.originalLabel}</span>
              </div>
              <p className="text-muted-foreground mb-6">Pago único • Sin suscripciones • Acceso de por vida</p>
              <Button variant="hero" size="xl" className="w-full" onClick={handleBuyNow}>
                OBTENER ACCESO AHORA
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-sm text-primary-foreground/70">
              🔒 Pago 100% seguro • Garantía de satisfacción de 7 días
            </p>
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
          icon: User
        },
        {
          question: "¿INGLÉS RELAX es un libro físico o digital?",
          answer:
          "Actualmente, INGLÉS RELAX es un producto digital disponible para compra inmediata. El libro puede descargarse y imprimirse en casa si el usuario lo desea. El libro físico (tapa blanda pegada) está previsto para junio de 2026. En algunas promociones futuras, el libro físico podrá incluir la versión digital (PDF) como bono.",
          icon: Smartphone
        },
        {
          question: "¿Cuántas páginas tiene INGLÉS RELAX?",
          answer:
          "El libro digital tiene entre 300 y 350 páginas de contenido práctico, organizado y fácil de estudiar.",
          icon: FileText
        },
        {
          question: "¿Es adecuado para estudiar solo/a?",
          answer: "Sí. INGLÉS RELAX está diseñado para autoestudio, para aprender a tu ritmo y sin presión.",
          icon: GraduationCap
        },
        {
          question: "¿Necesito saber inglés antes de usar el libro?",
          answer: "No. Puedes empezar desde cero, sin conocimientos previos de inglés.",
          icon: Lightbulb
        },
        {
          question: "¿El libro incluye pronunciación?",
          answer: "Sí. Todas las palabras incluyen pronunciación adaptada al español, pensada para hispanohablantes.",
          icon: BookOpen
        },
        {
          question: "¿Cómo realizo el pago?",
          answer:
          "Puedes pagar de forma segura mediante tarjeta de crédito o débito internacional (Stripe), Yape, Plin o transferencias según tu país.",
          icon: CreditCard
        }]
        }
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre INGLÉS RELAX" />

      {/* Physical Book Promo */}
      <section className="bg-gray-950 py-10 md:py-14">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto">
            {/* Bundle Image */}
            <img
              src="/images/promo-8000-bundle.webp"
              alt="Inglés Relax 8,000 Palabras - Libro Físico + Digital Gratis"
              className="w-full max-w-md rounded-2xl shadow-2xl" />
            
            <div className="text-center">
              <span className="inline-block bg-yellow-400 text-gray-950 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">🎁 Pack Promoción</span>
              <h3 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2">
                ¿Prefieres un libro físico?
              </h3>
              <p className="text-yellow-200 text-lg mb-1">
                📖 Compra el físico y recibe el digital <span className="font-black text-yellow-400">GRATIS</span> al instante
              </p>
              <p className="text-yellow-300/60 text-sm mb-4">
                Tapa blanda · Envío disponible · No incluye envío internacional
              </p>

              <div className="flex items-baseline gap-3 justify-center mb-5">
                <span className="text-4xl font-black text-yellow-400">$34.99 USD</span>
                <span className="text-lg text-yellow-300/50 line-through">$49.99</span>
              </div>

              <a
                href="/products/8-000-palabras-libro-fisico"
                className="inline-flex items-center gap-2 bg-[#FF9900] hover:bg-[#e88b00] text-gray-950 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                📦 Ver Libro Físico + Digital Gratis
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Sticky Buy Bar — 4-tier routing */}
      <StickyBuyBar
        price={tier.priceLabel}
        originalPrice={tier.originalLabel}
        currencyCode={tier.currencyCode}
        flag={tier.loaded ? (currency === "USD" ? "🇺🇸" : currency === "EUR" ? "🇪🇺" : currency === "GBP" ? "🇬🇧" : currency === "AUD" ? "🇦🇺" : currency === "CAD" ? "🇨🇦" : "🌎") : undefined}
        rating={4.9}
        reviewCount={10000}
        ctaText={"Comprar ahora"}
        onBuyClick={handleBuyNow}
        sku={PRODUCT_SKU}
        usdValue={tier.priceUsd}
        localUsdPrices={pricing.localUsdPrices}
      />
      

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification />




      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={500} />

      {/* WhatsApp Support Button */}
      <WhatsAppButton url="https://wa.link/48yzry" label="¿Dudas?" />
    </main>);

};

export default Product8000;