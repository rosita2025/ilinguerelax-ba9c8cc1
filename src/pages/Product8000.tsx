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
import { ProductCrossSell } from "@/components/ProductCrossSell";
import { PinterestSave } from "@/components/PinterestSave";

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
  "Cada palabra con su pronunciación en español."
},
{
  icon: BookOpen,
  title: "8,000 Palabras Esenciales",
  description:
  "El vocabulario más usado, ordenado por temas."
},
{
  icon: Sparkles,
  title: "Método Sin Estrés",
  description: "Aprende a tu ritmo, sin presión."
},
{
  icon: Brain,
  title: "Sin Diccionarios",
  description: "Significado, pronunciación y ejemplos en un solo lugar."
}];


const ADMIN_SKU_8000 = "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa";
// Página digital → checkout con el SKU DIGITAL (antes apuntaba al libro físico).
const PRODUCT_SKU = ADMIN_SKU_8000;
const TIENDA_PATH_8000 = `/checkouts/${PRODUCT_SKU}`;
const HOTMART_8000_LATAM = "https://pay.hotmart.com/U103990323W?checkoutMode=10";

const Product8000 = () => {
  const { currency, countryCode } = useI18n();
  const pricing = useAdminPricing(ADMIN_SKU_8000);
  const heroImage = pricing.coverImageUrl ?? (pricing.loaded ? product8000Image : null);
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
                {heroImage ? (
                <img
                  src={heroImage}
                  alt="Inglés Relax - 8,000 Palabras"
                  width={1000}
                  height={1250}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="w-full h-auto rounded-2xl shadow-hero" />
                ) : (
                  <div className="w-full aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
                )}
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

              <p className="text-lg font-semibold text-foreground mb-1">
                Aprende inglés sin estrés, sin diccionarios y paso a paso.
              </p>
              <p className="text-base text-muted-foreground mb-4">
                8,000 palabras con pronunciación en español + 4 bonos GRATIS.
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

      {/* Subhero */}
      <section className="py-6 md:py-8 bg-primary/5 border-y border-primary/10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
              Un solo pago. <span className="text-gradient">Libro + 4 bonos GRATIS.</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
              {[
                { t: "8,000 palabras", d: "Por temas, de A1 a C1" },
                { t: "Pronunciación", d: "En español + UK y USA" },
                { t: "35 estructuras", d: "Gramática desde cero" },
                { t: "4 bonos GRATIS", d: "Repaso, ejemplos, errores y notas" },
              ].map((x) => (
                <div key={x.t} className="rounded-xl border border-border bg-card p-3 shadow-card">
                  <p className="text-sm font-extrabold text-foreground flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" />{x.t}</p>
                  <p className="text-xs text-muted-foreground mt-1">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dolores */}
      <section className="py-10 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-6">
              ¿Te pasa esto con el <span className="text-gradient">inglés</span>?
            </h2>
            <div className="space-y-3">
              {[
                "Aprendes palabras sueltas y no sabes cómo se pronuncian.",
                "Vives con el diccionario abierto y avanzas muy lento.",
                "No sabes por dónde empezar ni qué vocabulario es el importante.",
                "Te da vergüenza hablar por miedo a pronunciar mal.",
              ].map((x) => (
                <div key={x} className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <span className="text-lg leading-none mt-0.5">❌</span>
                  <p className="text-foreground text-sm md:text-base">{x}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-foreground font-bold text-lg mt-6">
              Con las <span className="text-gradient">8,000 palabras correctas</span> y su pronunciación, todo se vuelve fácil.
            </p>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-10 md:py-12 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-8">
            Lo que vas a <span className="text-gradient">lograr</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-card rounded-2xl border border-border shadow-card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="hero" size="xl" onClick={handleBuyNow} className="w-full sm:w-auto px-6 py-5 shadow-2xl">
              <ShoppingCart className="w-5 h-5 mr-2" />
              ¡LO QUIERO! — {tier.priceLabel}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <ProductReviews productType="english" />

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

      {/* Presentación: vista previa + bonos */}
      <Product8000Preview />

      <ProductCrossSell currentProduct="8000" lang="es" />

      {/* Final CTA */}
      <section className="py-20 md:py-28 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              ¿Listo para dominar el inglés sin estrés?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8">
              Empieza hoy con el libro y los 4 bonos GRATIS
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
        { question: "¿Qué recibo al comprar?", answer: "El libro digital de 8,000 palabras con pronunciación en español y fonética UK/USA, más 4 bonos GRATIS: repaso gramatical, ejemplos, errores comunes y notas.", icon: BookOpen },
        { question: "¿Es digital o físico?", answer: "Es 100% digital (PDF). Lo recibes por correo apenas pagas y puedes leerlo en celular, tablet o computadora, o imprimirlo.", icon: Smartphone },
        { question: "¿Cuántas páginas tiene?", answer: "Entre 300 y 350 páginas de contenido práctico y fácil de estudiar.", icon: FileText },
        { question: "¿Sirve si empiezo desde cero?", answer: "Sí. No necesitas saber inglés antes. Está hecho para estudiar solo y a tu ritmo.", icon: GraduationCap },
        { question: "¿Incluye pronunciación?", answer: "Sí. Todas las palabras traen pronunciación adaptada al español.", icon: Lightbulb },
        { question: "¿Cómo pago y qué garantía tengo?", answer: "Eliges tu método en el checkout seguro, según tu país. Tienes garantía de 7 días.", icon: CreditCard }]
        }
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre INGLÉS RELAX" />


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