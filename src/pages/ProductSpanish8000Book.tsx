import { useMemo, useState } from "react";
import { useMetaPixelViewContent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Check,
  BookOpen,
  Sparkles,
  Gift,
  Truck,
  Brain,
  Package,
  Star,
  Shield,
  Clock,
  Globe,
  TrendingUp,
  Mail,
  Loader2,
} from "lucide-react";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { TrustBadges } from "@/components/TrustBadges";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COVER_IMAGE = "/images/product-spanish-8000-book.webp";
const COVER_IMAGE_2 = "/images/product-spanish-8000-book-2.webp";

const PREORDER_PRICE = 15;
const RETAIL_PRICE = 35;
const FREE_SHIPPING_THRESHOLD = 50;

const features = [
  "8,000 essential Spanish words and expressions",
  "English pronunciation included for every word",
  "English-Spanish translation",
  "Grammar formulas from beginner (A1) to advanced (C1)",
  "Premium softcover, professionally printed",
  "Designed specifically for English speakers",
  "Worldwide shipping via Amazon logistics",
  "Same trusted iLingue Relax stress-free method",
];

const benefits = [
  {
    icon: BookOpen,
    title: "Premium Physical Book",
    description:
      "High-quality softcover edition. Study without screens, take notes, and learn at your own pace.",
  },
  {
    icon: Truck,
    title: "Worldwide Shipping",
    description:
      "Printed and shipped through Amazon's global logistics network. Fast, tracked delivery to your door.",
  },
  {
    icon: Sparkles,
    title: "Stress-Free Method",
    description:
      "The same relaxed methodology that helped thousands of students — now for English speakers learning Spanish.",
  },
  {
    icon: Brain,
    title: "No Dictionaries Needed",
    description:
      "Every word includes its English pronunciation and translation. Everything you need in one book.",
  },
];

