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
import { useCampaignPrice } from "@/hooks/useCampaignPrice";
import { CountryFlagSelector } from "@/components/CountryFlagSelector";
import coverAsset from "@/assets/coreano-100-mapas-cover.webp.asset.json";
import mapaSaludos from "@/assets/coreano-mapa-01-saludos.webp.asset.json";
import mapaVocales from "@/assets/coreano-mapa-02-vocales.webp.asset.json";

import mapaCuerpo from "@/assets/coreano-mapa-16-cuerpo.webp.asset.json";
import mapaProfesiones from "@/assets/coreano-mapa-19-profesiones.webp.asset.json";
import demoPdfAsset from "@/assets/demo-gratis-coreano.pdf.asset.json";
import { WhatsAppTestimoniosCoreano } from "@/components/WhatsAppTestimoniosCoreano";
import { ResenasWhatsAppCoreano } from "@/components/ResenasWhatsAppCoreano";

const COUNTRY_FLAG: Record<string, string> = {
  US: "🇺🇸", PE: "🇵🇪", MX: "🇲🇽", CO: "🇨🇴", AR: "🇦🇷", CL: "🇨🇱", BR: "🇧🇷",
  UY: "🇺🇾", BO: "🇧🇴", PY: "🇵🇾", GT: "🇬🇹", DO: "🇩🇴", CR: "🇨🇷", HN: "🇭🇳",
  NI: "🇳🇮", VE: "🇻🇪", PA: "🇵🇦", EC: "🇪🇨", SV: "🇸🇻", ES: "🇪🇸", FR: "🇫🇷",
  DE: "🇩🇪", IT: "🇮🇹", PT: "🇵🇹", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", NZ: "🇳🇿",
  JP: "🇯🇵", KR: "🇰🇷", SG: "🇸🇬", HK: "🇭🇰", TW: "🇹🇼", CH: "🇨🇭",
  SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰",
};

const CURRENCY_FLAG: Record<string, string> = {
  USD: "🇺🇸", CAD: "🇨🇦", EUR: "🇪🇸", GBP: "🇬🇧", AUD: "🇦🇺", NZD: "🇳🇿",
  MXN: "🇲🇽", COP: "🇨🇴", ARS: "🇦🇷", PEN: "🇵🇪", CLP: "🇨🇱", BRL: "🇧🇷",
  UYU: "🇺🇾", BOB: "🇧🇴", PYG: "🇵🇾", GTQ: "🇬🇹", DOP: "🇩🇴", CRC: "🇨🇷",
  HNL: "🇭🇳", NIO: "🇳🇮", VES: "🇻🇪",
};



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
  const localPrice = useCampaignPrice(10, 54);
  const flag = CURRENCY_FLAG[localPrice.currency] || COUNTRY_FLAG[localPrice.countryCode] || "🌎";
  const showLocal = localPrice.currency !== "USD";


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

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance leading-tight">
                🇰🇷 Coreano Sin Complicaciones · <span className="text-gradient">+100 Mapas Mentales</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 text-pretty">
                Aprende coreano de forma visual y entretenida con <strong>k-dramas</strong>, <strong>K-pop</strong> y cultura coreana. Sin reglas aburridas.
              </p>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl p-5 border border-amber-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-600 font-semibold text-xs uppercase">Precio de Lanzamiento</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$10</span>
                  <span className="text-2xl text-muted-foreground line-through">$54</span>
                  <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold shadow-lg">
                    -81%
                  </motion.span>
                </div>
                {showLocal && (
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {flag} ≈ <span className="text-primary">{localPrice.price} {localPrice.currency}</span>
                  </p>
                )}
                <CountryFlagSelector campaign={localPrice} className="mb-2" />
                <p className="text-xs text-muted-foreground">💳 Pago único · Acceso de por vida · Sin impuestos incluidos</p>
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
                    Comprar $10
                  </Button>
                </a>
                <p className="text-center text-xs text-muted-foreground mt-2">🔒 Pago seguro · Entrega automática</p>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-3 text-balance leading-tight">
              Aprende coreano con <span className="text-gradient">mapas mentales</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-10 text-pretty">Método visual, claro y progresivo · k-dramas y K-pop.</p>
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

      <WhatsAppTestimoniosCoreano />
      <ResenasWhatsAppCoreano />
      
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
        <div className="container px-3 py-2 flex flex-col items-stretch gap-1.5">
          <div className="flex items-baseline justify-center gap-2 leading-none flex-wrap">
            <span className="text-xl font-black text-foreground">$10 USD</span>
            {showLocal && (
              <span className="text-xs font-bold text-primary">{flag} ≈ {localPrice.price}</span>
            )}
            <span className="text-xs text-muted-foreground line-through">$54</span>
          </div>

          <a
            href="https://pay.hotmart.com/L106545921C?checkoutMode=10"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button size="lg" className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black shadow-hero text-sm sm:text-base h-11">
              <ShoppingCart className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="truncate">COMPRAR AHORA</span>
            </Button>
          </a>
        </div>
      </div>
      <div className="h-28 md:h-24" aria-hidden />
    </main>
  );
};

export default ProductCoreanoRelax;
