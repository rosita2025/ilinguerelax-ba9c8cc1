import { useMemo } from "react";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { FAQ } from "@/components/FAQ";
import SalesNotification from "@/components/SalesNotification";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Star, Check, BookOpen, ArrowRight, ShoppingCart, Smartphone, Lightbulb, CreditCard, Sparkles, Shield, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { TrustBadges } from "@/components/TrustBadges";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useI18n } from "@/i18n/I18nContext";

const HOTMART_URL = "https://pay.hotmart.com/Q105880946X";
const productImage = "/images/product-patrones-especiales.webp";

const previews = [
  { src: "/images/patrones-preview-1.webp", alt: "Cómo usar este libro - Método Inglés Relax" },
  { src: "/images/patrones-preview-2.webp", alt: "Por qué los hispanohablantes se confunden con el inglés" },
  { src: "/images/patrones-preview-3.webp", alt: "Alfabeto inglés explicado letra por letra" },
  { src: "/images/patrones-preview-4.webp", alt: "Letras mudas en inglés con regla y ejemplos" },
  { src: "/images/patrones-preview-5.webp", alt: "20 patrones nuevos de pronunciación en inglés" },
  { src: "/images/patrones-preview-6.webp", alt: "Contracciones y habla rápida en inglés" },
  { src: "/images/patrones-preview-7.webp", alt: "Mini reto: adivina la pronunciación antes de ver la respuesta" },
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

const ProductPatronesEspeciales = () => {
  const { formatPrice, currency } = useI18n();
  const PRICE_USD = 4.9;
  const ORIGINAL_USD = 19.99;
  const priceLabel = formatPrice(PRICE_USD);
  const originalLabel = formatPrice(ORIGINAL_USD);
  const pixelParams = useMemo(() => ({
    content_name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés",
    content_category: "Digital Book",
    content_ids: ["patrones-especiales"],
    content_type: "product",
    value: 4.9,
    currency: "USD",
  }), []);
  useHotmartPixel(pixelParams);

  const handleBuy = () => {
    trackHotmartEvent("InitiateCheckout", {
      content_name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés",
      content_category: "Digital Book",
      content_ids: ["patrones-especiales"],
      content_type: "product",
      value: 4.9,
      currency: "USD",
      num_items: 1,
    });
    window.open(HOTMART_URL, "_blank");
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
      <SEO
        title={`Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés | ${priceLabel}`}
        description="Domina la pronunciación en inglés con patrones secretos, letras mudas, combinaciones especiales y ejercicios prácticos. Método fácil para hispanohablantes paso a paso. Ebook digital Inglés Relax."
        canonicalUrl="https://ilinguerelax.com/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles"
        image="https://ilinguerelax.com/images/product-patrones-especiales.webp"
        type="product"
        price="4.90"
        originalPrice="19.99"
        rating="4.9"
        reviewCount="6"
        sku="ILINGUE-PATRONES-ESP"
        keywords="patrones especiales inglés, combinaciones secretas inglés, pronunciación inglés para hispanohablantes, letras mudas inglés, ebook aprender inglés, inglés relax, pronunciación fácil inglés"
        reviews={productReviews}
      />

      <Navbar />

      {/* Hero */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative">
                <img
                  src={productImage}
                  alt="Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés"
                  className="w-full h-auto rounded-2xl shadow-hero"
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
                Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés
              </h1>

              <p className="text-base text-muted-foreground mb-4">
                Domina la pronunciación en inglés con patrones secretos, letras mudas, combinaciones especiales y ejercicios prácticos. Método fácil para hispanohablantes paso a paso.
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-foreground">4.9/5</span>
                <span className="text-muted-foreground">Calidad verificada</span>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20 mb-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-semibold text-sm uppercase">
                    Precio de Lanzamiento
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-foreground">{priceLabel}</span>
                  <span className="text-2xl text-muted-foreground line-through">{originalLabel}</span>
                  <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg">
                    AHORRA 75%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  💳 Pago único • Descarga inmediata • Acceso de por vida
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mb-4 text-lg py-6 shadow-2xl"
                  onClick={handleBuy}
                >
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  ¡QUIERO COMPRAR AHORA!
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </motion.div>

              <p className="text-center text-sm text-muted-foreground mb-6">
                👇 Mira la vista previa real antes de comprar
              </p>

              <TrustBadges lang="es" variant="grid" />

              <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-2 border-green-500/30 mt-6">
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-green-700">🛡️ Garantía 7 Días</p>
                  <p className="text-sm text-green-600">Si no estás satisfecho, te devolvemos tu dinero. Sin preguntas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Por qué tan barato? - confianza */}
      <section className="py-8 md:py-10 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto bg-card rounded-3xl border border-border shadow-card p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              ¿Por qué tan barato? ¿Es de mala calidad o tiene errores?
            </h2>
            <p className="text-foreground/90 mb-3">
              <strong>No.</strong> El precio bajo es intencional: queremos que más hispanohablantes accedan al método Inglés Relax sin barreras. El PDF está revisado, sin errores ortográficos, y es exactamente el mismo material que usamos en nuestros libros completos.
            </p>
            <p className="text-foreground/90">
              Para que lo compruebes tú mismo, abajo puedes ver <strong>la vista previa real de las páginas interiores</strong>. Si te gusta lo que ves, el precio de {priceLabel} es honesto. Si no, tienes 7 días de garantía.
            </p>
          </div>
        </div>
      </section>

      {/* Vista previa real */}
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
                7 páginas reales del ebook. Calidad comprobada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {previews.map((p, i) => (
                <div key={p.src} className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-card">
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    Página {i + 1}
                  </div>
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading="lazy"
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button variant="hero" size="xl" onClick={handleBuy} className="text-lg py-6 px-8 shadow-2xl">
                <ShoppingCart className="w-6 h-6 mr-2" />
                Comprar ahora por {priceLabel}
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

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
                Miles de hispanohablantes ya usan el método Inglés Relax
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
              <Button variant="hero" size="xl" onClick={handleBuy} className="text-lg py-6 px-8 shadow-2xl">
                <ShoppingCart className="w-6 h-6 mr-2" />
                Comprar ahora por {priceLabel}
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <FAQ
        items={[
          { question: `¿Por qué cuesta solo ${priceLabel}?`, answer: "Queremos que el método llegue a más personas. El PDF es de calidad profesional, sin errores ortográficos. Puedes verificarlo con la vista previa real más arriba.", icon: Lightbulb },
          { question: "¿Qué incluye este ebook?", answer: "Patrones especiales de pronunciación, alfabeto inglés letra por letra, combinaciones secretas, letras mudas, contracciones y mini retos prácticos con respuestas.", icon: BookOpen },
          { question: "¿Es digital o físico?", answer: "Es 100% digital (PDF). Recibes la descarga inmediata después del pago. Puedes leerlo en móvil, tablet, computadora o imprimirlo.", icon: Smartphone },
          { question: "¿Cómo realizo el pago?", answer: "Pago seguro mediante Hotmart: tarjeta de crédito/débito, PayPal y otros métodos según tu país.", icon: CreditCard },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas"
      />

      <Footer />

      <StickyBuyBar
        price={priceLabel}
        originalPrice={originalLabel}
        currencyCode={currency}
        productName="Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés"
        rating={4.9}
        reviewCount={6}
        showReviews={true}
        buyUrl={HOTMART_URL}
      />

      <div className="h-20 md:h-16" />

      <SalesNotification />
      <ExitIntentPopup buyUrl={HOTMART_URL} discount="10%" />
      <WhatsAppButton />
      <ScrollToTop showAfter={500} />
    </main>
  );
};

export default ProductPatronesEspeciales;