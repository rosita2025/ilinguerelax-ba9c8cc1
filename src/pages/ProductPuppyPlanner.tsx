import { prefetchCheckoutProduct } from "@/lib/checkoutProductCache";
import { useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { FAQ } from "@/components/FAQ";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import {
  Star, Check, ArrowRight, ShoppingCart, Smartphone, Shield, Download,
  CalendarCheck, Bone, Stethoscope, Users, PawPrint,
} from "lucide-react";
import { DigitalProductNotice } from "@/components/DigitalProductNotice";
import { PaymentLogos } from "@/components/checkout/PaymentLogos";
import { motion } from "framer-motion";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { type Currency } from "@/i18n";

// ============================================================================
// PUPPY PLANNER — producto nuevo, contenido 100% original.
//
// SKU en el admin: debe coincidir EXACTO con este valor para que el checkout
// y los precios regionales funcionen. Créalo primero en /admin/productos.
// ============================================================================
const ADMIN_SKU = "puppy-planner";
const TIENDA_CHECKOUT_PATH = `/checkouts/${ADMIN_SKU}`;

// TODO: reemplaza esta ruta por tus propias fotos del producto (portada,
// vistas previas de las páginas, etc.). Súbelas en /admin/productos o a
// /public/images/ y actualiza estas rutas.
const productImage = "/images/product-puppy-planner.webp";

const features = [
  "Calendario de citas veterinarias",
  "Rastreador de alimentación diaria",
  "Registro de vacunas y desparasitación",
  "Control de paseos y ejercicio",
  "Notas de comportamiento y entrenamiento",
  "Lista de compras y suministros",
  "Hoja de información para paseadores o cuidadores",
  "Registro de gastos",
  "Descarga digital inmediata (PDF editable e imprimible)",
];

const ProductPuppyPlanner = () => {
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  // Precarga el checkout en segundo plano (mismo patrón que el resto del catálogo).
  useEffect(() => {
    const prefetch = () => { import("@/pages/Checkout"); prefetchCheckoutProduct(ADMIN_SKU); };
    const w = window as typeof window & { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(prefetch);
      return;
    }
    const timeoutId = window.setTimeout(prefetch, 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const pricingAdmin = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, { tiendaPath: TIENDA_CHECKOUT_PATH });

  const {
    priceUsd: PRICE_USD, priceGlobalUsd: GLOBAL_USD, priceLatamUsd: LATAM_USD,
    priceTiendaUsd: TIENDA_USD,
  } = tier;
  const pricingReady = tier.loaded;
  const displayCurrency = tier.currencyCode as Currency;
  const priceLabel = tier.priceLabel;
  const originalLabel = tier.originalLabel;
  const hasLongPriceLabel = priceLabel.length > 9;

  const pixelParams = useMemo(() => ({
    content_name: "Puppy Planner",
    content_category: "Digital Planner",
    content_ids: [ADMIN_SKU],
    content_type: "product",
    value: PRICE_USD,
    currency: "USD",
  }), [PRICE_USD]);
  useHotmartPixel(pixelParams);

  // No llama al AddToCart aquí — evita el duplicado si vino de StickyBuyBar
  // (mismo patrón usado en el resto del catálogo).
  const goToTienda = () => {
    if (!pricingReady) return;
    addItem({
      id: ADMIN_SKU,
      name: "Puppy Planner (PDF)",
      price: PRICE_USD,
      regionPrices: { latam: LATAM_USD, global: GLOBAL_USD, tienda: TIENDA_USD },
      pricePen: pricingAdmin.pricePen ?? undefined,
      localUsdPrices: pricingAdmin.localUsdPrices ?? undefined,
      image: productImage,
      description: "Sistema imprimible para organizar los primeros días de tu cachorro",
      quantity: 1,
    });
    navigate(TIENDA_CHECKOUT_PATH);
  };

  const buyClickedRef = useRef(false);
  const handleBuy = () => {
    if (!pricingReady) return;
    if (buyClickedRef.current) return;
    buyClickedRef.current = true;
    trackHotmartEvent("AddToCart", {
      content_name: "Puppy Planner",
      content_category: "Digital Planner",
      content_ids: [ADMIN_SKU],
      content_type: "product",
      value: PRICE_USD,
      currency: "USD",
      num_items: 1,
    });
    goToTienda();
  };

  return (
    <>
      <SEO
        title="Puppy Planner — Organiza los primeros días de tu cachorro"
        description="Sistema imprimible y editable con calendario de citas, alimentación, salud y rutinas para tu cachorro. Descarga digital inmediata."
        image={productImage}
      />
      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-black/95 to-background pt-10 pb-12 md:pt-16 md:pb-20">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="order-2 lg:order-1"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-semibold mb-4">
                  <PawPrint className="w-3.5 h-3.5" />
                  Nuevo · Sistema para cachorros
                </span>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
                  Organiza los primeros días de tu cachorro sin volverte loco
                </h1>

                <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                  Un sistema imprimible y editable con calendario de citas, alimentación,
                  salud y rutinas — todo en un solo lugar, fácil de compartir con toda la familia.
                </p>

                <ul className="space-y-2.5 mb-6">
                  {features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm md:text-base text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                  <span className={`font-bold text-foreground ${hasLongPriceLabel ? "text-2xl" : "text-3xl"}`}>
                    {pricingReady ? priceLabel : "…"}
                  </span>
                  {originalLabel && (
                    <span className="text-muted-foreground line-through text-sm sm:text-base">
                      {originalLabel}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button
                    size="lg"
                    onClick={handleBuy}
                    disabled={!pricingReady}
                    className="w-full sm:w-auto gap-2 text-base font-semibold"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Lo quiero
                    <span className="hidden sm:inline text-sm font-normal opacity-90">
                      {pricingReady ? `por ${priceLabel}` : "cargando…"}
                    </span>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-primary" />
                    Entrega inmediata por email
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Garantía de 7 días
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-primary" />
                    PDF imprimible y editable
                  </span>
                </div>

                <DigitalProductNotice className="max-w-md" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="order-1 lg:order-2 flex justify-center"
              >
                {/* TODO: reemplaza por tu propia foto del producto */}
                <div className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden border border-primary/10 bg-muted">
                  <img
                    src={productImage}
                    alt="Puppy Planner — sistema imprimible para cachorros"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Includes */}
        <section className="py-12 md:py-16 bg-background border-t border-border/50">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Qué incluye Puppy Planner
              </h2>
              <p className="text-muted-foreground">
                Todo lo que necesitas para el primer mes con tu cachorro
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                { icon: CalendarCheck, text: "Calendario de citas veterinarias" },
                { icon: Bone, text: "Rastreador de alimentación diaria" },
                { icon: Stethoscope, text: "Registro de vacunas y desparasitación" },
                { icon: PawPrint, text: "Control de paseos y ejercicio" },
                { icon: Users, text: "Hoja de info para paseadores/cuidadores" },
                { icon: Download, text: "Descarga digital inmediata (PDF)" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4"
                >
                  <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-foreground font-medium text-sm md:text-base pt-1">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / disclaimer */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4 mx-auto text-center max-w-2xl">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Basado en calificaciones de compradores verificados
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3">
              No reemplaza a tu veterinario — te ayuda a organizarte
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Puppy Planner es una herramienta de organización, no un consejo médico.
              Está pensado para que tengas todo en un solo lugar: fechas, notas y
              rutinas, listas para compartir con quien cuide a tu cachorro.
            </p>

            <Button
              size="lg"
              onClick={handleBuy}
              disabled={!pricingReady}
              className="gap-2"
            >
              Lo quiero por {pricingReady ? priceLabel : "…"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container px-4 mx-auto max-w-3xl">
            <FAQ
              title="Preguntas frecuentes"
              items={[
                {
                  question: "¿Qué recibo exactamente al comprar?",
                  answer: "Recibes un PDF editable e imprimible con todas las secciones de Puppy Planner: calendario de citas, rastreador de alimentación, registro de vacunas, control de paseos, notas de comportamiento y más.",
                },
                {
                  question: "¿Cómo se entrega el producto?",
                  answer: "Es una descarga digital. Inmediatamente después del pago recibes un email con el enlace seguro para descargar tu archivo. También puedes acceder desde /mi-descarga.",
                },
                {
                  question: "¿Puedo imprimirlo o usarlo en una tablet?",
                  answer: "Sí. El PDF está optimizado para imprimir en tamaño carta/A4 y también funciona perfectamente en tabletas con cualquier app de anotaciones.",
                },
                {
                  question: "¿Es un producto médico o veterinario?",
                  answer: "No. Puppy Planner es una herramienta de organización personal. Siempre consulta a tu veterinario de confianza para decisiones de salud de tu cachorro.",
                },
                {
                  question: "¿Qué métodos de pago aceptan?",
                  answer: "Aceptamos tarjeta de crédito/débito, Apple Pay, Google Pay, PayPal y métodos locales según tu país. El pago se procesa de forma segura.",
                },
              ]}
            />
          </div>
        </section>

        <PaymentLogos />
      </main>

      <StickyBuyBar
        sku={ADMIN_SKU}
        productName="Puppy Planner"
        price={tier.priceLabel}
        originalPrice={tier.originalLabel || undefined}
        currencyCode={tier.currencyCode}
        flag={tier.loaded ? (tier.currencyCode === "USD" ? "🇺🇸" : tier.currencyCode === "EUR" ? "🇪🇺" : tier.currencyCode === "GBP" ? "🇬🇧" : tier.currencyCode === "AUD" ? "🇦🇺" : tier.currencyCode === "CAD" ? "🇨🇦" : "🌎") : undefined}
        usdValue={PRICE_USD}
        localUsdPrices={pricingAdmin.localUsdPrices}
        buyUrl={undefined}
        onBuyClick={handleBuy}
        ctaText={`LO QUIERO — ${tier.priceLabel}`}
        lang="es"
        isPhysical={false}
        goesToInternalCheckout={true}
      />

      <Footer />
      <WhatsAppButton />
      <ScrollToTop />
    </>
  );
};

export default ProductPuppyPlanner;
