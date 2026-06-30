import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { ProductReviews } from "@/components/ProductReviews";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, BookOpen, Mail, Loader2, Lightbulb, Globe, Sparkles, Brain, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import coverAsset from "@/assets/coreano-100-mapas-cover.webp.asset.json";
import mapaSaludos from "@/assets/coreano-mapa-01-saludos.webp.asset.json";
import mapaVocales from "@/assets/coreano-mapa-02-vocales.webp.asset.json";

import mapaCuerpo from "@/assets/coreano-mapa-16-cuerpo.webp.asset.json";
import mapaProfesiones from "@/assets/coreano-mapa-19-profesiones.webp.asset.json";
import demoPdfAsset from "@/assets/demo-gratis-coreano.pdf.asset.json";

const features = [
  "Más de 100 mapas mentales organizados por temas",
  "Introducción completa al Hangul (alfabeto coreano) paso a paso",
  "Vocabulario práctico del día a día",
  "Verbos esenciales y estructuras básicas explicadas visualmente",
  "Frases reales usadas en la vida cotidiana y en dramas coreanos",
  "Expresiones comunes del K-pop y la cultura juvenil coreana",
  "Método visual diseñado para acelerar la memorización",
  "Ideal para principiantes (A1–A2), sin libros aburridos",
  "Acceso de por vida · Pago único, sin mensualidades",
  "Actualizaciones incluidas · PDF descargable",
];

