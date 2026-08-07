import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { ProductReviews } from "@/components/ProductReviews";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, BookOpen, Mail, Loader2, Lightbulb, Globe, Sparkles, Brain, ShoppingCart, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import coverAsset from "@/assets/coreano-100-mapas-cover.webp.asset.json";
import mapaSaludos from "@/assets/coreano-mapa-01-saludos.webp.asset.json";
import mapaVocales from "@/assets/coreano-mapa-02-vocales.webp.asset.json";
import mapaCuerpo from "@/assets/coreano-mapa-16-cuerpo.webp.asset.json";
import mapaProfesiones from "@/assets/coreano-mapa-19-profesiones.webp.asset.json";
import mapaVocales2 from "@/assets/Mapa-mental-2.webp.asset.json";
import mapaConsonantes from "@/assets/Mapa-mental-3.webp.asset.json";
import mapaPaises from "@/assets/Mapa-mental-5.webp.asset.json";
import mapaTransporte from "@/assets/Mapa-mental-20.webp.asset.json";
import mapaRestaurantes from "@/assets/Mapa-mental-47.webp.asset.json";
import bonoHangul from "@/assets/Bono-1-hangul.webp.asset.json";
import demoPdfAsset from "@/assets/demo-gratis-coreano.pdf.asset.json";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Eye } from "lucide-react";
import { WhatsAppTestimoniosCoreano } from "@/components/WhatsAppTestimoniosCoreano";
import { ResenasWhatsAppCoreano } from "@/components/ResenasWhatsAppCoreano";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";
import { PinterestSave } from "@/components/PinterestSave";

