import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import { StickyBuyBar } from "@/components/StickyBuyBar";
import { CountdownTimer } from "@/components/CountdownTimer";
import SalesNotification from "@/components/SalesNotification";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

// Product image
import product8000Image from "@/assets/product-8000.png";

// Partner logos
import logoAmazon from "@/assets/logo-amazon.png";
import logoEtsy from "@/assets/logo-etsy.png";
import logoShopify from "@/assets/logo-shopify.png";
import logoHotmart from "@/assets/logo-hotmart.svg";
import logoKindle from "@/assets/logo-kindle.png";

const partnerLogos = [
  { src: logoAmazon, alt: "Amazon", height: "h-10 md:h-14" },
  { src: logoEtsy, alt: "Etsy", height: "h-10 md:h-14" },
  { src: logoShopify, alt: "Shopify", height: "h-10 md:h-14" },
  { src: logoHotmart, alt: "Hotmart", height: "h-8 md:h-12" },
  { src: logoKindle, alt: "Amazon Kindle", height: "h-8 md:h-12" },
];

const features = [
  "8,000 palabras esenciales del inglés",
  "Pronunciación en español incluida",
  "Diseñado para hispanohablantes",
  "Sin necesidad de diccionarios",
  "Metodología paso a paso sin estrés",
  "Fonética UK y USA incluida",
  "Actualizaciones gratuitas de por vida",
  "Soporte personalizado",
];

const benefits = [
  {
    icon: BookOpen,
    title: "Pronunciación en Español",
    description:
      "Cada palabra incluye su pronunciación adaptada al español para que aprendas correctamente desde el primer día.",
  },
  {
    icon: BookOpen,
    title: "8,000 Palabras Esenciales",
    description:
      "El vocabulario más importante organizado por frecuencia de uso para máximo impacto en tu aprendizaje.",
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

const Product8000 = () => {
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="8,000 Palabras en Inglés con Pronunciación Español y Fonética UK/USA"
        description="Domina 8,000 palabras en inglés con pronunciación adaptada para hispanohablantes. Método sin estrés, sin diccionarios, paso a paso. Fonética UK/USA incluida."
        canonicalUrl="https://ilinguerelax.com/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa"
        type="product"
        price="24"
        rating="4.9"
        reviewCount="10000"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative">
                <img
                  src={product8000Image}
                  alt="Inglés Relax - 8,000 Palabras"
                  className="w-full h-auto rounded-2xl shadow-hero"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Star className="w-4 h-4 fill-current" />
                <span>Incluye 4 Bonus</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 8,000 Palabras con Pronunciación Español y Fonética UK/USA
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                El método completo para aprender inglés sin estrés, sin
                diccionarios, paso a paso. Diseñado exclusivamente para
                hispanohablantes.
              </p>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-accent text-accent"
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">4.9/5 (10,000+ estudiantes)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-5xl font-bold text-foreground">$24</span>
                <span className="text-2xl text-muted-foreground line-through">
                  $76
                </span>
                <span className="px-3 py-1 rounded-full gradient-accent text-accent-foreground text-sm font-bold">
                  AHORRA 86%
                </span>
              </div>

              {/* Delivery Info */}
              <div className="flex flex-wrap gap-4 mb-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  <span>Descarga inmediata</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <span>Actualizaciones gratis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  <span>Bonus incluidos</span>
                </div>
              </div>

              {/* CTA */}
              <Button variant="hero" size="xl" className="w-full md:w-auto mb-4">
                OBTENER ACCESO AHORA
                <ArrowRight className="w-5 h-5" />
              </Button>

              <p className="text-sm text-muted-foreground">
                🔒 Pago 100% seguro • Garantía de 7 días • Acceso de por vida
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <CountdownTimer hoursFromNow={24} />

      {/* Partner Logos Ticker */}
      <section className="py-6">
        <div className="container px-4 md:px-6">
          <div className="overflow-hidden bg-gray-900 py-8 md:py-10 rounded-2xl">
            <div className="flex animate-ticker" style={{ width: 'max-content' }}>
              {[...Array(4)].map((_, setIndex) => (
                <div key={setIndex} className="flex items-center shrink-0 gap-20 md:gap-32 px-10 md:px-16">
                  {partnerLogos.map((logo, index) => (
                    <img
                      key={`${setIndex}-${index}`}
                      src={logo.src}
                      alt={logo.alt}
                      className={`${logo.height} w-auto object-contain shrink-0 brightness-0 invert opacity-90`}
                    />
                  ))}
                </div>
              ))}
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
              <span className="text-gradient">Libro Digital Completo</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para dominar el inglés en un solo paquete
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-hero transition-all duration-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
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
                    <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center flex-shrink-0 mt-0.5">
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


      {/* Final CTA */}
      <section className="py-20 md:py-28 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              ¿Listo para dominar el inglés sin estrés?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8">
              Únete a más de 10,000 estudiantes que ya están aprendiendo con
              iLingue Relax
            </p>

            <div className="bg-card rounded-3xl shadow-hero p-8 mb-8">
              <div className="flex items-baseline justify-center gap-3 mb-4">
                <span className="text-5xl font-bold text-foreground">$24</span>
                <span className="text-2xl text-muted-foreground line-through">
                  $76
                </span>
                <span className="text-accent font-bold">USD</span>
              </div>
              <p className="text-muted-foreground mb-6">
                Pago único • Sin suscripciones • Acceso de por vida
              </p>
              <Button variant="hero" size="xl" className="w-full">
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
            answer: "INGLÉS RELAX es una obra de iLingue Relax, una marca educativa enfocada en aprender inglés de forma simple, práctica y sin estrés.",
            icon: User,
          },
          {
            question: "¿INGLÉS RELAX es un libro físico o digital?",
            answer: "Actualmente, INGLÉS RELAX es un producto digital disponible para compra inmediata. El libro puede descargarse y imprimirse en casa si el usuario lo desea. El libro físico (tapa blanda pegada) está previsto para junio de 2026. En algunas promociones futuras, el libro físico podrá incluir la versión digital (PDF) como bono.",
            icon: Smartphone,
          },
          {
            question: "¿Cuántas páginas tiene INGLÉS RELAX?",
            answer: "El libro digital tiene entre 300 y 350 páginas de contenido práctico, organizado y fácil de estudiar.",
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
            answer: "Puedes pagar de forma segura mediante: Tarjeta de crédito o débito internacional (Stripe) o Hotmart, donde puedes elegir distintos métodos de pago, incluyendo transferencias según tu país.",
            icon: CreditCard,
          },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre INGLÉS RELAX"
      />

      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar
        price="$24"
        originalPrice="$76"
        rating={4.9}
        reviewCount={10000}
        buyUrl="https://pay.hotmart.com/O100578526P?checkoutMode=10"
      />

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification 
        productName="8,000 Palabras en Inglés" 
        productLabel="8,000" 
      />
    </main>
  );
};

export default Product8000;