const ProductCoreanoRelax = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({ title: "Error", description: "Por favor ingresa un correo electrónico válido.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-store-notification", {
        body: { email, storeName: "Coreano Relax - 100 Mapas Mentales", productType: "korean" },
      });
      if (error) throw error;
      setIsSubscribed(true);
      toast({ title: "¡Gracias por suscribirte! 🎉", description: "Te avisaremos cuando Coreano Relax esté disponible." });
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({ title: "Error", description: "Hubo un error al suscribirte. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Coreano Sin Complicaciones · +100 Mapas Mentales para Aprender Coreano de Forma Natural"
        description="Aprende coreano de manera visual, sencilla y entretenida con +100 mapas mentales. Conecta el idioma con los k-dramas, el K-pop y la cultura coreana moderna. Ideal para principiantes (A1–A2)."
        canonicalUrl="https://ilinguerelax.com/products/100-mapas-mentales-para-aprender-coreano-hangul-c1"
        image={`https://ilinguerelax.com${coverAsset.url}`}
        type="product"
        price="10"
        originalPrice="54"
        sku="ILINGUE-COREANO-100MM"
        keywords="coreano sin complicaciones, aprender coreano, mapas mentales coreano, alfabeto hangul, kpop, kdramas, coreano para hispanohablantes"
      />
      <Navbar />

      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative">
                <img
                  src={coverAsset.url}
                  alt="Coreano Relax - 100 Mapas Mentales para Aprender Coreano (Hangul a C1)"
                  className="w-full h-auto rounded-2xl shadow-hero"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                  <span>🇰🇷 NUEVO LANZAMIENTO</span>
                </motion.div>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                  <Brain className="w-4 h-4" /> +100 Mapas Mentales
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                🇰🇷 Coreano Sin Complicaciones · <span className="text-gradient">+100 Mapas Mentales</span> Visuales para Aprender Coreano de Forma Natural
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                Aprende coreano de manera visual, sencilla y entretenida, conectando el idioma con lo que realmente te gusta: los <strong>k-dramas</strong>, el <strong>K-pop</strong> y la cultura coreana moderna. En lugar de memorizar reglas complicadas, tu cerebro aprenderá a través de mapas mentales claros, imágenes y asociaciones fáciles de recordar.
              </p>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl p-6 border border-amber-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-600 font-semibold text-sm uppercase">Precio de Lanzamiento</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$10</span>
                  <span className="text-2xl text-muted-foreground line-through">$54</span>
                  <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold shadow-lg">
                    AHORRA 81%
                  </motion.span>
                </div>
                <p className="text-base font-semibold text-foreground mb-1">
                  🇵🇪 Equivale a aprox. <span className="text-primary">S/ 32.80 PEN</span> <span className="text-xs text-muted-foreground">(referencia: 1 USD = 3.28 PEN)</span>
                </p>
                <p className="text-xs text-muted-foreground mb-1">El precio se cobra en USD y se convierte a tu moneda local según el tipo de cambio del día.</p>
                <p className="text-sm text-muted-foreground">💳 Pago único · Sin suscripciones · Acceso de por vida · <strong>No incluye impuestos</strong> (pueden aplicar según tu país)</p>
                <p className="text-xs text-muted-foreground mt-1">✅ Precio accesible · Evitamos presupuestos caros</p>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-6">
                <a
                  href="https://pay.hotmart.com/L106545921C?checkoutMode=10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button size="lg" className="w-full text-lg py-7 gradient-hero text-primary-foreground font-bold shadow-hero hover:scale-[1.02] transition-transform">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Comprar ahora por $10 USD
                  </Button>
                </a>
                <p className="text-center text-xs text-muted-foreground mt-2">🔒 Pago seguro vía Hotmart · Entrega automática por correo</p>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
              Aprende coreano con <span className="text-gradient">mapas mentales</span> sin complicarte
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">Método visual, claro y progresivo. Conecta el idioma con emociones y cultura real (k-dramas, K-pop).</p>
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

            <div className="mt-4">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
                  <Brain className="w-4 h-4" /> Vista previa real · Alta calidad
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Así se ven los <span className="text-gradient">Mapas Mentales</span>
                </h3>
                <p className="text-muted-foreground">Hangul, pronunciación hispana, español, mini mapa conceptual y frases prácticas.</p>
              </div>

              <div className="mb-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">
                      ✨ Producto de alta calidad · Revisado y sin errores ortográficos
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Cada mapa mental ha sido revisado cuidadosamente para garantizar una excelente calidad visual, contenido preciso y ortografía correcta tanto en coreano (Hangul) como en español. 👉 <strong>Mira la vista previa</strong> a continuación y compruébalo tú mismo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 p-5 shadow-card">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base md:text-lg font-extrabold text-foreground">
                      👓 ¿Ves las imágenes borrosas o tienes problemas de visión?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Abre el <strong>demo gratis en PDF</strong> con vista nítida y haz zoom sin perder calidad. Muestras de los +100 Mapas Mentales (A1 a C2).
                    </p>
                  </div>
                  <a
                    href={demoPdfAsset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black text-sm font-extrabold transition-colors shadow-md whitespace-nowrap"
                  >
                    📄 Abrir demo PDF
                  </a>
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { url: mapaSaludos.url, alt: "Mapa Mental N.º 1 · Saludos y Presentaciones (Coreano Relax)" },
                  { url: mapaVocales.url, alt: "Mapa Mental N.º 2 · Alfabeto Hangul: Vocales (Coreano Relax)" },
                  
                  { url: mapaCuerpo.url, alt: "Mapa Mental N.º 16 · Partes del Cuerpo y Salud (Coreano Relax)" },
                  { url: mapaProfesiones.url, alt: "Mapa Mental N.º 19 · Profesiones y Lugares de Trabajo (Coreano Relax)" },
                ].map((m) => (
                  <div key={m.alt} className="relative rounded-2xl overflow-hidden border border-border bg-white shadow-card">
                    <img src={m.url} alt={m.alt} loading="lazy" className="w-full h-auto object-contain" onContextMenu={(e) => e.preventDefault()} />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <span className="text-3xl md:text-5xl font-black text-slate-900/10 -rotate-45 tracking-widest whitespace-nowrap select-none">
                        ilinguerelax.com
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Vista previa con marca de agua. El PDF completo se entrega tras la compra.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold mb-3 border border-amber-500/20">
                <Sparkles className="w-4 h-4" /> Incluye 2 Bonos GRATIS
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Bonos exclusivos <span className="text-gradient">incluidos</span> en tu compra
              </h3>
              <p className="text-muted-foreground">Llévate dos recursos adicionales sin costo extra para acelerar tu aprendizaje.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-500/5 p-6 shadow-card">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Bono 1
                </div>
                <h4 className="text-xl font-bold text-foreground mb-2">
                  📖 Guía Completa del Alfabeto Hangul
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Aprende a leer y escribir Hangul desde cero con explicaciones claras de cada vocal y consonante, trazos paso a paso y ejemplos de pronunciación para hispanohablantes.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Check className="w-4 h-4" /> Incluido GRATIS
                </div>
              </div>

              <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-primary/5 p-6 shadow-card">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Bono 2
                </div>
                <h4 className="text-xl font-bold text-foreground mb-2">
                  💬 100 Expresiones Coreanas Esenciales
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Las frases más usadas en el día a día, k-dramas y K-pop, con Hangul, pronunciación hispana y traducción al español para que hables con naturalidad desde el primer día.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                  <Check className="w-4 h-4" /> Incluido GRATIS
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductReviews productType="english" reviews={[]} showReviewForm />
      <FAQ
        items={[
          { question: "¿Cuándo estará disponible?", answer: "Coreano Relax está en producción y estará disponible muy pronto. Suscríbete para ser el primero en saberlo y acceder al precio de lanzamiento.", icon: Sparkles },
          { question: "¿Qué incluye el ebook?", answer: "100 mapas mentales del nivel A1 al C1 con Hangul, romanización, pronunciación para hispanohablantes, vocabulario por temas, mini conversaciones, ejercicios y respuestas. Más 2 bonos: Guía Completa del Hangul y 100 Expresiones Esenciales.", icon: BookOpen },
          { question: "¿Necesito saber coreano para empezar?", answer: "No. Está diseñado para empezar desde cero, incluso si nunca has visto el alfabeto Hangul.", icon: Lightbulb },
          { question: "¿En qué formato se entrega?", answer: "PDF descargable, optimizado para leer desde celular, tablet o computadora. Puedes imprimirlo si lo deseas.", icon: Globe },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre Coreano Sin Complicaciones"
      />
      <Footer />
      <WhatsAppButton />
      <ScrollToTop showAfter={500} />

      {/* Sticky Buy Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border shadow-2xl">
        <div className="container px-3 py-2 flex items-center gap-2">
          <div className="flex-shrink-0 leading-tight">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl md:text-2xl font-black text-foreground">$10</span>
              <span className="text-xs text-muted-foreground line-through">$54</span>
            </div>
            <p className="text-[10px] text-primary font-semibold">≈ S/ 32.80</p>
          </div>
          <a
            href="https://pay.hotmart.com/L106545921C?checkoutMode=10"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0"
          >
            <Button size="lg" className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black shadow-hero text-base">
              <ShoppingCart className="w-5 h-5 mr-1.5" />
              COMPRAR
            </Button>
          </a>
        </div>
      </div>
      <div className="h-20 md:h-24" aria-hidden />
    </main>
  );
};

export default ProductCoreanoRelax;
