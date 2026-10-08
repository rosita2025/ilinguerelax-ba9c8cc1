import { prefetchCheckoutProduct } from "@/lib/checkoutProductCache";
import { useMemo, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { FAQ } from "@/components/FAQ";
import SalesNotification from "@/components/SalesNotification";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Star, Check, BookOpen, ArrowRight, ShoppingCart, Smartphone, Lightbulb, CreditCard, Sparkles, Shield, Eye, Music2, Download, Lock, FileText } from "lucide-react";
import { DigitalProductNotice } from "@/components/DigitalProductNotice";
import { PaymentLogos } from "@/components/checkout/PaymentLogos";
import { motion } from "framer-motion";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SpotifyLaunchBanner } from "@/components/SpotifyLaunchBanner";
import { SegundoBonoGramatica } from "@/components/SegundoBonoGramatica";
import { TercerBonoExamen } from "@/components/TercerBonoExamen";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { useRegionTier } from "@/hooks/useRegionTier";
import { detectCurrency, formatPrice, formatCurrencyAmount, exchangeRates, type Currency } from "@/i18n";
import { useLocalOverrides } from "@/lib/livePrices";
import { CheckoutLanguageProvider, useI18n } from "@/i18n/I18nContext";
import { UrgencyTimerBar } from "@/components/UrgencyTimerBar";
import { TikTokVideos } from "@/components/TikTokVideos";
import introVideo from "@/assets/introduccion-patrones-16x9.mp4.asset.json";
import introPoster from "@/assets/intro-patrones-poster.jpg.asset.json";

const TIENDA_CHECKOUT_PATH = "/checkouts/patrones-ingles";
// ÚNICA regla final para Patrones:
// Perú → tienda interna PEN. VE/CU/NI → tienda interna USD. Global → tienda interna USD.
// Solo LATAM permitido (sin PE/VE/CU/NI) usa Hotmart LATAM.
const TIENDA_USD_COUNTRIES = new Set(["VE", "CU", "NI"]);


const productImage = "/images/product-patrones-especiales.webp";

import patronesPreview1 from "@/assets/patrones-new/patrones-20-30.webp.asset.json";
import patronesPreview2 from "@/assets/patrones-new/patrones-letras-mudas.webp.asset.json";
import patronesPreview3 from "@/assets/patrones-new/patrones-sufijos.webp.asset.json";
import patronesPreview4 from "@/assets/patrones-new/patrones-contracciones.webp.asset.json";
import bono1000 from "@/assets/patrones-new/bono-1000-palabras.webp.asset.json";
import resenaMx1 from "@/assets/resena-mx1.webp.asset.json";
import resenaMx2 from "@/assets/resena-mx2.webp.asset.json";
import resenaMx3 from "@/assets/resena-mx3.webp.asset.json";
import resenaMx4 from "@/assets/resena-mx4.webp.asset.json";
import { PinterestSave } from "@/components/PinterestSave";
import { lightCoverUrl, disableImageTransform, readCachedCover, writeCachedCover } from "@/lib/coverImage";

const previews = [
  { src: patronesPreview1.url, alt: "20 patrones nuevos de pronunciación en inglés", caption: "20 patrones nuevos" },
  { src: patronesPreview2.url, alt: "Letras mudas en inglés con reglas y ejemplos", caption: "Letras mudas" },
  { src: patronesPreview3.url, alt: "Sufijos y prefijos en inglés con pronunciación adaptada", caption: "Sufijos y prefijos" },
  { src: patronesPreview4.url, alt: "Contracciones y habla rápida en inglés", caption: "Contracciones y habla rápida" },
];

const bonusPreviews = [
  { src: bono1000.url, alt: "1,000 palabras en inglés con pronunciación para hispanohablantes", caption: "1,000 palabras · pronunciación y fonética" },
];

