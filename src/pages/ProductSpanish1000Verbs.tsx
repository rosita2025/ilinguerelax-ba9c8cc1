import { useCartStore } from "@/stores/cartStore";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, ShoppingCart, Star, Check, Shield } from "lucide-react";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useCampaignPrice } from "@/hooks/useCampaignPrice";
import { useAdminPricing } from "@/hooks/useAdminPricing";

const productImage = "/images/product-spanish-1000-verbs.png";
const PRICE_FALLBACK = 12;

const features = [
  "1,000 essential Spanish verbs",
  "Conjugated in past, present & future",
  "English pronunciation guide",
  "Designed for English speakers",
  "Real-life usage examples",
  "Instant PDF download",
  "Study on any device",
  "Lifetime access",
];

const ProductSpanish1000Verbs = () => {
  const navigate = useNavigate();
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const pricing = useAdminPricing("1-000-verbs-in-spanish-past-present-future-with-english-pronunciation");
  const currentPrice = pricing.priceGlobalUsd ?? 0;
  const pricingReady = pricing.loaded && currentPrice > 0;
  const campaign = useCampaignPrice(currentPrice, 54);

  const handleBuyNow = () => {
    if (!pricingReady) return;
    // Route directly to internal checkout — Shopify is intentionally bypassed here
    // to avoid the phantom "Spanish Relax - 1,000 Verbs in Spanish" line item.
    setDrawerOpen(false);
    navigate("/checkouts/1000-verbos");
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={pricing.name ?? "1,000 Spanish Verbs PDF · English Pronunciation"}
        description={pricing.description ?? "Master 1,000 essential Spanish verbs in past, present and future with English pronunciation. Instant PDF download for English speakers."}
        canonicalUrl="https://ilinguerelax.com/products/1-000-verbs-in-spanish-past-present-future-with-english-pronunciation"
        image={pricing.coverImageUrl ?? "https://ilinguerelax.com/images/product-spanish-1000-verbs.png"}
        type="product"
        price={currentPrice.toFixed(2)}
        originalPrice="54"
        rating="4.8"
        reviewCount="0"
        sku="SPANISH-1000-VERBS"
        keywords="1000 Spanish verbs, Spanish verbs pdf, Spanish verb conjugation, learn Spanish verbs, most common Spanish verbs, Spanish verbs with English pronunciation, Spanish for English speakers, Spanish past present future, Spanish verbs ebook, Spanish Relax verbs"
      />
      <Navbar />

      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 opacity-60 blur-3xl rounded-3xl" />
              <div className="relative">
                <img src={productImage} alt="Spanish Relax - 1,000 Verbs Digital eBook" className="w-full h-auto rounded-2xl shadow-hero" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {pricing.name ?? (<>Spanish Relax - 1,000 Verbs in Spanish
                  <br />
                  <span className="text-blue-600">Past, Present & Future</span></>)}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {pricing.description ?? "The complete stress-free guide to master Spanish verbs. With English pronunciation. Digital PDF — download instantly!"}
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

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-2xl p-6 border border-blue-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600 font-semibold text-sm uppercase">Special Launch Price</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">
                  <span className={`${campaign.price.length > 7 ? 'text-3xl md:text-5xl' : 'text-5xl md:text-6xl'} font-black text-foreground`}>{campaign.price}</span>
                  <span className={`${campaign.price.length > 7 ? 'text-base md:text-2xl' : 'text-2xl'} text-muted-foreground line-through`}>{campaign.originalPrice}</span>
                  <span className="text-sm md:text-base text-muted-foreground font-semibold">{campaign.currency}</span>
                  <span className="px-3 py-1 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-xs md:text-sm font-bold shadow-lg">SAVE 78%</span>
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
      <WhatsAppButton />
      <ScrollToTop showAfter={500} />
    </main>
  );
};

export default ProductSpanish1000Verbs;
