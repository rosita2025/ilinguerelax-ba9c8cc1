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
import { FAQ } from "@/components/FAQ";
import SalesNotification from "@/components/SalesNotification";
import { LiveViewers } from "@/components/LiveViewers";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProductReviews } from "@/components/ProductReviews";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Star, Check, BookOpen, ArrowRight, ShoppingCart, Gift, User, Smartphone, FileText, GraduationCap, Lightbulb, CreditCard, Zap, Sparkles, Shield } from "lucide-react";
import { motion } from "framer-motion";

const product1000VerbosImage = "/images/product-1000-verbos.webp";
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProductCrossSell } from "@/components/ProductCrossSell";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { PinterestSave } from "@/components/PinterestSave";
import { PaymentLogos } from "@/components/checkout/PaymentLogos";

const HOTMART_URL = "https://pay.hotmart.com/T102978081M?bid=1775682831595";
const ADMIN_SKU_1000_VERBOS = "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion";

const CART_ITEM_BASE = {
  id: "1000-verbos-ingles",
  name: "Inglés Relax · 1,000 Verbos Esenciales (Digital PDF)",
  image: product1000VerbosImage,
  description: "1,000 verbos en presente, pasado y futuro con pronunciación",
};

const features = [
  "1,000 verbos esenciales más utilizados en inglés",
  "Conjugaciones en Presente, Pasado y Futuro",
  "Pronunciación adaptada para hispanohablantes",
  "Ejemplos prácticos de uso cotidiano",
  "Organizado por frecuencia de uso",
  "Significado en español de cada verbo",
  "Entrega digital inmediata",
  "Acceso de por vida",
];

