import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductReviews } from "@/components/ProductReviews";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Star, Check, BookOpen, Globe, ArrowRight, Download, Gift, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProductCrossSell } from "@/components/ProductCrossSell";
import product1000Free from "@/assets/product-1000-free.png";

const features = [
  "1,000+ palabras más utilizadas en inglés",
  "Pronunciación adaptada para hispanohablantes",
  "Fonética internacional UK/US incluida",
  "Nivel básico ideal para principiantes",
  "Capítulos temáticos organizados",
  "Significado en español de cada palabra",
  "Descarga digital inmediata",
  "100% Gratuito",
];

const Product1000Free = () => {
  const handleDownload = () => {
    window.open("https://ilinguerelax.gumroad.com/l/ingles-relax-1000-palabras", "_blank");
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="1,000 Palabras en Inglés con Pronunciación GRATIS - Inglés Relax"
        description="Descarga GRATIS el libro digital con 1,000 palabras en inglés con pronunciación adaptada para hispanohablantes y fonética UK/US. Aprende inglés sin estrés."
        canonicalUrl="https://ilinguerelax.com/products/1-000-palabras-en-ingles-con-pronunciacion-gratis"
        image="https://ilinguerelax.com/product-1000-free.png"
        type="product"
        price="0"
        originalPrice="12"
        rating="4.8"
        reviewCount="520"
        sku="ILINGUE-1000-FREE"
        keywords="aprender inglés gratis, vocabulario inglés 1000 palabras, pronunciación inglés hispanohablantes, libro digital inglés gratuito, inglés básico gratis"
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 text-sm font-bold mb-4">
                  <Gift className="w-4 h-4" />
                  100% GRATIS
                </div>
                <img
                  src={product1000Free}
                  alt="Inglés Relax - 1,000 Palabras Gratis"
                  className="w-full h-auto rounded-2xl shadow-hero"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 text-sm font-bold border border-green-500/20"
                >
                  <Gift className="w-4 h-4" />
                  <span>🎁 GRATIS</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Inglés Relax - 1,000 Palabras con Pronunciación en Español y Fonética UK/US
              </h1>

              {/* Reviews */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-foreground">4.8/5</span>
                <span className="text-muted-foreground">(520+ Reseñas)</span>
              </div>

              {/* Price Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20 mb-6"
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-green-600">GRATIS</span>
                  <span className="text-2xl text-muted-foreground line-through">$12</span>
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg"
                  >
                    100% OFF
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">
                  🎁 Sin costo • Sin tarjeta de crédito • Descarga inmediata
                </p>
              </motion.div>

              {/* CTA Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mb-4 text-lg py-6 shadow-2xl relative overflow-hidden group"
                  onClick={handleDownload}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Download className="w-6 h-6 mr-2" />
                  ¡DESCARGAR GRATIS AHORA!
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </motion.div>

              <p className="text-center text-sm text-muted-foreground mb-6">
                👆 Haz clic para obtener tu copia gratuita
              </p>

              {/* Features List */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¿Qué incluye este libro <span className="text-gradient">gratuito</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Un vocabulario esencial con las 1,000 palabras más usadas en inglés, con pronunciación adaptada para hispanohablantes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-card text-center">
              <BookOpen className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">1,000 Palabras</h3>
              <p className="text-sm text-muted-foreground">Las palabras más utilizadas en inglés organizadas por temas</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-card text-center">
              <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">Pronunciación</h3>
              <p className="text-sm text-muted-foreground">Pronunciación adaptada especialmente para hispanohablantes</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-card text-center">
              <ExternalLink className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">Fonética UK/US</h3>
              <p className="text-sm text-muted-foreground">Incluye la fonética internacional para inglés británico y americano</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Empieza a aprender inglés <span className="text-gradient">hoy mismo</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Descarga tu copia gratuita y comienza tu viaje en el aprendizaje del inglés con el método Relax
            </p>
            <Button
              variant="hero"
              size="xl"
              className="text-lg py-6 px-12 shadow-2xl"
              onClick={handleDownload}
            >
              <Download className="w-6 h-6 mr-2" />
              DESCARGAR GRATIS
            </Button>
          </div>
        </div>
      </section>

      {/* Cross-sell to paid products */}
      <ProductCrossSell currentProduct="5000" />

      {/* Reviews */}
      <ProductReviews productType="english" />

      <Footer />
      <WhatsAppButton />
      <ScrollToTop />
    </main>
  );
};

export default Product1000Free;
