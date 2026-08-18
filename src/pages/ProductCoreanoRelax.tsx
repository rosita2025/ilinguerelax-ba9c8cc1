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
import { PaymentLogos } from "@/components/checkout/PaymentLogos";
import { Input } from "@/components/ui/input";
import { Check, BookOpen, Mail, Loader2, Lightbulb, Globe, Sparkles, Brain, ShoppingCart, Store, Eye, Download, Shield, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { useI18n } from "@/i18n/I18nContext";
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

import { WhatsAppTestimoniosCoreano } from "@/components/WhatsAppTestimoniosCoreano";
import { ResenasWhatsAppCoreano } from "@/components/ResenasWhatsAppCoreano";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";
import { PinterestSave } from "@/components/PinterestSave";
import { CoreanoHeroRedesign } from "@/components/coreano/CoreanoHeroRedesign";
import { CoreanoBonuses } from "@/components/coreano/CoreanoBonuses";
import { CoreanoFeaturesGrid } from "@/components/coreano/CoreanoFeaturesGrid";
import { CoreanoUpdates } from "@/components/coreano/CoreanoUpdates";
import { CoreanoHowItWorks } from "@/components/coreano/CoreanoHowItWorks";
import { CoreanoCategories } from "@/components/coreano/CoreanoCategories";
import { CoreanoForWho } from "@/components/coreano/CoreanoForWho";

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
  const { t } = useI18n();
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
      name: "Coreano Sin Complicaciones · 1,000 Palabras Esenciales (PDF)",
      price: priceUsd,
      regionPrices: { latam: priceLatamUsd, global: priceGlobalUsd, tienda: priceTiendaUsd },
      pricePen: pricePen ?? undefined,
      image: "/images/product-coreano-100-mapas.webp",
      description: "1,000 palabras esenciales para aprender coreano (Hangul, pronunciación y español)",
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
        title={pricing.name ?? "1,000 Palabras Esenciales para Aprender Coreano · iLingue Relax"}
        description={pricing.description ?? "Domina el vocabulario coreano con 1,000 palabras esenciales, Hangul y pronunciación adaptada para hispanohablantes. PDF descargable."}
        canonicalUrl="https://ilinguerelax.com/products/100-mapas-mentales-para-aprender-coreano-hangul-c1"
        image={pricing.coverImageUrl ?? `https://ilinguerelax.com${coverAsset.url}`}
        type="product"
        price="12"
        originalPrice="39"
        sku="ILINGUE-COREANO-100MM"
        keywords="aprender coreano desde cero, coreano para hispanohablantes, mapas mentales coreano, alfabeto hangul pdf, curso de coreano pdf, vocabulario coreano, coreano kpop, coreano kdramas, libro para aprender coreano, coreano A1 A2, ebook coreano"
      />
      <Navbar />

      <section className="pt-4 pb-0">
        {!pricing.active && (
          <div className="container px-4 md:px-6 mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-800">
              <Lock className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <span className="font-bold">Vista previa de Borrador:</span> Este producto está oculto para los clientes. Solo tú puedes verlo porque eres administrador.
              </div>
            </div>
          </div>
        )}
        
        <CoreanoHeroRedesign 
          price={displayPrice} 
          onBuy={handleBuy} 
        />
      </section>

      <CoreanoBonuses />
      <CoreanoUpdates />
      <CoreanoFeaturesGrid />
      <CoreanoHowItWorks />
      <CoreanoCategories />
      <CoreanoForWho />

      {/* Vista previa - Slider de mapas mentales */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
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

      <ResenasWhatsAppCoreano />

      <FAQ
        items={[
          { 
            question: "¿Cuándo recibiré mi acceso?", 
            answer: "La entrega es inmediata. Tras completar tu pago, recibirás automáticamente un correo electrónico con el enlace de descarga de las 1,000 palabras esenciales y todos tus bonos.", 
            icon: Download 
          },
          { 
            question: "¿Cómo funciona la actualización a 2,000 palabras?", 
            answer: "Al comprar hoy la versión de 1,000 palabras, quedas registrado para recibir la expansión a 2,000 palabras de forma totalmente GRATUITA. Te enviaremos la nueva versión a tu correo en cuanto sea lanzada sin que tengas que pagar nada extra.", 
            icon: Sparkles 
          },
          { 
            question: "¿Cuál es la política de reembolso?", 
            answer: "Confiamos plenamente en nuestro método. Si por alguna razón sientes que el material no es para ti, cuentas con una garantía de satisfacción de 7 días para solicitar la devolución total de tu dinero.", 
            icon: Shield 
          },
          { 
            question: "¿Qué formato tiene el material?", 
            answer: "Es un PDF digital de alta calidad, optimizado para ser visualizado en cualquier dispositivo (celular, tablet o computadora) y listo para imprimir si lo prefieres.", 
            icon: Globe 
          },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Todo lo que necesitas saber sobre Coreano Sin Complicaciones"
      />
      <Footer />
      <WhatsAppButton url="https://wa.link/ghi4rw" label="¿Dudas?" />
      <ScrollToTop showAfter={500} />

      {/* Sticky Buy Bar — 4-tier routing (Perú/VE-CU-NI/Global → Tienda · LATAM → Hotmart) */}
      <StickyBuyBar
        price={displayPrice}
        originalPrice={"$39"}
        currencyCode={currencyLabel}
        flag={displayFlag}
        productName="Coreano · 1,000 Palabras Esenciales"
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