const Product1000Verbos = () => {
  const pricing = useAdminPricing(ADMIN_SKU_1000_VERBOS);
  const tier = useCountryTierRouting(ADMIN_SKU_1000_VERBOS, { tiendaPath: "/checkouts/1000-verbos" });
  const currentPrice = tier.priceUsd;
  const pricingReady = tier.loaded;
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const clear = useCheckoutPruebaStore((s) => s.clear);
  const { country } = useRegionTier();
  const isPeru = tier.isPeru;
  const cartItem = { 
    ...CART_ITEM_BASE, 
    price: currentPrice, 
    pricePen: tier.pricePen ?? undefined,
    localUsdPrices: tier.localUsdPrices ?? undefined 
  };

  const pixelParams = useMemo(() => ({
    content_name: "Inglés Relax - 1,000 Verbos Esenciales",
    content_category: "Digital Book",
    content_ids: ["product-1000-verbos"],
    content_type: "product",
    value: currentPrice,
    currency: "USD",
  }), [currentPrice]);
  useHotmartPixel(pixelParams);

  const handleBuy = () => {
    if (!pricingReady) return;
    trackHotmartEvent("AddToCart", {
      content_name: "Inglés Relax - 1,000 Verbos Esenciales",
      content_category: "Digital Book",
      content_ids: ["product-1000-verbos"],
      content_type: "product",
      value: currentPrice,
      currency: "USD",
      num_items: 1,
    });
    addItem({ ...cartItem, quantity: 1 });
    toast.success("Producto agregado al carrito");
    navigate("/checkouts/1000-verbos");
  };

  const handleAddToCart = () => {
    if (!pricingReady) return;
    addItem({ ...cartItem, quantity: 1 });
    toast.success("Producto agregado al carrito", {
      description: "Puedes seguir explorando o ir al checkout.",
      action: {
        label: "Ir al checkout",
        onClick: () => navigate("/checkouts/1000-verbos"),
      },
    });
  };




  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={pricing.name ?? "1,000 Verbos en Inglés PDF con Pronunciación"}
        description={pricing.description ?? "1,000 verbos esenciales en inglés en presente, pasado y futuro con pronunciación en español. PDF descargable al instante. Desde $10 USD."}
        canonicalUrl="https://ilinguerelax.com/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion"
        image={pricing.coverImageUrl ?? "https://ilinguerelax.com/og-image.png"}
        type="product"
        price="10"
        originalPrice="54"
        rating="4.8"
        reviewCount="350"
        sku="ILINGUE-1000-VERBOS"
        keywords="1000 verbos en inglés, verbos en inglés pdf, lista de verbos en inglés con pronunciación, verbos irregulares en inglés, verbos regulares en inglés, verbos en inglés presente pasado futuro, aprender verbos en inglés para hispanohablantes, conjugación de verbos en inglés, verbos en inglés más usados, ebook verbos inglés"
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
                  src={product1000VerbosImage}
                  alt="Inglés Relax - 1,000 Verbos Esenciales"
                  className="w-full h-auto rounded-2xl shadow-hero"
                />
                <PinterestSave 
                  overlay 
                  media={product1000VerbosImage}
                  url="https://ilinguerelax.com/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion"
                  description={pricing.description || "1,000 verbos esenciales en inglés en presente, pasado y futuro con pronunciación en español."}
                />
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
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {pricing.name ?? "1,000 Verbos Esenciales en Inglés: Presente, Pasado y Futuro con Pronunciación"}
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
                <span className="font-bold text-foreground">4.8/5</span>
                <span className="text-muted-foreground">(350+ Reseñas Verificadas)</span>
              </div>

              <div className="mb-4">
                <PurchaseCounter baseCount={350} lang="es" />
              </div>

              <div className="mb-4">
                <LiveViewers minViewers={12} maxViewers={30} />
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
                <StockCounter totalStock={50} remainingStock={15} lang="es" />
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mb-3 text-lg py-6 shadow-2xl relative overflow-hidden group"
                  onClick={handleBuy}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  ¡QUIERO COMPRAR AHORA!
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </motion.div>

              {isPeru && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full mb-4 text-base py-5 border-2"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Agregar al carrito
                  </Button>
                </motion.div>
              )}

              <p className="text-center text-sm text-muted-foreground mb-6">
                👆 Haz clic para asegurar tu copia al precio de oferta
              </p>

              <div className="mb-6 flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pagos Seguros:</span>
                <PaymentLogos />
              </div>

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
              1,000 Verbos con{" "}
              <span className="text-gradient">Pronunciación Hispanohablante</span>
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Domina los verbos más importantes en presente, pasado y futuro
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
          { question: "¿Qué incluye este libro?", answer: "Incluye 1,000 verbos esenciales en inglés conjugados en presente, pasado y futuro con pronunciación adaptada para hispanohablantes.", icon: BookOpen },
          { question: "¿Es un libro físico o digital?", answer: "Es un producto digital (PDF) con descarga inmediata. Puedes imprimirlo en casa si lo deseas.", icon: Smartphone },
          { question: "¿Necesito saber inglés para usarlo?", answer: "No. Puedes empezar desde cero. Cada verbo incluye su significado en español y pronunciación adaptada.", icon: Lightbulb },
          { question: "¿Cómo realizo el pago?", answer: "Al presionar Comprar Ahora se agrega al carrito y vas al checkout seguro donde puedes pagar con tarjeta (Stripe), transferencias, Yape/Plin o efectivo.", icon: CreditCard },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre 1,000 Verbos Esenciales"
      />

      <ComparisonTable />

      <Footer />

      <StickyBuyBar
        sku={ADMIN_SKU_1000_VERBOS}
        price={tier.priceLabel}
        originalPrice={tier.originalLabel}
        productName="INGLÉS RELAX - 1,000 Verbos Esenciales (Digital PDF)"
        rating={4.8}
        reviewCount={350}
        showReviews={true}
        currencyCode={tier.currencyCode}
        flag={tier.isPeru ? "🇵🇪" : undefined}
        onBuyClick={handleBuy}
        usdValue={currentPrice}
        localUsdPrices={tier.localUsdPrices}
      />

      <div className="h-20 md:h-16" />

      <SalesNotification />
<WhatsAppButton />
      <ScrollToTop showAfter={500} />
    </main>
  );
};

export default Product1000Verbos;
