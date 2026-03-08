import { useMemo } from "react";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";

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
  ShoppingCart } from
"lucide-react";

// Product image
import product8000Image from "@/assets/product-8000.png";
import product8000BookImg from "@/assets/product-8000-book.png";

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
import { TrustBadges } from "@/components/TrustBadges";
import { VideoTestimonial } from "@/components/VideoTestimonial";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LiveViewers } from "@/components/LiveViewers";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductReviews } from "@/components/ProductReviews";

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


const Product8000 = () => {
  // Meta Pixel ViewContent event - HOTMART PIXEL
  const pixelParams = useMemo(
    () => ({
      content_name: "Inglés Relax - 8,000 Palabras Digital",
      content_category: "Digital Book",
      content_ids: ["product-8000"],
      content_type: "product",
      value: 17,
      currency: "USD"
    }),
    []
  );
  useHotmartPixel(pixelParams);

  // Handle Buy Now with Hotmart pixel tracking
  const handleBuyNow = () => {
    trackHotmartEvent("InitiateCheckout", {
      content_name: "Inglés Relax - 8,000 Palabras Digital",
      content_category: "Digital Book",
      content_ids: ["product-8000"],
      content_type: "product",
      value: 17,
      currency: "USD",
      num_items: 1
    });
    window.open("https://pay.hotmart.com/U103990323W?checkoutMode=10", "_blank");
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="8,000 Palabras en Inglés con Pronunciación Español y Fonética UK/USA"
        description="Domina 8,000 palabras en inglés con pronunciación adaptada para hispanohablantes. Método sin estrés, sin diccionarios, paso a paso. Fonética UK/USA incluida."
        canonicalUrl="https://ilinguerelax.com/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa"
        image="https://ilinguerelax.com/product-8000.png"
        type="product"
        price="17"
        originalPrice="54"
        rating="4.9"
        reviewCount="892"
        sku="ILINGUE-8000"
        keywords="aprender inglés, vocabulario inglés 8000 palabras, pronunciación inglés hispanohablantes, libro digital inglés avanzado" />
      
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
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$20</span>
                  <span className="text-2xl text-muted-foreground line-through">$54</span>
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg">
                    
                    AHORRA 63%
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">💳 Pago único • Sin suscripciones • Acceso de por vida</p>
              </motion.div>

              {/* Stock Counter - Scarcity */}
              <div className="mb-6">
                <StockCounter totalStock={50} remainingStock={8} lang="es" />
              </div>

              {/* CTA Button - More Impactful */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="hero" size="xl" className="w-full mb-4 text-lg py-6 shadow-2xl" onClick={handleBuyNow}>
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  ¡OBTENER ACCESO AHORA!
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </motion.div>

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

      {/* What's Included */}
      


















      

      {/* Preview & Bonus Sections */}
      <Product8000Preview />

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
              <div className="flex items-baseline justify-center gap-3 mb-4">
                <span className="text-5xl font-bold text-foreground">$20</span>
                <span className="text-2xl text-muted-foreground line-through">$54</span>
                <span className="text-accent font-bold">USD</span>
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
          "Puedes pagar de forma segura mediante: Tarjeta de crédito o débito internacional (Stripe) o Hotmart, donde puedes elegir distintos métodos de pago, incluyendo transferencias según tu país.",
          icon: CreditCard
        }]
        }
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre INGLÉS RELAX" />
      

      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar
        price="$20"
        originalPrice="$54"
        rating={4.9}
        reviewCount={10000}
        buyUrl="https://pay.hotmart.com/U103990323W?checkoutMode=10" />
      

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification productName="8,000 Palabras en Inglés" productLabel="8,000" />

      {/* Video Testimonial */}
      <VideoTestimonial
        videoUrl="https://youtu.be/bG35t0x3GkU"
        customerName="Cliente Verificado"
        customerLocation="Latinoamérica"
        testimonialQuote="Este libro cambió completamente mi forma de aprender inglés. La pronunciación adaptada al español hace que sea muy fácil de entender. ¡100% recomendado!"
        lang="es"
        showProductSelector={true} />
      

      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={500} />

      {/* WhatsApp Support Button */}
      <WhatsAppButton />
    </main>);

};

export default Product8000;