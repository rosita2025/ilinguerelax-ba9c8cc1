import { useMemo } from "react";
import { useSpanishRelaxPixel, trackSpanishRelaxEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { ProductReviews } from "@/components/ProductReviews";
import { CountdownTimer } from "@/components/CountdownTimer";
import { LiveViewers } from "@/components/LiveViewers";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import SalesNotification from "@/components/SalesNotification";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Check,
  BookOpen,
  Sparkles,
  ArrowRight,
  Brain,
  User,
  FileText,
  GraduationCap,
  Lightbulb,
  CreditCard,
  Globe,
  Download,
  Zap,
  Shield,
  ShoppingCart,
  Star,
} from "lucide-react";
import { WatermarkedImage } from "@/components/WatermarkedImage";

// Product image
import productSpanish5000Image from "@/assets/product-spanish-5000.png";

// Conversion components
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";
import { TrustBadges } from "@/components/TrustBadges";
import { VideoTestimonial } from "@/components/VideoTestimonial";
import { ScrollToTop } from "@/components/ScrollToTop";

const features = [
  "5,000+ essential Spanish words",
  "English pronunciation included",
  "Designed for English speakers",
  "No dictionary needed",
  "Stress-free step-by-step method",
  "UK & USA phonetics included",
  "Instant PDF download",
  "Study on any device",
];

const benefits = [
  {
    icon: Download,
    title: "Instant Download",
    description:
      "Get immediate access to your PDF right after purchase. Start learning Spanish in minutes!",
  },
  {
    icon: Zap,
    title: "Learn Anywhere",
    description:
      "Study on your phone, tablet, or computer. Your Spanish vocabulary is always with you.",
  },
  {
    icon: Sparkles,
    title: "Stress-Free Method",
    description:
      "Learn at your own pace with our relaxed methodology that respects your learning process.",
  },
  {
    icon: Brain,
    title: "No Dictionaries Needed",
    description:
      "Everything you need is included. Meanings, pronunciation, and examples all in one place.",
  },
];