const ProductSpanish8000Book = () => {
  const [activeImage, setActiveImage] = useState(0);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const pixelParams = useMemo(
    () => ({
      content_name: "Spanish Relax - 8,000 Words Physical Book (Pre-Order)",
      content_category: "Physical Book Pre-Order",
      content_ids: ["spanish-8000-book"],
      content_type: "product",
      value: PREORDER_PRICE,
      currency: "USD",
    }),
    []
  );
  useMetaPixelViewContent(pixelParams);

  const handlePreorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("store_subscribers").insert({
        email,
        product_name: "Spanish Relax - 8,000 Words Physical Book",
        store_name: "Pre-Order June",
      });
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        throw error;
      }
      setSubscribed(true);
      toast.success("You're on the pre-order list! We'll email you in June.");
    } catch (err) {
      console.error(err);
      toast.error("Could not save your email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const images = [
    { src: COVER_IMAGE, alt: "Spanish Relax 8,000 Words physical book held in hand" },
    { src: COVER_IMAGE_2, alt: "Spanish Relax 8,000 Words physical book on pink background" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Pre-Order: Spanish Relax 8,000 Words — Physical Book with English Pronunciation"
        description="Pre-order the Spanish Relax 8,000 Words physical book at $15 USD (regular price $35). Spanish for English speakers, with English pronunciation. Ships worldwide via Amazon in June."
        canonicalUrl="https://ilinguerelax.com/products/spanish-relax-8000-words-physical-book-preorder"
        image={`https://ilinguerelax.com${COVER_IMAGE}`}
        type="product"
        price={String(PREORDER_PRICE)}
        sku="ILINGUE-SPANISH-8000-BOOK"
        keywords="Spanish book for English speakers, Spanish Relax 8000, Spanish vocabulary book, English pronunciation Spanish, pre-order Spanish book, Amazon Spanish book"
        availability="PreOrder"
        isPhysical={true}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Image gallery */}
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative overflow-hidden rounded-2xl shadow-hero bg-card">
                <img
                  src={images[activeImage].src}
                  alt={images[activeImage].alt}
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
              <div className="flex gap-3 mt-3 justify-center">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      i === activeImage ? "border-primary scale-105" : "border-border opacity-70"
                    }`}
                  >
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent text-sm font-bold border border-accent/30"
                >
                  <Clock className="w-4 h-4" />
                  <span>🔥 PRE-ORDER — Limited Price</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  <Package className="w-4 h-4" />
                  <span>Ships June 2026</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Spanish Relax — 8,000 Words
                <br />
                <span className="text-primary">Physical Book (Pre-Order)</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-4">
                Learn Spanish stress-free with 8,000 essential words and expressions, all with{" "}
                <strong className="text-foreground">English pronunciation</strong>. Designed for
                English speakers — printed and shipped worldwide via Amazon.
              </p>

              {/* Reviews placeholder */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-muted-foreground">Based on the iLingue Relax method (1,200+ reviews)</span>
              </div>

              {/* Pre-order Price Block */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-2xl p-6 border-2 border-accent mb-5"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.18))",
                }}
              >
                <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl bg-accent text-accent-foreground text-xs font-black uppercase tracking-wider">
                  🎁 Pre-Order Deal
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span className="text-accent font-bold text-sm uppercase">
                    Lowest price ever — only during pre-order
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <span className="text-5xl md:text-6xl font-black text-foreground">
                    ${PREORDER_PRICE}
                  </span>
                  <span className="text-2xl text-muted-foreground line-through">
                    ${RETAIL_PRICE}
                  </span>
                  <span className="text-primary font-bold">USD</span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  Pre-order opens in <strong className="text-foreground">June 2026</strong>. After
                  launch, the regular price goes up to <strong>${RETAIL_PRICE} USD</strong>.
                </p>

                <div className="flex flex-col gap-2 mt-3 p-3 rounded-xl bg-background/60">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">
                      Pre-order price: <strong>${PREORDER_PRICE} USD</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">
                      🚚 FREE international shipping on orders over{" "}
                      <strong>${FREE_SHIPPING_THRESHOLD} USD</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">
                      Printed & shipped worldwide via <strong>Amazon</strong>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Pre-order email signup */}
              {!subscribed ? (
                <form onSubmit={handlePreorder} className="space-y-3 mb-4">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Reserve your pre-order spot — we'll email you in June
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    <Button
                      type="submit"
                      variant="hero"
                      size="xl"
                      className="text-base py-3"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Clock className="w-5 h-5 mr-2" />
                      )}
                      RESERVE PRE-ORDER
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No payment now. We'll send you the Amazon pre-order link in June at the
                    locked-in ${PREORDER_PRICE} price.
                  </p>
                </form>
              ) : (
                <div className="mb-4 p-5 rounded-xl bg-green-500/10 border-2 border-green-500/30">
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-bold text-foreground">You're on the list! 🎉</p>
                      <p className="text-sm text-muted-foreground">
                        We'll email you the pre-order link in June at the ${PREORDER_PRICE} price.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <TrustBadges lang="en" variant="grid" />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/30 mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">Locked-in Pre-Order Price</p>
                  <p className="text-sm text-muted-foreground">
                    Reserve today and pay only ${PREORDER_PRICE} when pre-orders open. After launch,
                    the price goes up to ${RETAIL_PRICE}.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why pre-order the <span className="text-primary">Physical Book</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get the lowest price ever and be among the first to receive it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-hero transition-all duration-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
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
      <section className="py-16 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-10">
              What's included
            </h2>
            <div className="bg-card rounded-3xl border border-border shadow-card p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
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

      {/* Pricing Timeline */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-10">
              Pre-Order Pricing Timeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border-2 border-accent p-6 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase">
                  Now
                </div>
                <Gift className="w-8 h-8 text-accent mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">Reserve your spot</p>
                <p className="text-3xl font-black text-foreground">$0</p>
                <p className="text-xs text-muted-foreground mt-2">No payment until launch</p>
              </div>
              <div className="bg-card rounded-2xl border-2 border-primary p-6 text-center">
                <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">June 2026 — Pre-Order</p>
                <p className="text-3xl font-black text-foreground">${PREORDER_PRICE}</p>
                <p className="text-xs text-muted-foreground mt-2">Locked-in price</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 text-center opacity-70">
                <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">After launch</p>
                <p className="text-3xl font-black text-muted-foreground line-through">
                  ${RETAIL_PRICE}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Regular Amazon price</p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              🚚 Free international shipping on Amazon orders over ${FREE_SHIPPING_THRESHOLD} USD.
            </p>
          </div>
        </div>
      </section>

      <FAQ
        title="Pre-Order FAQ"
        subtitle="Everything you need to know before reserving your copy"
        items={[
          {
            question: "When will the book ship?",
            answer:
              "Pre-orders open in June 2026 and books ship shortly after through Amazon's worldwide logistics network.",
          },
          {
            question: "Do I pay now?",
            answer:
              "No. Reserving your spot is free. You'll get an email with the Amazon pre-order link when it goes live, at the locked-in $15 price.",
          },
          {
            question: "What happens to the price after launch?",
            answer:
              "Once pre-orders close and the book launches publicly, the regular price goes up to $35 USD on Amazon.",
          },
          {
            question: "How does free shipping work?",
            answer:
              "Amazon offers free international shipping on qualifying orders over $50 USD. You can add other items to reach the threshold.",
          },
          {
            question: "Is this book for me?",
            answer:
              "Yes if you're an English speaker who wants to learn Spanish. Every word includes English pronunciation and English-Spanish translation.",
          },
          {
            question: "What's inside?",
            answer:
              "8,000 Spanish words and expressions, English pronunciation, English-Spanish translations, and grammar formulas from beginner (A1) to advanced (C1).",
          },
        ]}
      />
      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
    </main>
  );
};

export default ProductSpanish8000Book;