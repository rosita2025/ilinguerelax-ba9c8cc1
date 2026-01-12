import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { CountdownTimer } from "@/components/CountdownTimer";
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
  Gift,
  Truck,
  Brain,
  User,
  FileText,
  GraduationCap,
  Lightbulb,
  CreditCard,
  Package,
  Loader2,
  Globe,
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
  "High-quality softcover book",
  "Between 250-300 pages",
];

const benefits = [
  {
    icon: BookOpen,
    title: "Premium Physical Book",
    description:
      "High-quality softcover, professional printing. Perfect for studying without screens and taking notes.",
  },
  {
    icon: Package,
    title: "Delivered to Your Door",
    description:
      "Receive your physical book directly at home. Shipping available to multiple countries.",
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
        title="Physical Book: 5,000 Spanish Words with English Pronunciation"
        description="Get the physical book of 5,000 Spanish words with English pronunciation. Premium softcover, home delivery. Special pre-order price."
        canonicalUrl="https://ilinguerelax.com/products/spanish-5000-words"
        type="product"
        price="29.99"
        rating="4.8"
        reviewCount="500"
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
                  alt="Spanish Relax - 5,000 Words Physical Book"
                  className="w-full h-auto rounded-2xl shadow-hero"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
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
                The complete stress-free method to learn Spanish, now in premium physical book format. 
                Perfect for studying without screens.
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-5xl font-bold text-foreground">$29.99</span>
                <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-bold">
                  PRE-ORDER PRICE
                </span>
              </div>

              {/* Delivery Info */}
              <div className="flex flex-wrap gap-4 mb-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Physical softcover book</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <span>Home delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-600" />
                  <span>Digital bonus included</span>
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
                🔒 100% secure payment • PDF version included
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
      />

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose the{" "}
              <span className="text-purple-600">Physical Book</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The best learning experience without screens
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

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-purple-500">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pre-order your physical book now!
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Special pre-order price. Shipping scheduled for June 2026.
            </p>

            <div className="bg-card rounded-3xl shadow-hero p-8 mb-8">
              <div className="flex items-baseline justify-center gap-3 mb-4">
                <span className="text-5xl font-bold text-foreground">$29.99</span>
                <span className="text-purple-600 font-bold">USD</span>
              </div>
              <p className="text-muted-foreground mb-6">
                One-time payment • Shipping included* • Digital PDF included
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
              <p className="text-xs text-muted-foreground mt-4">
                *Check shipping costs based on your location
              </p>
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
            question: "Who is the author of the book?",
            answer: "SPANISH RELAX is a work by iLingue Relax, an educational brand focused on learning Spanish in a simple, practical, and stress-free way.",
            icon: User,
          },
          {
            question: "When will I receive my physical book?",
            answer: "The physical book is on pre-order. Shipments are scheduled to begin in June 2026. You will receive email updates about your order status.",
            icon: Truck,
          },
          {
            question: "How many pages does the book have?",
            answer: "The book has between 250 and 300 pages of practical, organized, and easy-to-study content.",
            icon: FileText,
          },
          {
            question: "Does it include the digital version?",
            answer: "Yes. When you purchase the physical book on pre-order, you will immediately receive access to the digital version (PDF) so you can start studying while waiting for your book.",
            icon: Gift,
          },
          {
            question: "Do you ship internationally?",
            answer: "Yes, we ship to multiple countries. Shipping costs may vary depending on your location.",
            icon: Package,
          },
          {
            question: "Is it suitable for self-study?",
            answer: "Yes. SPANISH RELAX is designed for self-study, to learn at your own pace without pressure.",
            icon: GraduationCap,
          },
          {
            question: "Do I need to know Spanish before using the book?",
            answer: "No. You can start from scratch, with no prior knowledge of Spanish.",
            icon: Lightbulb,
          },
          {
            question: "Does the book include pronunciation?",
            answer: "Yes. All words include pronunciation adapted for English speakers.",
            icon: BookOpen,
          },
          {
            question: "How do I make the payment?",
            answer: "You can pay securely using an international credit or debit card.",
            icon: CreditCard,
          },
        ]}
        title="Frequently Asked Questions"
        subtitle="We answer your questions about the physical book"
      />

      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar
        price="$29.99"
        originalPrice="$40"
        productName="SPANISH RELAX v1.0 - 5,000 Spanish Words with English Pronunciation - Physical Book"
        onBuyClick={handleBuyNow}
        ctaText="BUY NOW"
        disabled={false}
        showReviews={false}
        isLoading={isLoading}
      />

      {/* Spacer for sticky bar */}
      <div className="h-32 lg:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification 
        productName="Spanish 5,000 Words Book" 
        productLabel="Physical Book" 
      />
    </main>
  );
};

export default ProductSpanish5000;
