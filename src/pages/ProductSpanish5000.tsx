import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Loader2,
  Globe,
  Download,
  Zap,
} from "lucide-react";

// Product image
import productSpanish5000Image from "@/assets/product-spanish-5000.png";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleBuyNow = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-spanish-payment");
      
      if (error) {
        console.error("Payment error:", error);
        toast.error("Error creating payment session. Please try again.");
        return;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Digital eBook: 5,000 Spanish Words with English Pronunciation"
        description="Download instantly! 5,000 Spanish words with English pronunciation. PDF format, study anywhere. Special launch price."
        canonicalUrl="https://ilinguerelax.com/products/spanish-5000-words"
        type="product"
        price="29.99"
        rating="4.8"
        reviewCount="30"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-60 blur-3xl rounded-3xl" />
              <div className="relative">
                <img
                  src={productSpanish5000Image}
                  alt="Spanish Relax - 5,000 Words Digital eBook"
                  className="w-full h-auto rounded-2xl shadow-hero"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={8} maxViewers={22} lang="en" />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 text-sm font-medium mb-4">
                <Globe className="w-4 h-4" />
                <span>LEARN SPANISH - For English Speakers</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Spanish Relax - 5,000 Words
                <br />
                <span className="text-purple-600">With English Pronunciation</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                The complete stress-free method to learn Spanish. Digital PDF format - 
                download instantly and start learning today!
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-5xl font-bold text-foreground">$29.99</span>
                <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-bold">
                  LAUNCH PRICE
                </span>
              </div>

              {/* Delivery Info */}
              <div className="flex flex-wrap gap-4 mb-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-600" />
                  <span>Instant PDF download</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span>Start learning today</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span>Works on any device</span>
                </div>
              </div>

              {/* CTA */}
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full md:w-auto mb-4"
                onClick={handleBuyNow}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    BUY NOW
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground">
                🔒 100% secure payment • Instant download after purchase
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <CountdownTimer 
        hoursFromNow={48} 
        currentPrice="$29.99 USD"
        originalPrice="$40 USD"
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
                <span className="text-5xl font-bold text-foreground">$29.99</span>
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    BUY NOW
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
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
        price="$29.99"
        originalPrice="$40"
        productName="SPANISH RELAX - 5,000 Spanish Words (Digital PDF)"
        onBuyClick={handleBuyNow}
        ctaText="BUY NOW"
        disabled={false}
        showReviews={true}
        rating={4.8}
        reviewCount={30}
        isLoading={isLoading}
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
    </main>
  );
};

export default ProductSpanish5000;
