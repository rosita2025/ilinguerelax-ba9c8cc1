import { prefetchCheckoutProduct } from "@/lib/checkoutProductCache";
import { useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { Star, Check, ArrowRight, ShoppingCart, Smartphone, Sparkles, Shield, Eye, Download, Lock } from "lucide-react";
import { PaymentLogos } from "@/components/checkout/PaymentLogos";
import { motion } from "framer-motion";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CompradoresReales } from "@/components/CompradoresReales";
import { PrecioEconomicoBanner } from "@/components/PrecioEconomicoBanner";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { type Currency } from "@/i18n";
import { useI18n } from "@/i18n/I18nContext";
import { UrgencyTimerBar } from "@/components/UrgencyTimerBar";
import { PinterestSave } from "@/components/PinterestSave";

const CIVIL_SKU = "1-000-palabras-ingles-mas-utilizadas-en-ingenieria-civil-n6mm";

const DEFAULT_NAME = "1,000 Palabras en Inglés Más Utilizadas en Ingeniería Civil";
const DEFAULT_DESCRIPTION =
  "Aprende las 1,000 palabras más utilizadas en Ingeniería Civil con un método práctico, claro y diseñado especialmente para estudiantes y profesionales hispanohablantes.";

const GENERIC_FEATURES = [
  "Contenido completo y organizado paso a paso",
  "Pronunciación adaptada para hispanohablantes",
  "Método práctico, claro y fácil de seguir",
  "Descarga digital inmediata (PDF)",
];

const CIVIL_FEATURES = [
  "Las 1,000 palabras más usadas en Ingeniería Civil",
  "Traducción al español de cada término",
  "Pronunciación adaptada para hispanohablantes",
  "Vocabulario organizado por temas de la carrera",
  "Ejemplos de uso en contexto real de obra",
  "Ideal para estudiantes y profesionales",
  "Método paso a paso, claro y práctico",
  "Descarga digital inmediata (PDF)",
];

