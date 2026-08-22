import { useNavigate } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { Button } from "@/components/ui/button";
import { PaymentLogos } from "@/components/checkout/PaymentLogos";
import { Brain, Check, Download, Eye, Globe, Lock, Shield, ShoppingCart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import coverAsset from "@/assets/coreano-100-mapas-cover.webp.asset.json";
import mapaSaludos from "@/assets/coreano-mapa-01-saludos.webp.asset.json";
import mapaVocales from "@/assets/coreano-mapa-02-vocales.webp.asset.json";
import mapaCuerpo from "@/assets/coreano-mapa-16-cuerpo.webp.asset.json";
import mapaProfesiones from "@/assets/coreano-mapa-19-profesiones.webp.asset.json";
import mapaFamilia from "@/assets/coreano-mapa-09-familia.webp.asset.json";
import mapaRopa from "@/assets/coreano-mapa-15-ropa.webp.asset.json";
import mapaEscuela from "@/assets/coreano-mapa-18-escuela.webp.asset.json";
import mapaObjetos from "@/assets/coreano-mapa-objetos-casa.webp.asset.json";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";

const HOTMART_URL_LATAM = "https://pay.hotmart.com/L106545921C?checkoutMode=10";
const TIENDA_CHECKOUT_PATH = "/checkouts/coreano-100-mapas";
const ADMIN_SKU = "100-mapas-mentales-para-aprender-coreano-hangul-c1";

const features = [
  "+100 mapas mentales visuales de coreano",
  "Vocabulario organizado por temas (familia, ropa, escuela, profesiones, cuerpo…)",
  "Hangul + pronunciación adaptada al español en cada mapa",
  "Método visual: memoriza por asociación, no de memoria",
  "Ideal para principiantes (A1–A2) y repaso rápido",
  "Acceso de por vida · Pago único, sin mensualidades",
  "PDF descargable, listo para imprimir",
];

const previews = [
  { src: mapaSaludos.url, caption: "Mapa mental · Saludos" },
  { src: mapaVocales.url, caption: "Mapa mental · Vocales Hangul" },
  { src: mapaFamilia.url, caption: "Mapa mental · La familia" },
  { src: mapaRopa.url, caption: "Mapa mental · Ropa" },
  { src: mapaCuerpo.url, caption: "Mapa mental · El cuerpo" },
  { src: mapaEscuela.url, caption: "Mapa mental · Escuela" },
  { src: mapaProfesiones.url, caption: "Mapa mental · Profesiones" },
  { src: mapaObjetos.url, caption: "Mapa mental · Objetos de la casa" },
];

const ProductCoreano100Mapas = () => {
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const pricing = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, {
    tiendaPath: TIENDA_CHECKOUT_PATH,
  });
  const {
    isPeru,
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
  const coverImage = pricing.coverImageUrl ?? coverAsset.url;

  const handleBuy = () => {
    if (!pricingReady) return;
    trackHotmartEvent("AddToCart", {
      content_name: "+100 Mapas Mentales de Coreano",
      content_category: "Digital Book",
      content_ids: ["coreano-100-mapas"],
      content_type: "product",
      value: priceUsd,
      currency: "USD",
      num_items: 1,
    });
    addItem({
      id: "coreano-100-mapas",
      name: "+100 Mapas Mentales de Coreano (PDF)",
      price: priceUsd,
      regionPrices: { latam: priceLatamUsd, global: priceGlobalUsd, tienda: priceTiendaUsd },
      pricePen: pricePen ?? undefined,
      image: coverImage,
      description: "+100 mapas mentales visuales para aprender coreano (Hangul y pronunciación)",
      quantity: 1,
    });
    sonnerToast.success("Producto agregado al carrito");
    navigate(TIENDA_CHECKOUT_PATH);
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={pricing.name ?? "+100 Mapas Mentales de Coreano · Hangul A1–C1 | iLingue Relax"}
        description={
          pricing.description ??
          "Aprende coreano con +100 mapas mentales visuales: Hangul, pronunciación en español y vocabulario por temas. PDF descargable."
        }
        canonicalUrl="https://ilinguerelax.com/products/100-mapas-mentales-para-aprender-coreano-hangul-c1"
        image={pricing.coverImageUrl ?? `https://ilinguerelax.com${coverAsset.url}`}
        type="product"
        sku="ILINGUE-COREANO-100MAPAS"
        keywords="mapas mentales coreano, aprender coreano visual, hangul mapas mentales, vocabulario coreano pdf, coreano para hispanohablantes, ebook coreano"
      />
      <Navbar />

      {!pricing.active && (
        <div className="container px-4 md:px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-800">
            <Lock className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Vista previa de Borrador:</span> Este producto está oculto para los clientes.
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="pt-6 pb-12 md:pt-10 md:pb-16 bg-gradient-to-b from-background to-primary/5">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <img
                src={coverImage}
                alt="+100 Mapas Mentales de Coreano · Portada del ebook"
                className="relative w-full h-auto rounded-2xl shadow-hero"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                <Brain className="w-4 h-4" /> Método visual · 🇰🇷 Coreano
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4 text-balance leading-tight">
                +100 Mapas Mentales de <span className="text-gradient">Coreano</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-6 text-pretty">
                Memoriza vocabulario coreano por asociación visual: cada mapa reúne Hangul, pronunciación en español y
                palabras agrupadas por tema.
              </p>

              <div className="flex items-end gap-3 mb-6">
                <span className="text-4xl font-black text-foreground">{displayPrice}</span>
                <span className="text-sm text-muted-foreground mb-1">{currencyLabel} {displayFlag}</span>
              </div>

              <Button
                size="lg"
                onClick={handleBuy}
                disabled={!pricingReady}
                className="w-full text-base py-7 font-bold shadow-hero"
              >
                <ShoppingCart className="w-5 h-5 mr-2" /> Comprar ahora
              </Button>

              <div className="mt-4">
                <PaymentLogos />
              </div>

              <ul className="mt-6 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="py-14 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
                <Eye className="w-4 h-4" /> Vista previa · Mapas reales
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Mira algunos <span className="text-gradient">mapas mentales</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Mapas temáticos con Hangul, pronunciación en español y vocabulario práctico.
              </p>
            </div>

            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {previews.map((item, i) => (
                  <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="rounded-2xl overflow-hidden border-2 border-primary/20 bg-card shadow-card">
                      <div className="aspect-[3/4] overflow-hidden bg-muted">
                        <img
                          src={item.src}
                          alt={`Vista previa mapa mental coreano - ${item.caption}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onContextMenu={(e) => e.preventDefault()}
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
          </div>
        </div>
      </section>

      {/* Cross-sell to the 1,000 words product */}
      <section className="pb-14 md:pb-20">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-amber-500/5 p-6 md:p-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> También te puede interesar
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              Aprende las 1,000 palabras esenciales del coreano 🇰🇷
            </h3>
            <p className="text-muted-foreground mb-4">
              El listado completo de vocabulario esencial con Hangul y pronunciación en español.
            </p>
            <a href="/products/1-000-palabras-esenciales-para-aprender-coreano">
              <Button variant="outline" size="lg" className="font-bold">
                Ver 1,000 palabras esenciales
              </Button>
            </a>
          </div>
        </div>
      </section>

      <FAQ
        items={[
          {
            question: "¿Cuándo recibiré mis mapas mentales?",
            answer:
              "La entrega es inmediata. Tras completar tu pago recibirás un correo con el enlace de descarga del PDF con los +100 mapas mentales.",
            icon: Download,
          },
          {
            question: "¿Necesito saber Hangul para usarlos?",
            answer:
              "No. Cada mapa incluye la escritura en Hangul y la pronunciación adaptada al español, así que puedes empezar desde cero.",
            icon: Globe,
          },
          {
            question: "¿Cuál es la política de reembolso?",
            answer:
              "Cuentas con una garantía de satisfacción de 7 días. Si el material no es para ti, te devolvemos el 100% de tu dinero.",
            icon: Shield,
          },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Todo sobre los +100 Mapas Mentales de Coreano"
      />

      <Footer />
      <WhatsAppButton url="https://wa.link/ghi4rw" label="¿Dudas?" />
      <ScrollToTop showAfter={500} />

      <StickyBuyBar
        price={displayPrice}
        currencyCode={currencyLabel}
        flag={displayFlag}
        productName="+100 Mapas Mentales de Coreano"
        ctaText="Comprar ahora"
        buyUrl={TIENDA_CHECKOUT_PATH}
        onBuyClick={handleBuy}
        rating={4.9}
        reviewCount={86}
        lang="es"
      />
      <div className="h-28 md:h-24" aria-hidden />
    </main>
  );
};

export default ProductCoreano100Mapas;