const HOTMART_URL_LATAM = "https://pay.hotmart.com/L106545921C?checkoutMode=10";
const TIENDA_CHECKOUT_PATH = "/checkouts/coreano-100-mapas";
const ADMIN_SKU = "100-mapas-mentales-para-aprender-coreano-hangul-c1";

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
  const navigate = useNavigate();
  
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const pricing = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, {
    tiendaPath: TIENDA_CHECKOUT_PATH,
    fallbackHotmartUrl: HOTMART_URL_LATAM,
  });
  const {
    isPeru,
    useTiendaOnly,
    useHotmartLatam,
    priceUsd,
    priceGlobalUsd,
    priceLatamUsd,
    priceTiendaUsd,
    pricePen,
    priceLabel: displayPrice,
    currencyCode: currencyLabel,
    loaded: pricingReady,
  } = tier;
  const displayFlag = isPeru ? "🇵🇪" : useHotmartLatam ? "🌎" : "🌍";

  const trackInitiate = () =>
    trackHotmartEvent("InitiateCheckout", {
      content_name: "Coreano Sin Complicaciones - 100 Mapas Mentales",
      content_category: "Digital Book",
      content_ids: ["product-coreano-100-mapas"],
      content_type: "product",
      value: priceUsd,
      currency: "USD",
      num_items: 1,
    });

  const handleBuyHotmart = () => {
    if (!pricingReady) return;
    // Skip Meta Pixel: Hotmart embeds the same pixel id at its checkout,
    // firing here would double-count InitiateCheckout.
    window.open(tier.hotmartUrl || HOTMART_URL_LATAM, "_blank", "noopener,noreferrer");
  };

  const handleBuyStore = () => {
    if (!pricingReady) return;
    trackInitiate();
    addItem({
      id: "coreano-100-mapas",
      name: "Coreano Sin Complicaciones · +100 Mapas Mentales (PDF)",
      price: priceUsd,
      regionPrices: { latam: priceLatamUsd, global: priceGlobalUsd, tienda: priceTiendaUsd },
      pricePen: pricePen ?? undefined,
      image: "/images/product-coreano-100-mapas.webp",
      description: "100 mapas mentales para aprender coreano desde cero (Hangul → C1)",
      quantity: 1,
    });
    sonnerToast.success("Producto agregado al carrito");
    navigate(TIENDA_CHECKOUT_PATH);
  };

  const handleBuy = () => handleBuyStore();


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
        title={pricing.name ?? "Aprender Coreano PDF · +100 Mapas Mentales"}
        description={pricing.description ?? "Aprende coreano desde cero con +100 mapas mentales visuales, alfabeto hangul y vocabulario K-pop y K-dramas. PDF descargable, nivel A1–A2."}
        canonicalUrl="https://ilinguerelax.com/products/100-mapas-mentales-para-aprender-coreano-hangul-c1"
        image={pricing.coverImageUrl ?? `https://ilinguerelax.com${coverAsset.url}`}
        type="product"
        price="10"
        originalPrice="54"
        sku="ILINGUE-COREANO-100MM"
        keywords="aprender coreano desde cero, coreano para hispanohablantes, mapas mentales coreano, alfabeto hangul pdf, curso de coreano pdf, vocabulario coreano, coreano kpop, coreano kdramas, libro para aprender coreano, coreano A1 A2, ebook coreano"
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
                <PinterestSave 
                  overlay 
                  media={coverAsset.url}
                  url="https://ilinguerelax.com/products/coreano-relax-100-mapas-mentales-vocabulario-visual-con-pronunciacion"
                  description="Aprende coreano con 100 mapas mentales visuales y pronunciación fácil."
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
                {pricing.name ?? (<>🇰🇷 Coreano Sin Complicaciones · <span className="text-gradient">+100 Mapas Mentales</span></>)}
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 text-pretty">
                {pricing.description ?? (<>Aprende coreano de forma visual y entretenida con <strong>k-dramas</strong>, <strong>K-pop</strong> y cultura coreana. Sin reglas aburridas.</>)}
              </p>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl p-5 border border-amber-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-600 font-semibold text-xs uppercase">Precio de Lanzamiento</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span className="text-5xl md:text-6xl font-black text-foreground">{displayPrice}</span>
                  <span className="text-2xl text-muted-foreground line-through">$54</span>
                  <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold shadow-lg">
                    {isPeru ? "-72%" : useHotmartLatam ? "-81%" : "-72%"}
                  </motion.span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {displayFlag} Precio para {isPeru ? "Perú" : useHotmartLatam ? "Latinoamérica" : "tu país"} · <span className="text-primary">{currencyLabel}</span>
                </p>
                <p className="text-xs text-muted-foreground">💳 Pago único · Acceso de por vida · Sin impuestos incluidos</p>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-6">
                <div className={useTiendaOnly ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
                  <Button onClick={handleBuyStore} size="lg" className="w-full text-base py-6 gradient-hero text-primary-foreground font-bold shadow-hero hover:scale-[1.02] transition-transform">
                    <Store className="w-5 h-5 mr-2" />
                    Tienda iLingue · {displayPrice}
                  </Button>
                  {useHotmartLatam && (
                    <Button onClick={handleBuyHotmart} variant="outline" size="lg" className="w-full text-base py-6 border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-bold">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Hotmart · ${priceLatamUsd.toFixed(2)}
                    </Button>
                  )}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">🔒 Pago seguro · Entrega automática · Elige tu método</p>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* Vista previa - Slider de mapas mentales */}
      <section className="py-10 md:py-14 bg-gradient-to-b from-background to-primary/5">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
                <Eye className="w-4 h-4" /> Vista previa · Páginas reales
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Mira dentro del <span className="text-gradient">ebook</span>
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ejemplos reales de mapas mentales con Hangul, pronunciación en español y vocabulario práctico. Marca de agua incluida.
              </p>
            </div>

            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {[
                  { src: mapaSaludos.url, caption: "Saludos y presentaciones" },
                  { src: mapaVocales.url, caption: "Alfabeto Hangul · Vocales" },
                  { src: mapaConsonantes.url, caption: "Alfabeto Hangul · Consonantes" },
                  { src: mapaPaises.url, caption: "Países y nacionalidades" },
                  { src: mapaCuerpo.url, caption: "El cuerpo humano" },
                  { src: mapaTransporte.url, caption: "Transporte y direcciones" },
                  { src: mapaProfesiones.url, caption: "Profesiones" },
                  { src: mapaRestaurantes.url, caption: "Restaurantes y pedidos" },
                  { src: bonoHangul.url, caption: "Bono · Práctica de escritura" },
                ].map((item, i) => (
                  <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="rounded-2xl overflow-hidden border-2 border-primary/20 bg-card shadow-card">
                      <div className="aspect-[3/4] overflow-hidden bg-muted">
                        <img
                          src={item.src}
                          alt={`Vista previa mapa mental coreano - ${item.caption}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 text-center">
                        <p className="text-sm font-semibold text-foreground">{item.caption}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4" />
              <CarouselNext className="hidden md:flex -right-4" />
            </Carousel>

            <div className="text-center mt-6">
              <a
                href="/vista-previa/coreano-100-mapas-mentales"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
              >
                <Eye className="w-4 h-4" /> Ver vista previa completa
              </a>
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
      <WhatsAppButton url="https://wa.link/ghi4rw" label="¿Dudas?" />
      <ScrollToTop showAfter={500} />

      {/* Sticky Buy Bar — 4-tier routing (Perú/VE-CU-NI/Global → Tienda · LATAM → Hotmart) */}
      <StickyBuyBar
        price={displayPrice}
        originalPrice={tier.originalLabel}
        currencyCode={currencyLabel}
        flag={displayFlag}
        productName="Coreano · +100 Mapas Mentales"
        ctaText={"Comprar ahora"}
        buyUrl={TIENDA_CHECKOUT_PATH}
        onBuyClick={handleBuy}

        rating={4.9}
        reviewCount={120}
        lang="es"
      />
      <div className="h-28 md:h-24" aria-hidden />


      {/* Floating WhatsApp help button */}

    </main>
  );
};

export default ProductCoreanoRelax;
