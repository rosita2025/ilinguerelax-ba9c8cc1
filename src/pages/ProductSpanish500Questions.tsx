import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, ShoppingCart, Star, Check, Shield } from "lucide-react";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { StickyBuyBar } from "@/components/StickyBuyBar";

import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { PinterestSave } from "@/components/PinterestSave";

const productImage = "/images/product-spanish-500-questions.webp";
const ORIGINAL_PRICE = 40;
const ADMIN_SKU = "500-questions-in-spanish-with-english-pronunciation";
const TIENDA_PATH = "/checkouts/500-questions-spanish";

const features = [
  "500 essential Spanish questions",
  "English pronunciation guide",
  "Real-life conversations",
  "Designed for English speakers",
  "Practical everyday situations",
  "Instant PDF download",
  "Study on any device",
  "Lifetime access",
];

const ProductSpanish500Questions = () => {
  const navigate = useNavigate();
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const pricing = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, { tiendaPath: TIENDA_PATH });
  const { useTiendaOnly, priceGlobalUsd, priceLatamUsd, priceTiendaUsd, pricePen, priceUsd: currentPrice } = tier;
  const pricingReady = tier.loaded;

  const handleBuyNow = () => {
    if (!pricingReady) return;
    addItem({
      id: "500-preguntas-spanish",
      name: pricing.name ?? "500 Questions in Spanish (Digital PDF)",
      price: currentPrice,
      pricePen: pricePen ?? undefined,
      regionPrices: { latam: priceLatamUsd, global: priceGlobalUsd, tienda: priceTiendaUsd },
      image: productImage,
      description: "500 real Spanish questions with English pronunciation",
      quantity: 1,
    });
    setDrawerOpen(false);
    navigate(TIENDA_PATH);
  };



  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="500 Spanish Questions PDF · English Pronunciation"
        description="Master 500 real Spanish questions with English pronunciation. Talk confidently at work, travel and daily life. Instant PDF download for English speakers."
        canonicalUrl="https://ilinguerelax.com/products/500-questions-in-spanish-with-english-pronunciation"
        image="https://ilinguerelax.com/images/product-spanish-500-questions.webp"
        type="product"
        price={currentPrice.toFixed(2)}
        originalPrice={String(ORIGINAL_PRICE)}

        rating="4.8"
        reviewCount="0"
        sku="SPANISH-500-QUESTIONS"
        keywords="500 Spanish questions, common Spanish questions, Spanish questions and answers, Spanish conversation questions, learn to speak Spanish, Spanish for travel, Spanish for English speakers, Spanish pronunciation guide, Spanish ebook pdf, Spanish Relax"
      />
      <Navbar />

      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-60 blur-3xl rounded-3xl" />
              <div className="relative">
                <img src={productImage} alt="Spanish Relax - 500 Questions Digital eBook" className="w-full h-auto rounded-2xl shadow-hero" />
                <PinterestSave overlay />
              </div>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Spanish Relax - 500 Questions in Spanish
                <br />
                <span className="text-blue-600">With English Pronunciation</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Speak Spanish with confidence in real-life situations. Digital PDF — download instantly!
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-foreground">4.8/5</span>
                <span className="text-muted-foreground">(New release)</span>
              </div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600 font-semibold text-sm uppercase">Special Launch Price</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">
                  <span className={`${tier.priceLabel.length > 7 ? 'text-3xl md:text-5xl' : 'text-5xl md:text-6xl'} font-black text-foreground`}>{tier.priceLabel}</span>
                  <span className={`${tier.priceLabel.length > 7 ? 'text-base md:text-2xl' : 'text-2xl'} text-muted-foreground line-through`}>{tier.originalLabel}</span>
                  <span className="text-sm md:text-base text-muted-foreground font-semibold">{tier.currencyCode}</span>
                  {tier.discountPercentage > 0 && (
                    <span className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold shadow-lg">SAVE {tier.discountPercentage}%</span>
                  )}

                </div>
                <p className="text-sm text-muted-foreground">💳 One-time payment • No subscription • Lifetime access</p>
              </motion.div>

              <Button variant="hero" size="xl" className="w-full mb-4 text-lg py-6 shadow-2xl" onClick={handleBuyNow}>
                <ShoppingCart className="w-6 h-6 mr-2" />
                ADD TO CART
              </Button>

              <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-2 border-green-500/30 mt-4">
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-green-700">🛡️ 100% Money-Back Guarantee — 7 Days</p>
                  <p className="text-sm text-green-600">Not satisfied? Get a full refund. No questions asked.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-8">What's Included</h2>
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
      </section>

      <Footer />

      <StickyBuyBar
        price={tier.priceLabel}
        originalPrice={tier.originalLabel}
        currencyCode={tier.currencyCode}
        flag={tier.isPeru ? "🇵🇪" : undefined}
        productName="500 Questions in Spanish with English Pronunciation"
        rating={4.8}
        reviewCount={0}
        showReviews={false}
        buyUrl={TIENDA_PATH}
        onBuyClick={handleBuyNow}
        ctaText={`GET IT NOW — ${tier.priceLabel}`}
        lang="en"
        calmMode
        dismissible
      />

      <div className="h-20 md:h-16" />

      <WhatsAppButton />
      <ScrollToTop showAfter={500} />

    </main>
  );
};

export default ProductSpanish500Questions;