const photoReviews = [
  { src: resenaMx1.url, flag: "🇲🇽", country: "México", alt: "Reseña real por WhatsApp desde México sobre Patrones Especiales" },
  { src: resenaMx2.url, flag: "🇲🇽", country: "México", alt: "Testimonio de cliente mexicano sobre el ebook" },
  { src: resenaMx3.url, flag: "🇲🇽", country: "México", alt: "Cliente de México comparte su experiencia" },
  { src: resenaMx4.url, flag: "🇵🇪", country: "Perú", alt: "Reseña real por WhatsApp desde Perú sobre la pronunciación" },
];

const features = [
  "Patrones especiales de pronunciación en inglés",
  "Alfabeto completo letra por letra",
  "Combinaciones secretas que cambian el sonido",
  "Letras mudas explicadas con reglas claras",
  "Contracciones y habla rápida nativa",
  "Mini retos prácticos con respuestas",
  "Método paso a paso para hispanohablantes",
  "Descarga digital inmediata (PDF)",
];

const PatronesContent = () => {
  const { t, currency, countryCode } = useI18n();
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  
  // Precarga el paquete de JS del checkout en segundo plano (mismo fix que
  // en ProductDynamic.tsx) para evitar la pantalla en blanco de 3-5s al
  // tocar "comprar".
  useEffect(() => {
    const prefetch = () => { import("@/pages/Checkout"); prefetchCheckoutProduct("patrones-especiales-alfabeto-combinaciones-secretas-ingles"); };
    const w = window as typeof window & { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(prefetch);
      return;
    }
    const timeoutId = window.setTimeout(prefetch, 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);
  const ADMIN_SKU = "patrones-especiales-alfabeto-combinaciones-secretas-ingles";
  const pricingAdmin = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, {
    tiendaPath: TIENDA_CHECKOUT_PATH,
  });

  const { isPeru, priceUsd: PRICE_USD, priceGlobalUsd: GLOBAL_USD, priceLatamUsd: LATAM_USD, priceTiendaUsd: TIENDA_USD, pricePen, country } = tier;
  const pricingReady = tier.loaded;
  const displayCurrency = tier.currencyCode as Currency;
  const priceLabel = tier.priceLabel;
  const originalLabel = tier.originalLabel;


  
  const hasLongPriceLabel = priceLabel.length > 9;

  // Imagen del producto: usa la portada configurada en el admin y,
  // si aún no carga o no existe, cae a la imagen local por defecto.
  // Mientras el admin responde no mostramos la imagen local pesada para
  // evitar descargar dos imágenes distintas (parpadeo y carga lenta).
  // La última portada vista se recuerda en el navegador: así, quien ya visitó
  // la página empieza a bajar la imagen sin esperar la respuesta del admin.
  const cachedCover = useMemo(() => readCachedCover(ADMIN_SKU), []);
  useEffect(() => {
    if (pricingAdmin.loaded) writeCachedCover(ADMIN_SKU, pricingAdmin.coverImageUrl);
  }, [pricingAdmin.loaded, pricingAdmin.coverImageUrl]);
  const heroImage = pricingAdmin.loaded
    ? (pricingAdmin.coverImageUrl ?? productImage)
    : cachedCover;
  const [heroFailed, setHeroFailed] = useState(false);
  const heroLight = heroFailed ? heroImage : lightCoverUrl(heroImage);
  const heroImageAbsolute = heroImage
    ? (heroImage.startsWith("http") ? heroImage : `https://ilinguerelax.com${heroImage}`)
    : `https://ilinguerelax.com${productImage}`;
  const cartImage = heroImage ?? productImage;
  
  const pixelParams = useMemo(() => ({
    content_name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés",
    content_category: "Digital Book",
    content_ids: [ADMIN_SKU],
    content_type: "product",
    value: PRICE_USD,
    currency: "USD",
  }), [PRICE_USD]);
  useHotmartPixel(pixelParams);

  const goToTienda = () => {
    if (!pricingReady) return;
    // El botón "LO QUIERO" y esta barra ya disparan AddToCart del pixel, así
    // que aquí se llama addItem() directo para no contar dos veces.

    addItem({
      id: "patrones-ingles",
      name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés (PDF)",
      price: PRICE_USD,
      regionPrices: {
        latam: LATAM_USD,
        global: GLOBAL_USD,
        tienda: TIENDA_USD
      },
      pricePen: pricingAdmin.pricePen ?? undefined,
      localUsdPrices: pricingAdmin.localUsdPrices ?? undefined,
      image: cartImage,
      description: "Alfabeto y combinaciones secretas de sonidos en inglés",
      quantity: 1,
    });
    navigate(TIENDA_CHECKOUT_PATH);
  };

  // Protección contra doble-toque (ver mismo fix en ProductDynamic.tsx).
  const buyClickedRef = useRef(false);
  const handleBuy = () => {
    if (!pricingReady) return;
    if (buyClickedRef.current) return;
    buyClickedRef.current = true;
    // AddToCart aquí — InitiateCheckout lo dispara Checkout.tsx al cargar
    // /checkouts/:slug (una sola vez con guard initiatedRef).
    trackHotmartEvent("AddToCart", {
      content_name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés",
      content_category: "Digital Book",
      content_ids: [ADMIN_SKU],
      content_type: "product",
      value: PRICE_USD,
      currency: "USD",
      num_items: 1,
    });
    goToTienda();
  };


  const productReviews = [
    {
      author: "María G.",
      rating: 5,
      text: "Por fin entiendo por qué el inglés se pronuncia diferente a como se escribe. Los patrones especiales me abrieron los ojos. Vale muchísimo más de lo que cuesta.",
      date: "2026-04-10",
    },
    {
      author: "Carlos R.",
      rating: 5,
      text: "Compré por curiosidad por el precio y me sorprendió la calidad. El alfabeto con sonidos reales y las letras mudas están explicadas clarísimo.",
      date: "2026-04-12",
    },
    {
      author: "Ana L.",
      rating: 5,
      text: "Llevaba años confundiéndome con la pronunciación. Este ebook con las combinaciones secretas me dio la confianza que necesitaba para hablar.",
      date: "2026-04-15",
    },
    {
      author: "Luis M.",
      rating: 5,
      text: "Los mini retos son geniales. No es teoría aburrida, es práctico y directo. Lo leí en una tarde y ya noto la diferencia al escuchar inglés.",
      date: "2026-04-18",
    },
    {
      author: "Diana S.",
      rating: 5,
      text: "Me encantó que incluya contracciones y habla rápida. Por fin entiendo lo que dicen en las películas sin subtítulos. Muy recomendado.",
      date: "2026-04-20",
    },
    {
      author: "Jorge H.",
      rating: 5,
      text: "Dudaba por el precio bajo, pero la vista previa me convenció. El PDF está bien editado, sin errores, y el método realmente funciona.",
      date: "2026-04-22",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <UrgencyTimerBar productSlug={ADMIN_SKU} language="es" />
      <SEO
        title={pricingAdmin.name ?? "Patrones y Pronunciación en Inglés PDF · A1 a C1"}
        description={pricingAdmin.description ?? "Domina la pronunciación en inglés: patrones secretos, letras mudas, combinaciones especiales y ejercicios prácticos. Ebook PDF para hispanohablantes."}
        canonicalUrl="https://ilinguerelax.com/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles"
        image={pricingAdmin.coverImageUrl ?? "https://ilinguerelax.com/images/product-patrones-especiales.webp"}
        type="product"
        price={PRICE_USD.toString()}
        originalPrice={(PRICE_USD * 2.5).toString()}
        rating={pricingAdmin.rating?.toString() ?? "4.9"}
        reviewCount={pricingAdmin.reviewCount?.toString() ?? "6"}
        sku={ADMIN_SKU}
        keywords="pronunciación en inglés, patrones de pronunciación inglés, letras mudas en inglés, combinaciones de letras inglés, alfabeto en inglés con pronunciación, cómo pronunciar en inglés, mejorar pronunciación inglés, fonética inglés para hispanohablantes, ebook pronunciación inglés pdf, contracciones en inglés"
        reviews={productReviews}
        faqItems={[
          { question: `¿Por qué cuesta solo ${tier.priceLabel}?`, answer: "Queremos que el método llegue a más personas. El PDF es de calidad profesional, sin errores ortográficos. Puedes verificarlo con la vista previa real más arriba." },
          { question: "¿Qué incluye este ebook?", answer: "Patrones especiales de pronunciación, alfabeto inglés letra por letra, combinaciones secretas, letras mudas, contracciones y mini retos prácticos con respuestas." },
          { question: "¿Es digital o físico?", answer: "Es 100% digital (PDF). Recibes la descarga inmediata después del pago. Puedes leerlo en móvil, tablet, computadora o imprimirlo." },
          { question: "¿Cómo realizo el pago?", answer: "Eliges tu método de pago en el checkout seguro, según tu país." },
        ]}
      />

      <Navbar />
      <SpotifyLaunchBanner />

      {/* Hero */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        {!pricingAdmin.active && (
          <div className="container px-4 md:px-6 mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-800">
              <Lock className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <span className="font-bold">Vista previa de Borrador:</span> Este producto está oculto para los clientes. Solo tú puedes verlo porque eres administrador.
              </div>
            </div>
          </div>
        )}
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative">
                {heroImage ? (
                  <img
                    src={heroLight ?? heroImage}
                    onError={() => {
                      // Si el servidor no soporta imágenes livianas, usa la original.
                      if (heroLight && heroLight !== heroImage) { disableImageTransform(); setHeroFailed(true); }
                    }}
                    alt="Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés"
                    className="w-full h-auto rounded-2xl shadow-hero"
                    width={1000}
                    height={1250}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                ) : (
                  <div className="w-full aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
                )}
                <PinterestSave 
                  overlay 
                  media={heroImageAbsolute}
                  url="https://ilinguerelax.com/products/patrones-de-estructuras-gramaticales-especiales-ingles-con-pronunciacion"
                  description="Domina patrones especiales y estructuras gramaticales en inglés con pronunciación adaptada."
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                  🆕 Nuevo Lanzamiento
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {pricingAdmin.name ?? "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés"}
              </h1>

              <p className="text-lg md:text-xl font-bold text-foreground mb-2">
                Deja de pronunciar el inglés como se escribe.
              </p>
              <p className="text-base text-muted-foreground mb-4">
                Descubre los patrones, letras mudas y combinaciones secretas que cambian el sonido de las palabras, y empieza a hablar con seguridad desde la primera lectura. Método paso a paso hecho para hispanohablantes.
              </p>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="font-bold text-sm sm:text-base text-foreground">
                  {pricingAdmin.rating != null ? pricingAdmin.rating.toFixed(1) : "4.9"}/5
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  ({pricingAdmin.reviewCount ?? 6} {t.product.verifiedReviews})
                </span>
              </div>

              <div className="mb-5 rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-400/15 to-amber-400/15 p-4 text-center shadow-lg">
                <p className="text-foreground font-extrabold text-base md:text-lg">
                  🎁 Hoy recibes el PDF + 3 BONOS GRATIS
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pago único · Sin suscripciones · Descarga inmediata
                </p>
              </div>



              <div className="mb-6 flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pagos Seguros:</span>
                <PaymentLogos />
              </div>




              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mb-2 text-lg py-6 shadow-2xl"
                  onClick={handleBuy}
                  disabled={!pricingReady}
                >
                  <ShoppingCart className="w-5 h-5 mr-2 shrink-0" />
                  {pricingReady ? `LO QUIERO • ${priceLabel}` : "LO QUIERO"}
                  <ArrowRight className="w-5 h-5 ml-2 shrink-0" />
                </Button>
              </motion.div>

              <p className="text-center text-xs text-muted-foreground mb-6">
                🔒 Pago seguro • ⬇️ Descarga inmediata • 🛡️ Garantía 7 días
              </p>




            </div>
          </div>
        </div>
      </section>

      {/* Subhero: qué recibes */}
      <section className="py-6 md:py-8 bg-primary/5 border-y border-primary/10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
              Un solo pago. <span className="text-gradient">4 materiales en tu correo.</span>
            </h2>
            <p className="text-muted-foreground mb-5">Todo en PDF, listo para leer en tu celular o imprimir.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
              {[
                { t: "Patrones Especiales", d: "El ebook principal con alfabeto, combinaciones y letras mudas" },
                { t: "Bono 1 · GRATIS", d: "1,000 palabras con pronunciación y fonética" },
                { t: "Bono 2 · GRATIS", d: "Estructuras gramaticales de cero a A2" },
                { t: "Bono 3 · GRATIS", d: "Examen de 98 preguntas con respuestas" },
              ].map((x) => (
                <div key={x.t} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <p className="text-sm font-extrabold text-foreground flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" />{x.t}</p>
                  <p className="text-xs text-muted-foreground mt-1">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dolores */}
      <section className="py-10 md:py-14">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-2">
              ¿Te pasa esto cuando <span className="text-gradient">hablas inglés</span>?
            </h2>
            <p className="text-center text-muted-foreground mb-6">Si dijiste sí a una sola, este ebook es para ti.</p>
            <div className="space-y-3">
              {[
                "Lees una palabra y no sabes cómo suena. Escribes una cosa y se pronuncia otra.",
                "Te da vergüenza hablar porque sientes que vas a pronunciar mal.",
                "No entiendes a los nativos: hablan rápido y se \"comen\" las palabras.",
                "Llevas meses o años estudiando y la pronunciación sigue sin mejorar.",
                "Las letras mudas y las combinaciones raras (gh, ough, tion) te confunden siempre.",
                "Has probado cursos largos y caros, pero nadie te explica el porqué de los sonidos.",
              ].map((x) => (
                <div key={x} className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <span className="text-lg leading-none mt-0.5">❌</span>
                  <p className="text-foreground text-sm md:text-base">{x}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-foreground font-bold text-lg mt-6">
              No es falta de talento. <span className="text-gradient">Es que nadie te enseñó los patrones.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-8 md:py-10 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-2">
              Lo que vas a <span className="text-gradient">lograr</span>
            </h2>
            <p className="text-center text-muted-foreground mb-6">Con los patrones correctos, pronunciar bien deja de ser suerte.</p>
            <div className="bg-card rounded-3xl border border-border shadow-card p-6 md:p-8">
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
            <div className="text-center mt-8">
              <Button variant="hero" size="xl" onClick={handleBuy} disabled={!pricingReady} className="w-full sm:w-auto max-w-full px-6 py-5 shadow-2xl">
                <ShoppingCart className="w-5 h-5 mr-2 shrink-0" />
                {pricingReady ? `LO QUIERO • ${priceLabel}` : "LO QUIERO"}
                <ArrowRight className="w-5 h-5 ml-2 shrink-0" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios 1: reseñas reales por WhatsApp */}
      <section className="py-10 md:py-14">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold mb-2">
                <Check className="w-3.5 h-3.5" /> Compras verificadas · WhatsApp 🇲🇽 🇵🇪
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Reseñas <span className="text-gradient">reales</span> de clientes
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {photoReviews.map((r, i) => (
                <figure key={`${r.src}-${i}`} className="relative rounded-xl overflow-hidden border border-border shadow-card bg-card">
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-background/90 text-foreground text-[11px] font-bold border border-border">
                    {r.flag} {r.country}
                  </div>
                  <img src={r.src} alt={r.alt} loading="lazy" className="w-full h-auto block" />
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Presentación del producto */}
      <section className="py-8 md:py-10 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
                <Music2 className="w-4 h-4" /> Presentación del producto
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Mira cómo <span className="text-gradient">funciona por dentro</span>
              </h2>
            </div>
            <div className="mb-6">
                <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-black">
                  <video
                    src={introVideo.url}
                    poster={introPoster.url}
                    className="w-full aspect-video object-cover"
                    controls
                    playsInline
                    preload="none"
                    controlsList="nodownload noplaybackrate noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
            </div>
            <TikTokVideos />
          </div>
        </div>
      </section>

      {/* Vista previa real */}
       <section id="vista-previa" className="py-10 md:py-14 scroll-mt-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
                <Eye className="w-4 h-4" /> Vista previa real del PDF
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Mira por dentro <span className="text-gradient">antes de comprar</span>
              </h2>
              <p className="text-muted-foreground">
                 4 páginas reales del ebook. Calidad comprobada.
              </p>
            </div>

            

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {previews.map((p, i) => (
                <figure key={p.src} className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-card">
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    Página {i + 1}
                  </div>
                   <div className="relative aspect-square bg-card overflow-hidden">
                    <img
                      src={p.src}
                      alt={p.alt}
                      loading="lazy"
                       decoding="async"
                       width={1254}
                       height={1254}
                       className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                  <figcaption className="p-3 text-sm font-semibold text-foreground text-center">
                    {p.caption}
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* Bono 1,000 palabras */}
            <div className="mt-14">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent text-sm font-bold mb-3">
                  <Sparkles className="w-4 h-4" /> Bono incluido GRATIS
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  + Bono: <span className="text-gradient">1,000 palabras en inglés</span> con pronunciación en español
                </h3>
                <p className="text-muted-foreground">
                  Vocabulario esencial organizado por temas (A1 a B2) con fonética UK/US adaptada.
                </p>
              </div>

              <div className="max-w-2xl mx-auto mb-6 rounded-2xl border border-[#1DB954]/30 bg-[#1DB954]/10 p-4 md:p-5 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center shadow-md">
                  <Music2 className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">
                    🎧 Audio disponible: escucha las 1,000 palabras en inglés en Spotify
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Podcast iLingue Relax · Gratis
                  </p>
                </div>
              </div>

               <div className="max-w-3xl mx-auto">
                {bonusPreviews.map((p, i) => (
                  <figure key={p.src} className="relative rounded-2xl overflow-hidden border border-accent/30 shadow-card bg-card">

                     <div className="relative aspect-square bg-card overflow-hidden">
                      <img
                        src={p.src}
                        alt={p.alt}
                        loading="lazy"
                         decoding="async"
                         width={1920}
                         height={1920}
                         className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>
                    <figcaption className="p-3 text-sm font-semibold text-foreground text-center">
                      {p.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">
                 El PDF completo se entrega tras la compra.
              </p>
            </div>

            <SegundoBonoGramatica />
            <TercerBonoExamen />




            <div className="text-center mt-8">
              <Button
                variant="hero"
                size="xl"
                onClick={handleBuy}
                 disabled={!pricingReady}
                className="w-full sm:w-auto max-w-full min-h-14 sm:min-h-[unset] px-4 sm:px-8 py-4 sm:py-6 shadow-2xl"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <span className="min-w-0 flex-1 text-center leading-tight">
                   <span className="block text-[15px] sm:text-lg font-extrabold">LO QUIERO</span>
                  <span className={`block tabular-nums ${hasLongPriceLabel ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
                     {pricingReady ? priceLabel : "Cargando precio…"}
                  </span>
                </span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios 2 */}
      <section className="py-10 md:py-14">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold mb-3">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Opiniones verificadas
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Lo que dicen <span className="text-gradient">nuestros lectores</span>
              </h2>
              <p className="text-muted-foreground">
                Lo que dicen quienes ya aprendieron los patrones
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  name: "María G.",
                  country: "México",
                  text: `Por fin entiendo por qué el inglés se pronuncia diferente a como se escribe. Los patrones especiales me abrieron los ojos. Vale muchísimo más de ${priceLabel}.`,
                  rating: 5,
                },
                {
                  name: "Carlos R.",
                  country: "Colombia",
                  text: "Compré por curiosidad por el precio y me sorprendió la calidad. El alfabeto con sonidos reales y las letras mudas están explicadas clarísimo.",
                  rating: 5,
                },
                {
                  name: "Ana L.",
                  country: "España",
                  text: "Llevaba años confundiéndome con la pronunciación. Este ebook con las combinaciones secretas me dio la confianza que necesitaba para hablar.",
                  rating: 5,
                },
                {
                  name: "Luis M.",
                  country: "Perú",
                  text: "Los mini retos son geniales. No es teoría aburrida, es práctico y directo. Lo leí en una tarde y ya noto la diferencia al escuchar inglés.",
                  rating: 5,
                },
                {
                  name: "Diana S.",
                  country: "Chile",
                  text: "Me encantó que incluya contracciones y habla rápida. Por fin entiendo lo que dicen en las películas sin subtítulos. Muy recomendado.",
                  rating: 5,
                },
                {
                  name: "Jorge H.",
                  country: "Argentina",
                  text: "Dudaba por el precio bajo, pero la vista previa me convenció. El PDF está bien editado, sin errores, y el método realmente funciona.",
                  rating: 5,
                },
              ].map((t) => (
                <div key={t.name} className="bg-card rounded-2xl border border-border shadow-card p-5 flex flex-col">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-foreground/90 text-sm leading-relaxed mb-4 flex-grow">"{t.text}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.country}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button
                variant="hero"
                size="xl"
                onClick={handleBuy}
                className="w-full sm:w-auto max-w-full min-h-14 sm:min-h-[unset] px-4 sm:px-8 py-4 sm:py-6 shadow-2xl"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <span className="min-w-0 flex-1 text-center leading-tight">
                  <span className="block text-[15px] sm:text-lg font-extrabold">Comprar ahora</span>
                  <span className={`block tabular-nums ${hasLongPriceLabel ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
                    por {priceLabel}
                  </span>
                </span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <FAQ
        items={[
          { question: "¿Qué recibo exactamente al comprar?", answer: "El ebook Patrones Especiales + 3 bonos GRATIS: 1,000 palabras con pronunciación, Estructuras Gramaticales de cero a A2 y un Examen de 98 preguntas con respuestas. Todo en PDF.", icon: Sparkles },
          { question: "¿Cómo recibo el material?", answer: "Inmediatamente después de pagar recibes un correo con tu enlace de descarga. Si no lo ves, revisa Spam o Promociones o escríbenos por WhatsApp y te ayudamos al momento.", icon: Download },
          { question: "¿Es seguro pagar aquí?", answer: "Sí. El pago se procesa en un checkout seguro y tienes garantía de 7 días.", icon: Shield },
          { question: "¿Es digital o físico?", answer: "Es 100% digital (PDF). Puedes leerlo en móvil, tablet o computadora, o imprimirlo.", icon: Smartphone },
          { question: "¿Sirve si soy principiante?", answer: "Sí. Está explicado paso a paso para hispanohablantes, con ejemplos claros y mini retos con respuestas.", icon: BookOpen },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas"
      />

      <Footer />

      <StickyBuyBar
        sku={ADMIN_SKU}
        goesToInternalCheckout={true}
        price={priceLabel}
        originalPrice={originalLabel}
        currencyCode={displayCurrency}
        usdValue={PRICE_USD}
        flag={tier.loaded ? (currency === "USD" ? "🇺🇸" : currency === "EUR" ? "🇪🇺" : currency === "GBP" ? "🇬🇧" : currency === "AUD" ? "🇦🇺" : currency === "CAD" ? "🇨🇦" : "🌎") : undefined}
        productName={pricingAdmin.name ?? "Patrones Especiales en Inglés"}
        rating={pricingAdmin.rating != null ? pricingAdmin.rating : 4.9}
        reviewCount={pricingAdmin.reviewCount != null ? pricingAdmin.reviewCount : 6}
        showReviews={true}
        onBuyClick={handleBuy}
        ctaText={pricingReady ? `LO QUIERO • ${priceLabel}` : "LO QUIERO"}
        isLoading={!pricingReady}
        localUsdPrices={pricingAdmin.localUsdPrices}
      />

      <div className="h-20 md:h-16" />

      <SalesNotification />
<WhatsAppButton url="https://wa.link/5ta2ea" label="¿Dudas?" />
      <ScrollToTop showAfter={500} />
    </main>
  );
};

// Patrones enseña inglés a hispanohablantes, también cuando compran desde EE. UU.
// El idioma solo se limita a esta página; el país y la moneda permanecen intactos.
const ProductPatronesEspeciales = () => (
  <CheckoutLanguageProvider language="es">
    <PatronesContent />
  </CheckoutLanguageProvider>
);

export default ProductPatronesEspeciales;