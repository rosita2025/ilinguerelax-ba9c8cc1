import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Star,
  Check,
  Headphones,
  BookOpen,
  Sparkles,
  ArrowRight,
  Gift,
  Download,
  RefreshCw,
  Brain,
} from "lucide-react";

const features = [
  "8,000 palabras esenciales del inglés",
  "Audio con pronunciación nativa",
  "Diseñado para hispanohablantes",
  "Sin necesidad de diccionarios",
  "Metodología paso a paso sin estrés",
  "Fonética UK y USA incluida",
  "Actualizaciones gratuitas de por vida",
  "Soporte personalizado",
];

const benefits = [
  {
    icon: Headphones,
    title: "Pronunciación Perfecta",
    description:
      "Audio nativo diseñado especialmente para que hispanohablantes pronuncien correctamente desde el primer día.",
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
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative gradient-hero rounded-3xl p-8 shadow-hero">
                <div className="text-center text-primary-foreground">
                  <h2 className="text-4xl md:text-5xl font-bold mb-2">
                    8,000 PALABRAS
                  </h2>
                  <p className="text-xl mb-4">EL CURSO COMPLETO</p>
                  <div className="bg-card/90 rounded-2xl p-6 mb-4">
                    <p className="font-medium text-foreground mb-2">
                      Con audio nativo y pronunciación para hispanohablantes
                    </p>
                    <div className="flex justify-center gap-4 text-foreground">
                      <div className="flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-primary" />
                        <span className="text-sm">Audio HD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <span className="text-sm">PDF</span>
                      </div>
                    </div>
                  </div>
                  <div className="inline-block bg-accent text-accent-foreground px-4 py-2 rounded-xl font-bold">
                    MÁS VENDIDO
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Star className="w-4 h-4 fill-current" />
                <span>CURSO MÁS COMPLETO</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 8,000 Palabras con Audio Nativo
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
                <span className="text-5xl font-bold text-foreground">$47</span>
                <span className="text-2xl text-muted-foreground line-through">
                  $197
                </span>
                <span className="px-3 py-1 rounded-full gradient-accent text-accent-foreground text-sm font-bold">
                  AHORRA 76%
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
                🔒 Pago 100% seguro • Garantía de 30 días • Acceso de por vida
              </p>
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
              <span className="text-gradient">Curso Completo</span>?
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
                <span className="text-5xl font-bold text-foreground">$47</span>
                <span className="text-2xl text-muted-foreground line-through">
                  $197
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
              🔒 Pago 100% seguro • Garantía de satisfacción de 30 días
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Product8000;
