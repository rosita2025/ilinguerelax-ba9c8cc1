import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { FAQ } from "@/components/FAQ";
import SalesNotification from "@/components/SalesNotification";
import { LiveViewers } from "@/components/LiveViewers";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProductReviews } from "@/components/ProductReviews";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Star, Check, BookOpen, ArrowRight, ShoppingCart, MessageCircle, User, Smartphone, FileText, GraduationCap, Lightbulb, CreditCard, Zap, Sparkles, Shield } from "lucide-react";
import { motion } from "framer-motion";

const product500PreguntasImage = "/images/product-500-preguntas.webp";
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProductCrossSell } from "@/components/ProductCrossSell";
import { PinterestSave } from "@/components/PinterestSave";

const HOTMART_URL = "https://pay.hotmart.com/M102992330L";

const features = [
  "500 preguntas prácticas en inglés",
  "Pronunciación adaptada para hispanohablantes",
  "Situaciones reales del día a día",
  "Ideal para conversación y viajes",
  "Organizado por temas y contextos",
  "Respuestas modelo incluidas",
  "Entrega digital inmediata",
  "Acceso de por vida",
];

const ADMIN_SKU = "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes";
const CHECKOUT_PATH = "/checkouts/500-preguntas";

const CART_ITEM_BASE = {
  id: "500-preguntas-ingles",
  name: "Inglés Relax · 500 Preguntas en Inglés (Digital PDF)",
  image: product500PreguntasImage,
  description: "500 preguntas en inglés con pronunciación para hispanohablantes",
};

const Product500Preguntas = () => {
  const pricing = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, { tiendaPath: CHECKOUT_PATH });
  const currentPrice = tier.priceUsd;
  const pricingReady = tier.loaded;
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const isPeru = tier.isPeru;
  const cartItem = { ...CART_ITEM_BASE, price: currentPrice, pricePen: tier.pricePen ?? undefined };

  const pixelParams = useMemo(() => ({
    content_name: "Inglés Relax - 500 Preguntas en Inglés",
    content_category: "Digital Book",
    content_ids: ["product-500-preguntas"],
    content_type: "product",
    value: currentPrice,
    currency: "USD",
  }), [currentPrice]);
  useHotmartPixel(pixelParams);

  const handleBuy = () => {
    if (!pricingReady) return;
    trackHotmartEvent("AddToCart", {
      content_name: "Inglés Relax - 500 Preguntas en Inglés",
      content_category: "Digital Book",
      content_ids: ["product-500-preguntas"],
      content_type: "product",
      value: currentPrice,
      currency: "USD",
      num_items: 1,
    });
    addItem({ ...cartItem, quantity: 1 });
    toast.success("Producto agregado al carrito");
    navigate(CHECKOUT_PATH);
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={pricing.name ?? "500 Preguntas en Inglés PDF con Pronunciación"}
        description={pricing.description ?? "500 preguntas reales en inglés con pronunciación en español para conversar sin miedo en el trabajo, viajes y día a día. PDF descargable al instante."}
        canonicalUrl="https://ilinguerelax.com/products/500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes"
        image={pricing.coverImageUrl ?? "https://ilinguerelax.com/og-image.png"}
        type="product"
        price="10"
        originalPrice="54"
        rating="4.7"
        reviewCount="280"
        sku="ILINGUE-500-PREGUNTAS"
        keywords="preguntas en inglés, 500 preguntas en inglés, preguntas comunes en inglés, preguntas y respuestas en inglés, conversaciones en inglés, hablar inglés desde cero, inglés para viajar, inglés para entrevistas de trabajo, preguntas en inglés con pronunciación, ebook inglés conversacional"
      />

      <Navbar />

      {/* Hero Section */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative">
                <img
                  src={product500PreguntasImage}
                  alt="Inglés Relax - 500 Preguntas en Inglés"
                  className="w-full h-auto rounded-2xl shadow-hero"
                />
                <PinterestSave overlay />
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-sm font-bold border border-blue-500/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>🆕 NUEVO</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Habla sin miedo</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {pricing.name ?? "500 Preguntas en Inglés con Pronunciación para Hispanohablantes"}
              </h1>
              {pricing.description && (
                <p className="text-base text-muted-foreground mb-4">{pricing.description}</p>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-foreground">4.7/5</span>
                <span className="text-muted-foreground">(280+ Reseñas Verificadas)</span>
              </div>

              <div className="mb-4">
                <PurchaseCounter baseCount={280} lang="es" />
              </div>

              <div className="mb-4">
                <LiveViewers minViewers={10} maxViewers={25} />
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20 mb-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-semibold text-sm uppercase">
                    Precio Especial Por Tiempo Limitado
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span className="text-5xl md:text-6xl font-black text-foreground">
                    {pricingReady ? tier.priceLabel : "..."}
                  </span>
                  {pricingReady && (
                    <span className="text-2xl text-muted-foreground line-through">{tier.originalLabel}</span>
                  )}
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg"
                  >
                    AHORRA 60%
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">
                  💳 Pago único • Sin suscripciones • Acceso de por vida
                </p>
              </motion.div>

              <div className="mb-6">
                <StockCounter totalStock={50} remainingStock={18} lang="es" />
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mb-4 text-lg py-6 shadow-2xl relative overflow-hidden group"
                  onClick={handleBuy}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  ¡QUIERO COMPRAR AHORA!
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </motion.div>

              <p className="text-center text-sm text-muted-foreground mb-6">
                👆 Haz clic para asegurar tu copia al precio de oferta
              </p>


              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-2 border-green-500/30 mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-green-700">🛡️ Garantía de Devolución 100% - 7 Días</p>
                  <p className="text-sm text-green-600">Si no estás satisfecho, te devolvemos TODO tu dinero. Sin preguntas.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


      {/* What's Included */}
      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
              500 Preguntas para{" "}
              <span className="text-gradient">Hablar sin Miedo</span>
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Practica preguntas reales para situaciones cotidianas, viajes y trabajo
            </p>

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

      <ProductReviews productType="english" showReviewForm />

      <FAQ
        items={[
          { question: "¿Qué incluye este libro?", answer: "Incluye 500 preguntas prácticas en inglés organizadas por situaciones reales, con pronunciación adaptada para hispanohablantes.", icon: BookOpen },
          { question: "¿Es un libro físico o digital?", answer: "Es un producto digital (PDF) con descarga inmediata. Puedes imprimirlo en casa si lo deseas.", icon: Smartphone },
          { question: "¿Necesito saber inglés para usarlo?", answer: "No. Cada pregunta incluye su pronunciación en español para que puedas practicar desde cero.", icon: Lightbulb },
          { question: "¿Cómo realizo el pago?", answer: "Puedes pagar de forma segura mediante Hotmart, que acepta tarjetas de crédito/débito y otros métodos según tu país.", icon: CreditCard },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre 500 Preguntas en Inglés"
      />

      <ComparisonTable />

      <Footer />

      <StickyBuyBar
        sku={ADMIN_SKU}
        price={tier.priceLabel}
        originalPrice={tier.originalLabel}
        productName="INGLÉS RELAX - 500 Preguntas en Inglés (Digital PDF)"
        rating={4.7}
        reviewCount={280}
        showReviews={true}
        currencyCode={tier.currencyCode}
        flag={tier.isPeru ? "🇵🇪" : undefined}
        onBuyClick={handleBuy}
        usdValue={currentPrice}
      />

      <div className="h-20 md:h-16" />

      <SalesNotification />
<WhatsAppButton />
      <ScrollToTop showAfter={500} />
    </main>
  );
};

export default Product500Preguntas;