const ProductSpanish5000 = () => {

  // Meta Pixel ViewContent event
  const pixelParams = useMemo(() => ({
    content_name: "Spanish Relax - 5,000 Words",
    content_category: "Digital Book",
    content_ids: ["product-spanish-5000"],
    content_type: "product",
    value: 17,
    currency: "USD",
  }), []);
  useSpanishRelaxPixel(pixelParams);

  const handleBuyNow = () => {
    // Track AddToCart event with Meta Pixel (with eventID for deduplication)
    trackSpanishRelaxEvent("AddToCart", {
      content_name: "Spanish Relax - 5,000 Words",
      content_category: "Digital Book",
      content_ids: ["product-spanish-5000"],
      content_type: "product",
      value: 17,
      currency: "USD",
      num_items: 1,
    });
    
    // Track InitiateCheckout event with Meta Pixel (with eventID for deduplication)
    trackSpanishRelaxEvent("InitiateCheckout", {
      content_name: "Spanish Relax - 5,000 Words",
      content_category: "Digital Book",
      content_ids: ["product-spanish-5000"],
      content_type: "product",
      value: 17,
      currency: "USD",
      num_items: 1,
    });
    
    // Open Stripe checkout in new tab
    window.open("https://buy.stripe.com/cNi00iexqdlz2mA1XL8IU07", "_blank");
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Digital eBook: 5,000 Spanish Words with English Pronunciation"
        description="Download instantly! 5,000 Spanish words with English pronunciation. PDF format, study anywhere. Special launch price."
        canonicalUrl="https://ilinguerelax.com/products/5-000-spanish-words-with-english-pronunciation"
        image="https://ilinguerelax.com/product-spanish-5000.png"
        type="product"
        price="17"
        originalPrice="54"
        rating="4.8"
        reviewCount="500"
        sku="SPANISH-5000"
        keywords="learn Spanish, Spanish vocabulary, Spanish for English speakers, Spanish pronunciation, digital Spanish book"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-60 blur-3xl rounded-3xl" />
              <div className="relative">
                <WatermarkedImage
                  src={productSpanish5000Image}
                  alt="Spanish Relax - 5,000 Words Digital eBook"
                  className="w-full h-auto rounded-2xl shadow-hero"
                  watermarkOpacity="high"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Trending & Bonus Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 text-sm font-bold border border-purple-500/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>🆕 NEW RELEASE</span>
                </motion.div>
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 text-sm font-medium"
                >
                  <Globe className="w-4 h-4" />
                  <span>For English Speakers</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Spanish Relax - 5,000 Words
                <br />
                <span className="text-purple-600">With English Pronunciation</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-4">
                The complete stress-free method to learn Spanish. Digital PDF format - 
                download instantly and start learning today!
              </p>

              {/* Reviews - More Prominent */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                </div>
                <span className="font-bold text-foreground">4.8/5</span>
                <span className="text-muted-foreground">(500+ Verified Reviews)</span>
              </div>

              {/* Purchase Counter - Social Proof */}
              <div className="mb-4">
                <PurchaseCounter baseCount={500} lang="en" />
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={8} maxViewers={22} lang="en" />
              </div>

              {/* Price Section - More Impactful */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20 mb-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-600 font-semibold text-sm uppercase">Special Launch Price</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$17</span>
                  <span className="text-2xl text-muted-foreground line-through">$54</span>
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold shadow-lg"
                  >
                    SAVE 69%
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">
                  💳 One-time payment • No subscriptions • Lifetime access
                </p>
              </motion.div>

              {/* Stock Counter - Scarcity */}
              <div className="mb-6">
                <StockCounter totalStock={50} remainingStock={15} lang="en" />
              </div>

              {/* CTA Button - More Impactful */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full mb-4 text-lg py-6 shadow-2xl bg-purple-600 hover:bg-purple-700"
                  onClick={handleBuyNow}
                >
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  BUY NOW!
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </motion.div>

              <p className="text-center text-sm text-muted-foreground mb-6">
                👆 Click to secure your copy at the discount price
              </p>

              {/* Trust Badges */}
              <TrustBadges lang="en" variant="grid" />

              {/* Money Back Guarantee - Enhanced */}
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
                  <p className="text-base font-bold text-green-700">🛡️ 100% Money-Back Guarantee - 7 Days</p>
                  <p className="text-sm text-green-600">If you're not satisfied, we'll refund ALL your money. No questions asked.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <CountdownTimer 
        hoursFromNow={48} 
        currentPrice="$17 USD"
        originalPrice="$54 USD"
        storageKey="countdown_spanish_book"
        lang="en"
      />

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose{" "}
              <span className="text-purple-600">Spanish Relax</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The easiest way to learn Spanish vocabulary
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-hero transition-all duration-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
              Everything Included
            </h2>

            <div className="bg-card rounded-3xl border border-border shadow-card p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <ProductReviews productType="spanish" />

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-purple-500">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Get Your Digital Copy Now!
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Instant download. Start learning Spanish today!
            </p>

            <div className="bg-card rounded-3xl shadow-hero p-8 mb-8">
              <div className="flex items-baseline justify-center gap-3 mb-4">
                <span className="text-5xl font-bold text-foreground">$17</span>
                <span className="text-2xl text-muted-foreground line-through">$54</span>
                <span className="text-purple-600 font-bold">USD</span>
              </div>
              <p className="text-muted-foreground mb-6">
                One-time payment • Instant PDF download • Lifetime access
              </p>
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full"
                onClick={handleBuyNow}
              >
                BUY NOW
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-sm text-white/70">
              🔒 100% secure payment • Satisfaction guaranteed
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ
        items={[
          {
            question: "Who is the author of this eBook?",
            answer: "SPANISH RELAX is a work by iLingue Relax, an educational brand focused on learning Spanish in a simple, practical, and stress-free way.",
            icon: User,
          },
          {
            question: "How do I receive the eBook?",
            answer: "Immediately after your purchase, you'll receive an email with a download link to your PDF. You can start studying right away!",
            icon: Download,
          },
          {
            question: "What format is the eBook?",
            answer: "The eBook is in PDF format, which works on any device - phone, tablet, computer, or e-reader.",
            icon: FileText,
          },
          {
            question: "Is it suitable for self-study?",
            answer: "Yes. SPANISH RELAX is designed for self-study, to learn at your own pace without pressure.",
            icon: GraduationCap,
          },
          {
            question: "Do I need to know Spanish before using this?",
            answer: "No. You can start from scratch, with no prior knowledge of Spanish.",
            icon: Lightbulb,
          },
          {
            question: "Does the eBook include pronunciation?",
            answer: "Yes. All 5,000 words include pronunciation adapted for English speakers with UK and USA phonetics.",
            icon: BookOpen,
          },
          {
            question: "How do I make the payment?",
            answer: "You can pay securely using an international credit or debit card. We accept Visa, Mastercard, American Express, and more.",
            icon: CreditCard,
          },
        ]}
        title="Frequently Asked Questions"
        subtitle="We answer your questions about the digital eBook"
      />

      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar
        price="$17"
        originalPrice="$54"
        productName="SPANISH RELAX - 5,000 Spanish Words (Digital PDF)"
        onBuyClick={handleBuyNow}
        ctaText="BUY NOW"
        disabled={false}
        showReviews={true}
        rating={4.8}
        reviewCount={30}
        lang="en"
      />

      {/* Spacer for sticky bar */}
      <div className="h-32 lg:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification 
        productName="Spanish 5,000 Words" 
        productLabel="5,000" 
        variant="international"
      />

      {/* Exit Intent Popup */}
      <ExitIntentPopup 
        onBuyClick={handleBuyNow}
        discount="15%"
        lang="en"
        storageKey="exit_intent_spanish"
      />

      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={500} />
    </main>
  );
};

export default ProductSpanish5000;
