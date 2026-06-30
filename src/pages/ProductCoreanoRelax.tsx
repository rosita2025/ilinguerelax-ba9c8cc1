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
import { Check, BookOpen, Mail, Loader2, Lightbulb, Globe, Sparkles, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import coverAsset from "@/assets/coreano-relax-cover.webp.asset.json";
import mapaFamilia from "@/assets/coreano-mapa-09-familia.webp.asset.json";
import mapaCasa from "@/assets/coreano-mapa-objetos-casa.webp.asset.json";
import mapaRopa from "@/assets/coreano-mapa-15-ropa.webp.asset.json";
import mapaEscuela from "@/assets/coreano-mapa-18-escuela.webp.asset.json";

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
        price="15"
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
                  <span>🇰🇷 MUY PRONTO</span>
                </motion.div>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                  <Brain className="w-4 h-4" /> +100 Mapas Mentales
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                🇰🇷 Coreano Sin Complicaciones · +100 Mapas Mentales Visuales para Aprender <span className="text-gradient">Coreano</span> de Forma Natural
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                Aprende coreano de manera visual, sencilla y entretenida, conectando el idioma con lo que realmente te gusta: los <strong>k-dramas</strong>, el <strong>K-pop</strong> y la cultura coreana moderna. En lugar de memorizar reglas complicadas, tu cerebro aprenderá a través de mapas mentales claros, imágenes y asociaciones fáciles de recordar.
              </p>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl p-6 border border-amber-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-600 font-semibold text-sm uppercase">Precio de Lanzamiento</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$15</span>
                  <span className="text-2xl text-muted-foreground line-through">$54</span>
                  <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold shadow-lg">
                    AHORRA 72%
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">💳 Pago único · Sin suscripciones · Acceso de por vida</p>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl border-2 border-primary/20 p-6 mb-6">
                {isSubscribed ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">¡Gracias por suscribirte! 🎉</h3>
                    <p className="text-muted-foreground">Te enviaremos un correo cuando Coreano Relax esté disponible.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      ¡Suscríbete y te avisamos cuando esté listo!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">Deja tu correo y sé el primero en recibir el lanzamiento al precio más bajo.</p>
                    <form onSubmit={handleSubscribe} className="flex gap-2">
                      <Input type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" disabled={isLoading} />
                      <Button type="submit" disabled={isLoading} className="shrink-0">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Mail className="w-4 h-4 mr-2" />Suscribirme</>)}
                      </Button>
                    </form>
                  </>
                )}
              </motion.div>
              <p className="text-center text-sm text-muted-foreground mb-6">📧 Te notificaremos por correo cuando esté disponible</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { url: mapaFamilia.url, alt: "Mapa Mental N.º 9 · La Familia (Coreano Relax)" },
                  { url: mapaCasa.url, alt: "Mapa Mental · Objetos de la casa (Coreano Relax)" },
                  { url: mapaRopa.url, alt: "Mapa Mental N.º 15 · Ropa, Colores y Accesorios (Coreano Relax)" },
                  { url: mapaEscuela.url, alt: "Mapa Mental N.º 18 · Escuela, Universidad y Materiales (Coreano Relax)" },
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

      <ProductReviews productType="english" reviews={[]} showReviewForm />
      <FAQ
        items={[
          { question: "¿Cuándo estará disponible?", answer: "Coreano Relax está en producción y estará disponible muy pronto. Suscríbete para ser el primero en saberlo y acceder al precio de lanzamiento.", icon: Sparkles },
          { question: "¿Qué incluye el ebook?", answer: "100 mapas mentales del nivel A1 al C1 con Hangul, romanización, pronunciación para hispanohablantes, vocabulario por temas, mini conversaciones, ejercicios y respuestas. Más 2 bonos: Guía Completa del Hangul y 100 Expresiones Esenciales.", icon: BookOpen },
          { question: "¿Necesito saber coreano para empezar?", answer: "No. Está diseñado para empezar desde cero, incluso si nunca has visto el alfabeto Hangul.", icon: Lightbulb },
          { question: "¿En qué formato se entrega?", answer: "PDF descargable, optimizado para leer desde celular, tablet o computadora. Puedes imprimirlo si lo deseas.", icon: Globe },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre Coreano Relax"
      />
      <Footer />
      <WhatsAppButton />
      <ScrollToTop showAfter={500} />
    </main>
  );
};

export default ProductCoreanoRelax;
