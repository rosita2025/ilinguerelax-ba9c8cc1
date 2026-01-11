import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Testimonials } from "@/components/Testimonials";
import { Button } from "@/components/ui/button";
import {
  Star,
  Check,
  BookOpen,
  Globe,
  Headphones,
  ArrowRight,
  ShoppingCart,
  Clock,
  Gift,
  Download,
  RefreshCw,
} from "lucide-react";

const features = [
  "5,000+ palabras más utilizadas en inglés",
  "Pronunciación adaptada para hispanohablantes",
  "Fonética internacional UK/USA incluida",
  "Nivel básico a intermedio",
  "52 capítulos temáticos organizados",
  "Significado en español de cada palabra",
  "Entrega digital inmediata",
  "Acceso de por vida",
];

const bonuses = [
  {
    icon: BookOpen,
    title: "Bonus 1: Estructura de Frases",
    description:
      "Aprende la fórmula completa: Sujeto + Verbo + Artículo + Objeto + Preposición + Lugar. Incluye ejemplos y pronunciación.",
  },
  {
    icon: Globe,
    title: "Bonus 2: Diccionario Alfabético",
    description:
      "5,000 palabras organizadas alfabéticamente con pronunciación adaptada. Ideal para consultas rápidas.",
  },
  {
    icon: Headphones,
    title: "Bonus 3: Verbo To Be y Más",
    description:
      "Tablas prácticas del verbo To Be, artículos (a/an/the) y preposiciones (in/on/at) con ejemplos.",
  },
  {
    icon: RefreshCw,
    title: "Bonus 4: Actualizaciones Gratis",
    description:
      "Acceso de por vida al contenido con todas las actualizaciones futuras y nuevas versiones sin costo adicional.",
  },
];

const chapters = [
  "Casa y Hogar",
  "Comidas y Bebidas",
  "Transportes",
  "Profesiones",
  "Lugares",
  "Países y Ciudades",
  "Ambiente y Naturaleza",
  "Tecnología",
  "Universidad",
  "Vida Cotidiana",
  "Trabajo",
  "Viajes",
  "Emociones",
  "Deportes",
  "Expresiones Comunes",
  "Y mucho más...",
];

const Product5000 = () => {
  const handleBuy = () => {
    window.open(
      "https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067&fromExitPopup=true",
      "_blank"
    );
  };

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
              <div className="relative bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-8 shadow-hero">
                <div className="text-center text-foreground">
                  <h2 className="text-4xl md:text-5xl font-bold mb-2">
                    5,000 PALABRAS
                  </h2>
                  <p className="text-xl mb-4">MAS UTILIZADAS EN INGLES</p>
                  <div className="bg-card/90 rounded-2xl p-6 mb-4">
                    <p className="font-medium mb-2">
                      con pronunciación en español y fonética UK-USA
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="bg-secondary rounded p-2">
                        <div className="font-bold">Español</div>
                        <div className="text-xs text-muted-foreground">Casa</div>
                      </div>
                      <div className="bg-secondary rounded p-2">
                        <div className="font-bold">Inglés</div>
                        <div className="text-xs text-muted-foreground">House</div>
                      </div>
                      <div className="bg-secondary rounded p-2">
                        <div className="font-bold">Pronun.</div>
                        <div className="text-xs text-muted-foreground">jáus</div>
                      </div>
                      <div className="bg-secondary rounded p-2">
                        <div className="font-bold">Fonética</div>
                        <div className="text-xs text-muted-foreground">/haʊs/</div>
                      </div>
                    </div>
                  </div>
                  <div className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold">
                    BÁSICO - INTERMEDIO
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Gift className="w-4 h-4" />
                <span>¡4 BONUS GRATUITAS INCLUIDAS!</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 5,000 Palabras con Pronunciación Español y
                Fonética UK/USA
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-accent text-accent"
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">(800 Reseñas)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-5xl font-bold text-foreground">$14</span>
                <span className="text-2xl text-muted-foreground line-through">
                  $100
                </span>
                <span className="px-3 py-1 rounded-full gradient-accent text-accent-foreground text-sm font-bold">
                  AHORRA 86%
                </span>
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
              <Button
                variant="hero"
                size="xl"
                className="w-full md:w-auto mb-4"
                onClick={handleBuy}
              >
                QUIERO COMPRAR AHORA
                <ArrowRight className="w-5 h-5" />
              </Button>

              <p className="text-sm text-muted-foreground">
                🔒 Pago 100% seguro • Entrega inmediata • Garantía de satisfacción
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Banner */}
      <section className="py-8 gradient-hero">
        <div className="container px-4 md:px-6 text-center">
          <p className="text-primary-foreground/80 text-lg mb-2">
            VISTA PREVIA DISPONIBLE
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            ¡APROVECHA Y RECIBE 4 BONUS GRATUITAS!
          </h2>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 md:py-28">
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

            {/* Chapters Preview */}
            <h3 className="text-2xl font-bold text-center text-foreground mb-6">
              52 Capítulos Temáticos
            </h3>
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {chapters.map((chapter) => (
                <span
                  key={chapter}
                  className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm"
                >
                  {chapter}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bonuses */}
      <section className="py-20 md:py-28 bg-secondary/30">
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
            {bonuses.map((bonus, index) => (
              <div
                key={bonus.title}
                className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-hero transition-all duration-500"
              >
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials variant="light" />

      {/* Final CTA */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              ¿Listo para dominar el inglés?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Únete a más de 800 estudiantes satisfechos que ya están aprendiendo
              con Inglés Relax
            </p>

            <div className="bg-card rounded-3xl border border-border shadow-hero p-8 mb-8">
              <div className="flex items-baseline justify-center gap-3 mb-4">
                <span className="text-5xl font-bold text-foreground">$14</span>
                <span className="text-2xl text-muted-foreground line-through">
                  $100
                </span>
                <span className="text-accent font-bold">USD</span>
              </div>
              <p className="text-muted-foreground mb-6">
                Pago único • Acceso de por vida • 4 Bonus incluidos
              </p>
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleBuy}
              >
                QUIERO COMPRAR AHORA
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              🔒 Pago 100% seguro con Hotmart • Entrega digital inmediata
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Product5000;
