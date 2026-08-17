import { motion } from "framer-motion";
import { ShoppingCart, Check, Smartphone, Download, Shield, ArrowRight, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useI18n } from "@/i18n/I18nContext";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { useAdminPricing } from "@/hooks/useAdminPricing";

const ProductComparisonSpanish = () => {
  const navigate = useNavigate();
  const { formatPrice, countryCode } = useI18n();
  const ADMIN_SKU = "5-000-spanish-words-with-english-pronunciation-digital";
  const pricing = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, {
    fallbackPriceGlobalUsd: 22,
    fallbackPriceLatamUsd: 19,
    fallbackPricePen: 45,
  });

  const shortTestimonials = [
    "Best Spanish book I've found!",
    "Finally understood Ser vs Estar.",
    "Fast delivery & secure payment.",
    "The pronunciation guide is a life saver!",
    "Perfect for A1 to C1 levels."
  ];

  const countryToFlag = (cc: string): string => {
    if (!cc || cc.length !== 2) return "🌍";
    const base = 0x1f1e6;
    const A = "A".charCodeAt(0);
    return String.fromCodePoint(
      base + cc.toUpperCase().charCodeAt(0) - A,
      base + cc.toUpperCase().charCodeAt(1) - A,
    );
  };
  const flag = countryToFlag(countryCode);

  const products = [
    {
      title: "Digital Edition",
      subtitle: "5,000 Spanish Words",
      price: 30,
      originalPrice: 43,
      description: "Perfect for studying on your phone, tablet or computer. Instant access to everything.",
      image: "/images/product-5000-spanish-digital.webp",
      url: "/products/5-000-words-spanish-with-pronunciation-english-nwna",
      features: [
        "5,000 words with pronunciation",
        "Essential A1-C1 Vocabulary",
        "Instant PDF Download",
        "7-Day Refund Guarantee",
        "Lifetime Updates FREE"
      ],
      cta: "GET DIGITAL — $30",
      popular: false
    },
    {
      title: "Physical + Digital",
      subtitle: "The Master Bundle",
      price: 44.00,
      originalPrice: 59,
      description: "The complete experience. A high-quality printed book for your shelf plus the digital version.",
      image: "/images/product-5000-spanish-physical.webp",
      url: "/products/5-000-spanish-words-with-english-pronunciation-physical",
      features: [
        "Everything in Digital Edition",
        "Premium Printed Book",
        "Digital PDF Version FREE",
        "Shipped to your door",
        "Best Value for money"
      ],
      cta: "GET BUNDLE — $44.00",
      popular: true
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      <SEO 
        title="Spanish 5,000 Words · Choose Your Edition"
        description="Choose between the Digital PDF edition ($30) or the Physical Book + Digital Bundle ($44.00). Master 5,000 Spanish words with English pronunciation."
      />
      <Navbar />
      
      <section className="pt-20 pb-16 px-4">
        <div className="container max-w-6xl mx-auto text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-6"
          >
            Start Speaking Spanish <span className="text-primary">Today</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Choose the version that best fits your learning style. Both include the complete 5,000-word system with English pronunciation.
          </motion.p>
        </div>

        <div id="comparison-cards" className="container max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          {products.map((product, i) => (
            <motion.div
              key={product.url}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                product.popular 
                ? "border-primary bg-primary/5 shadow-lg z-10" 
                : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {product.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-black rounded-full shadow-md">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-xl font-black mb-1">{product.title}</h2>
                <p className="text-muted-foreground text-sm font-bold">{product.subtitle}</p>
              </div>

              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-3xl font-black">${product.price}</span>
                <span className="text-lg line-through text-muted-foreground opacity-70">${product.originalPrice}</span>
              </div>

              <p className="text-muted-foreground mb-6 text-xs leading-relaxed">
                {product.description}
              </p>

              <ul className="space-y-4 mb-10 flex-grow">
                {product.features.map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate(product.url)}
                size="xl"
                className={`w-full py-8 text-lg font-black rounded-2xl shadow-lg transition-transform active:scale-95 ${
                  product.popular ? "bg-primary text-primary-foreground" : "variant-outline"
                }`}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.cta}
              </Button>

              <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
                <span className="flex items-center gap-1"><Download className="w-3 h-3" /> Instant</span>
                <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Multi-device</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center max-w-3xl mx-auto px-4 py-12 rounded-[2.5rem] bg-muted/30 border border-border">
          <h3 className="text-2xl font-black mb-4">Not sure which one to pick?</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The <strong>Master Bundle</strong> is our customers' favorite because it gives you the best of both worlds: a real book to study at home and a digital copy to carry in your pocket. Plus, shipping is worldwide!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex shrink-0">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-emerald-500">★</span>
                ))}
              </div>
              <span className="text-sm font-bold">4.8/5 Rating</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <span className="text-sm font-bold">500+ Satisfied Learners</span>
          </div>
        </div>
      </section>

      <StickyBuyBar
        sku={ADMIN_SKU}
        productName="Spanish Mastery System · Select Edition"
        price={tier.priceLabel}
        originalPrice={tier.originalLabel}
        currencyCode={tier.currencyCode}
        flag={flag}
        usdValue={tier.priceUsd}
        localUsdPrices={pricing.localUsdPrices}
        onBuyClick={() => {
          const el = document.getElementById('comparison-cards');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        ctaText="CHOOSE EDITION"
        testimonials={shortTestimonials}
        lang="en"
        rating={4.8}
        reviewCount={500}
        calmMode
        dismissible
      />

      <Footer />
    </main>
  );
};

export default ProductComparisonSpanish;