const ProductInglesIngenieriaCivil = ({ sku }: { sku?: string } = {}) => {
  const params = useParams<{ slug: string }>();
  const ADMIN_SKU = sku ?? params.slug ?? CIVIL_SKU;
  const TIENDA_CHECKOUT_PATH = `/checkouts/${ADMIN_SKU}`;
  const CANONICAL_URL = `https://ilinguerelax.com/products/${ADMIN_SKU}`;
  const isCivil = ADMIN_SKU === CIVIL_SKU;
  const features = isCivil ? CIVIL_FEATURES : GENERIC_FEATURES;
  const { t, currency } = useI18n();
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  // Precarga el paquete de JS del checkout en segundo plano (mismo fix que
  // en ProductDynamic.tsx) para evitar la pantalla en blanco de 3-5s al
  // tocar "comprar".
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
  const tier = useCountryTierRouting(ADMIN_SKU, {
    tiendaPath: TIENDA_CHECKOUT_PATH,
  });

  const { priceUsd: PRICE_USD, priceGlobalUsd: GLOBAL_USD, priceLatamUsd: LATAM_USD, priceTiendaUsd: TIENDA_USD } = tier;
  const pricingReady = tier.loaded;
  const displayCurrency = tier.currencyCode as Currency;
  const priceLabel = tier.priceLabel;
  const originalLabel = tier.originalLabel;

  const hasLongPriceLabel = priceLabel.length > 9;

  // Imagen del producto: siempre la portada configurada en el admin de
  // productos. Mientras el admin responde mostramos un skeleton para evitar
  // parpadeos y descargas dobles.
  const heroImage = pricingAdmin.coverImageUrl ?? null;
  const heroImageAbsolute = heroImage
    ? (heroImage.startsWith("http") ? heroImage : `https://ilinguerelax.com${heroImage}`)
    : undefined;

  const productName = pricingAdmin.name ?? (isCivil ? DEFAULT_NAME : "");
  const productDescription = pricingAdmin.description ?? (isCivil ? DEFAULT_DESCRIPTION : "");

  // Vista previa real: las imágenes de galería configuradas en el admin.
  const galleryPreviews = (pricingAdmin.galleryImages ?? []).slice(0, 6);

  const pixelParams = useMemo(() => ({
    content_name: productName,
    content_category: "Digital Book",
    content_ids: [ADMIN_SKU],
    content_type: "product",
    value: PRICE_USD,
    currency: "USD",
  }), [PRICE_USD, productName]);
  useHotmartPixel(pixelParams);

  const addToCartItem = () => {
    addItem({
      id: ADMIN_SKU,
      name: `${productName} (PDF)`,
      price: PRICE_USD,
      regionPrices: {
        latam: LATAM_USD,
        global: GLOBAL_USD,
        tienda: TIENDA_USD,
      },
      pricePen: pricingAdmin.pricePen ?? undefined,
      localUsdPrices: pricingAdmin.localUsdPrices ?? undefined,
      image: heroImage ?? "/placeholder.svg",
      description: productDescription,
      quantity: 1,
    });
  };

  const goToTienda = () => {
    if (!pricingReady) return;
    // No llama a handleAddToCart() — ese dispara AddToCart del pixel, y si
    // el usuario llegó aquí vía StickyBuyBar, esa barra ya disparó AddToCart.
    addToCartItem();
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
      content_name: productName,
      content_category: "Digital Book",
      content_ids: [ADMIN_SKU],
      content_type: "product",
      value: PRICE_USD,
      currency: "USD",
      num_items: 1,
    });
    goToTienda();
  };

  const handleAddToCart = () => {
    if (!pricingReady) return;
    trackHotmartEvent("AddToCart", {
      content_name: productName,
      content_category: "Digital Book",
      content_ids: [ADMIN_SKU],
      content_type: "product",
      value: PRICE_USD,
      currency: "USD",
      num_items: 1,
    });
    addToCartItem();
    toast.success("Producto agregado al carrito", {
      description: "Puedes seguir explorando o ir al checkout.",
      action: {
        label: "Ir al checkout",
        onClick: () => navigate(TIENDA_CHECKOUT_PATH),
      },
    });
  };

  const productReviews = [
    {
      author: "María G.",
      rating: 5,
      text: "Por fin tengo el vocabulario técnico de ingeniería civil en inglés bien organizado. Me ayudó muchísimo con mis lecturas de la universidad.",
      date: "2026-04-10",
    },
    {
      author: "Carlos R.",
      rating: 5,
      text: "Compré por curiosidad por el precio y me sorprendió la calidad. Los términos vienen con pronunciación y ejemplos reales de obra.",
      date: "2026-04-12",
    },
    {
      author: "Ana L.",
      rating: 5,
      text: "Trabajo en construcción y necesitaba entender los manuales en inglés. Este PDF me dio la confianza que necesitaba.",
      date: "2026-04-15",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <UrgencyTimerBar productSlug={ADMIN_SKU} language="es" />
      <SEO
        title={pricingAdmin.name ?? "1,000 Palabras en Inglés de Ingeniería Civil PDF"}
        description={pricingAdmin.description ?? (isCivil ? DEFAULT_DESCRIPTION : "")}
        canonicalUrl={CANONICAL_URL}
        image={heroImageAbsolute}
        type="product"
        price={PRICE_USD.toString()}
        originalPrice={(PRICE_USD * 2.5).toString()}
        rating={pricingAdmin.rating?.toString() ?? "4.9"}
        reviewCount={pricingAdmin.reviewCount?.toString() ?? "6"}
        sku={ADMIN_SKU}
        keywords="inglés para ingeniería civil, vocabulario ingeniería civil en inglés, palabras técnicas ingeniería civil, inglés técnico construcción, diccionario ingeniería civil inglés español, ebook inglés ingeniería pdf"
        reviews={productReviews}
        faqItems={[
          { question: `¿Por qué cuesta solo ${tier.priceLabel}?`, answer: "Queremos que el método llegue a más personas. El PDF es de calidad profesional, sin errores ortográficos. Puedes verificarlo con la vista previa real más arriba." },
          { question: "¿Qué incluye este ebook?", answer: "Las 1,000 palabras más utilizadas en Ingeniería Civil con traducción al español, pronunciación adaptada y ejemplos de uso en contexto real." },
          { question: "¿Es digital o físico?", answer: "Es 100% digital (PDF). Recibes la descarga inmediata después del pago. Puedes leerlo en móvil, tablet, computadora o imprimirlo." },
          { question: "¿Cómo realizo el pago?", answer: "Según tu país: tienda interna de iLingue Relax o pago directo con tarjeta/transferencia." },
        ]}
      />

      <Navbar />

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
                    src={heroImage}
                    alt={productName}
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
                {heroImageAbsolute && (
                  <PinterestSave
                    overlay
                    media={heroImageAbsolute}
                    url={CANONICAL_URL}
                    description={productDescription}
                  />
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                  🆕 Nuevo Lanzamiento
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {productName}
              </h1>

              <p className="text-base text-muted-foreground mb-4">
                {productDescription}
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

              <PrecioEconomicoBanner />

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

              <p className="text-center text-xs text-muted-foreground mb-3">
                🔒 Pago seguro • ⬇️ Descarga inmediata • 🛡️ Garantía 7 días
              </p>

              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full mb-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
              >
                o agregar al carrito
              </button>

              {galleryPreviews.length > 0 && (
                <p className="text-center text-sm text-muted-foreground mb-6">
                  👇 Mira la vista previa real antes de comprar
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Vista previa real (imágenes de la galería del admin de productos) */}
      {galleryPreviews.length > 0 && (
        <section className="py-10 md:py-14">
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
                  Páginas reales del ebook. Calidad comprobada.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {galleryPreviews.map((src, i) => (
                  <figure key={src} className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-card">
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      Página {i + 1}
                    </div>
                    <div className="relative aspect-square bg-white overflow-hidden">
                      <img
                        src={src}
                        alt={`Vista previa ${i + 1} de ${productName}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <span className="text-3xl md:text-4xl font-black text-slate-900/10 -rotate-45 tracking-widest whitespace-nowrap select-none">
                          ilinguerelax.com
                        </span>
                      </div>
                    </div>
                  </figure>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Vistas previas con marca de agua. El PDF completo se entrega tras la compra.
              </p>

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
      )}

      {/* What's included */}
      <section className="py-8 md:py-10 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
              Lo que vas a <span className="text-gradient">aprender</span>
            </h2>
            <div className="bg-card rounded-3xl border border-border shadow-card p-8">
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

      {/* Testimonios y reseñas */}
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
                Estudiantes y profesionales ya usan el método Inglés Relax
              </p>
            </div>

            <CompradoresReales />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
              {[
                {
                  name: "María G.",
                  country: "México",
                  text: `Por fin tengo el vocabulario técnico de ingeniería civil en inglés bien organizado. Vale muchísimo más de ${priceLabel}.`,
                  rating: 5,
                },
                {
                  name: "Carlos R.",
                  country: "Colombia",
                  text: "Compré por curiosidad por el precio y me sorprendió la calidad. Los términos vienen con pronunciación y ejemplos reales de obra.",
                  rating: 5,
                },
                {
                  name: "Ana L.",
                  country: "Perú",
                  text: "Trabajo en construcción y necesitaba entender los manuales en inglés. Este PDF me dio la confianza que necesitaba.",
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
          { question: t.productFaq.specialTitle, answer: t.productFaq.specialAnswer, icon: Sparkles },
          { question: t.productFaq.receiveTitle, answer: t.productFaq.receiveAnswer, icon: Download },
          { question: t.productFaq.secureTitle, answer: t.productFaq.secureAnswer, icon: Shield },
          { question: "¿Es digital o físico?", answer: "Es 100% digital (PDF). Recibes la descarga inmediata después del pago. Puedes leerlo en móvil, tablet, computadora o imprimirlo.", icon: Smartphone },
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
        productName={productName}
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

export default ProductInglesIngenieriaCivil;
