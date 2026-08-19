import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";
import { useMetaPixelViewContent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";

import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Truck,
  Package,
  Star,
  Shield,
  Clock,
  Globe,
  TrendingUp,
  Mail,
  Loader2,
  ShoppingCart,
  Briefcase,
  Zap,
  Coffee,
  Link2,
  Gift,
} from "lucide-react";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";
import { fetchShopifyProducts } from "@/lib/shopify";
import coverImage from "@/assets/product-spanish-3000-verbs-book.webp";
import { PinterestSave } from "@/components/PinterestSave";

const COVER_IMAGE_PUBLIC = "/images/product-spanish-3000-verbs-book.webp";

const PREORDER_PRICE = 17;
const RETAIL_PRICE = 39;
const FREE_SHIPPING_THRESHOLD = 50;

const features = [
  "3,000 essential Spanish verbs",
  "Past, Present & Future tenses fully covered",
  "English pronunciation for every verb",
  "English-Spanish translation",
  "3 contextual sections: Professional, Aggressive & Direct, Social & Relax",
  "Premium softcover, professionally printed",
  "Designed for English speakers",
  "Worldwide shipping via Amazon logistics",
];

const categories = [
  {
    icon: Briefcase,
    title: "Professional",
    description:
      "Business, leadership, and workplace verbs to communicate with authority in any office or meeting.",
    color: "from-cyan-500/20 to-blue-500/20",
    iconColor: "text-cyan-400",
    border: "border-cyan-500/40",
  },
  {
    icon: Zap,
    title: "Aggressive & Direct",
    description:
      "For negotiations, debates, and speaking with absolute confidence. No hesitation, just impact.",
    color: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400",
    border: "border-blue-500/40",
  },
  {
    icon: Coffee,
    title: "Social & Relax",
    description:
      "For everyday conversations, friendships, and travel. The verbs you'll actually use every day.",
    color: "from-sky-500/20 to-cyan-500/20",
    iconColor: "text-sky-400",
    border: "border-sky-500/40",
  },
];

const ProductSpanish3000VerbsBook = () => {
  const { currency, formatPrice } = useI18n();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { isLoading: cartLoading } = useCartStore();
  const navigate = useNavigate();


  const PRODUCT_SKU = "spanish-3000-verbs-book";
  const pricing = useAdminPricing(PRODUCT_SKU);
  const tier = useCountryTierRouting(PRODUCT_SKU, {
    fallbackPriceGlobalUsd: PREORDER_PRICE,
    fallbackPriceLatamUsd: PREORDER_PRICE,
  });

  const handleAddToCart = async () => {
    navigate(`/checkouts/${PRODUCT_SKU}`);
  };

  const AMAZON_URL_3000 = "https://www.amazon.com/s?k=Spanish+Relax+3000+Verbs";


  const pixelParams = useMemo(
    () => ({
      content_name: "Spanish Relax - 3,000 Verbs Mastery Physical Book (Pre-Order)",
      content_category: "Physical Book Pre-Order",
      content_ids: ["spanish-3000-verbs-book"],
      content_type: "product",
      value: PREORDER_PRICE,
      currency: "USD",
    }),
    []
  );
  useMetaPixelViewContent(pixelParams);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("store_subscribers").insert({
        email,
        product_type: "Spanish Relax - 3,000 Verbs Mastery Physical Book",
        store_name: "Pre-Order June 2026",
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

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Pre-Order: 3,000 Spanish Verbs Physical Book"
        description="Pre-order 3,000 Spanish Verbs Mastery at $17 (reg. $39). Past, present & future with English pronunciation. Professional, social & aggressive verbs. Ships 2026."
        canonicalUrl="https://ilinguerelax.com/products/3-000-spanish-verbs-mastery-physical-book-preorder"
        image={`https://ilinguerelax.com${COVER_IMAGE_PUBLIC}`}
        type="product"
        price={String(PREORDER_PRICE)}
        sku="ILINGUE-SPANISH-3000-VERBS-BOOK"
        keywords="3000 Spanish verbs, Spanish verbs book, Spanish verbs mastery, learn Spanish verbs fast, Spanish verb conjugation book, Spanish verbs with English pronunciation, Spanish for English speakers, pre-order Spanish book, Spanish Relax verbs, physical Spanish book"
        availability="PreOrder"
        isPhysical={true}
      />
      <Navbar />

      {/* Hero Section — Dark, electric */}
      <section className="relative pt-6 pb-10 md:pt-10 md:pb-14 bg-slate-950 text-white overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="container px-4 md:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Image (3D-style mockup) */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-purple-500/30 blur-3xl rounded-3xl" />
              <motion.div
                initial={{ rotate: -6, scale: 0.96, opacity: 0 }}
                animate={{ rotate: -3, scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-2xl shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-500/30"
                style={{ transform: "perspective(1200px) rotateY(-8deg) rotateX(2deg)" }}
              >
                <img
                  src={coverImage}
                  alt="3,000 Spanish Verbs Mastery physical book cover"
                  className="w-full h-auto"
                  loading="eager"
                />
                <PinterestSave overlay />
              </motion.div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-cyan-500/30 blur-2xl rounded-full" />
            </div>

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/15 text-cyan-300 text-sm font-bold border border-cyan-400/40"
                >
                  <Clock className="w-4 h-4" />
                  <span>🔥 PRE-ORDER — Launch Price</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/15 text-blue-300 text-sm font-medium border border-blue-400/30"
                >
                  <Package className="w-4 h-4" />
                  <span>Ships June 2026</span>
                </motion.div>
              </div>

              {/* "Missing Link" angle */}
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs uppercase tracking-wider text-cyan-300 font-bold">
                <Link2 className="w-3.5 h-3.5" />
                The Missing Link of the Spanish Relax System
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
                3,000 Spanish Verbs
                <br />
                <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Mastery
                </span>
              </h1>

              <p className="text-base md:text-lg text-slate-300 mb-2">
                Past, Present & Future — with English pronunciation.
              </p>
              <p className="text-base md:text-lg text-slate-400 mb-5 italic">
                "You have the words. Now master the actions."
              </p>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-cyan-400 text-cyan-400" />
                  ))}
                </div>
                <span className="text-slate-400 text-sm">
                  Built on the trusted iLingue Relax method
                </span>
              </div>

              {/* Price block */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden rounded-2xl p-6 border-2 border-cyan-400/50 mb-5 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-slate-900/40 backdrop-blur"
              >
                <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider">
                  ⚡ Pre-Order Deal
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-cyan-300" />
                  <span className="text-cyan-300 font-bold text-sm uppercase">
                    Launch price — only during pre-order
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <span className="text-5xl md:text-6xl font-black text-white">
                    {tier.priceLabel}
                  </span>
                  <span className="text-2xl text-slate-500 line-through">{tier.originalLabel}</span>
                </div>

                <p className="text-sm text-slate-300 mb-3">
                  After the June 2026 launch, the regular price increases to{" "}
                  <strong className="text-white">${RETAIL_PRICE} USD</strong>.
                </p>

                <div className="flex flex-col gap-2 mt-3 p-3 rounded-xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm text-slate-200 font-medium">
                      Pre-order price: <strong>${PREORDER_PRICE} USD</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm text-slate-200 font-medium">
                      🚚 FREE international shipping over{" "}
                      <strong>${FREE_SHIPPING_THRESHOLD} USD</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm text-slate-200 font-medium">
                      Printed & shipped worldwide via <strong>Amazon</strong>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Important Notice */}
              <div className="mb-4 p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 text-sm text-amber-200">
                <strong className="text-amber-300">⚠ Important:</strong> This is a Pre-order item.
                Shipping begins <strong>June 2026</strong>. You're charged today to lock in your copy
                and price.
              </div>

              {/* Primary CTA */}
              <Button
                size="xl"
                className="w-full mb-3 text-lg py-6 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black border-0 shadow-lg shadow-cyan-500/30"
                onClick={handleAddToCart}
                disabled={false}
              >
                {cartLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-6 h-6 mr-2" />
                )}
                {`PRE-ORDER THE 3,000 VERBS BOOK — ${tier.priceLabel}`}
              </Button>
              <p className="text-xs text-center text-slate-400 mb-5">
                Add the Verb Mastery to my collection · Secure checkout · Ships June 2026
              </p>

              {/* Email reservation */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-950 px-3 text-slate-500">Or reserve without paying</span>
                </div>
              </div>

              {!subscribed ? (
                <form onSubmit={handleNotify} className="space-y-3 mb-4">
                  <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    Get notified when pre-orders ship
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-white/10 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="xl"
                      className="text-base py-3 border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Mail className="w-5 h-5 mr-2" />
                      )}
                      NOTIFY ME
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mb-4 p-5 rounded-xl bg-cyan-500/10 border-2 border-cyan-400/30">
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-cyan-300" />
                    <div>
                      <p className="font-bold text-white">You're on the list! 🎉</p>
                      <p className="text-sm text-slate-300">
                        We'll email you when your pre-order ships in June 2026.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2">
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Missing Link section */}
      <section className="py-14 md:py-16 bg-slate-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              The Engine of Spanish Relax
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-5">
              You have the words.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Now master the actions.
              </span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Vocabulary tells the world what you see. Verbs tell the world what you{" "}
              <em>do</em>. This book is the missing engine of the Spanish Relax system — 3,000
              real, living verbs across <strong>Past, Present, and Future</strong>, ready to power
              every conversation you'll ever have.
            </p>
          </div>
        </div>
      </section>

      {/* 3 Categories */}
      <section className="py-16 md:py-20 bg-slate-950 text-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              3 Verbs. <span className="text-cyan-300">3 Sides of You.</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Every verb is sorted by real-life context — so you always reach for the right one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`relative rounded-2xl border-2 ${cat.border} p-6 bg-gradient-to-br ${cat.color} backdrop-blur overflow-hidden`}
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-cyan-400/10 blur-2xl" />
                <div
                  className={`relative w-14 h-14 rounded-xl bg-slate-950/70 ${cat.iconColor} flex items-center justify-center mb-4 ring-1 ring-white/10`}
                >
                  <cat.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">{cat.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{cat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tense mastery */}
      <section className="py-14 md:py-16 bg-slate-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-3">
              Full <span className="text-cyan-300">Tense Mastery</span>
            </h2>
            <p className="text-center text-slate-400 mb-10">
              Speak about what was, what is, and what will be — without hesitation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Past", caption: "What you did." },
                { label: "Present", caption: "What you do." },
                { label: "Future", caption: "What you will do." },
              ].map((t) => (
                <div
                  key={t.label}
                  className="rounded-2xl p-6 text-center bg-slate-950/60 border border-cyan-400/20 hover:border-cyan-400/50 transition-colors"
                >
                  <p className="text-cyan-300 text-xs uppercase tracking-widest font-bold mb-2">
                    Tense
                  </p>
                  <p className="text-3xl font-black text-white mb-1">{t.label}</p>
                  <p className="text-sm text-slate-400">{t.caption}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-20 bg-slate-950 text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-10">
              What's <span className="text-cyan-300">inside</span>
            </h2>
            <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-xl shadow-cyan-500/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-slate-950" />
                    </div>
                    <span className="text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Timeline */}
      <section className="py-16 md:py-20 bg-slate-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-10">
              Pre-Order <span className="text-cyan-300">Pricing Timeline</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 rounded-2xl border-2 border-cyan-400 p-6 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-400 text-slate-950 text-xs font-bold uppercase">
                  Now
                </div>
                <Gift className="w-8 h-8 text-cyan-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-2">Pre-order today</p>
                <p className="text-3xl font-black text-white">${PREORDER_PRICE}</p>
                <p className="text-xs text-slate-400 mt-2">Locked-in launch price</p>
              </div>
              <div className="bg-slate-950/60 rounded-2xl border-2 border-blue-400/60 p-6 text-center">
                <Clock className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-2">June 2026</p>
                <p className="text-3xl font-black text-white">📦 Ships</p>
                <p className="text-xs text-slate-400 mt-2">Worldwide via Amazon</p>
              </div>
              <div className="bg-slate-950/60 rounded-2xl border border-white/10 p-6 text-center opacity-80">
                <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-2">After launch</p>
                <p className="text-3xl font-black text-slate-500 line-through">${RETAIL_PRICE}</p>
                <p className="text-xs text-slate-400 mt-2">Standard price</p>
              </div>
            </div>
            <p className="text-center text-sm text-slate-400 mt-6">
              🚚 Free international shipping on orders over ${FREE_SHIPPING_THRESHOLD} USD.
            </p>

            <div className="mt-8 flex justify-center">
              <Button
                size="xl"
                className="text-base px-8 py-5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black border-0 shadow-lg shadow-cyan-500/30"
                onClick={handleAddToCart}
                disabled={false}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add the Verb Mastery to my collection
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-12 bg-slate-950 text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-400/30">
            <div className="w-14 h-14 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
              <Shield className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Locked-in Pre-Order Price</p>
              <p className="text-sm text-slate-300">
                Pre-order today at ${PREORDER_PRICE}. After the June 2026 launch the standard
                price increases to ${RETAIL_PRICE} USD.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FAQ
        title="Pre-Order FAQ"
        subtitle="Everything you need to know about your pre-order"
        items={[
          {
            question: "What is this book exactly?",
            answer:
              "It's a physical book containing 3,000 essential Spanish verbs in Past, Present and Future, with English pronunciation and English-Spanish translation. Verbs are sorted into 3 contextual sections: Professional, Aggressive & Direct, and Social & Relax.",
          },
          {
            question: "When will the book ship?",
            answer:
              "Physical books are scheduled to ship starting June 2026 through our worldwide logistics network. You'll receive tracking information by email as soon as your copy is dispatched.",
          },
          {
            question: "Why pre-order now?",
            answer:
              "Pre-ordering locks in the launch price of $17 USD. After the June 2026 launch the standard price increases to $39 USD. You also reserve a copy from the very first print run.",
          },
          {
            question: "Do I pay today?",
            answer:
              "Yes. By pre-ordering today you lock in the $17 USD price and reserve your copy. Your card is charged at checkout and the book is shipped to you in June 2026.",
          },
          {
            question: "Is this for English speakers learning Spanish?",
            answer:
              "Yes — every verb includes English pronunciation and English-Spanish translation. It's designed specifically for English speakers who want to master Spanish verbs in real life.",
          },
          {
            question: "How does free shipping work?",
            answer:
              "We offer free international shipping on orders over $50 USD. You can add other Spanish Relax titles to your cart to reach the threshold and ship everything together.",
          },
          {
            question: "Need help with your pre-order?",
            answer:
              "Email us at hola@ilinguerelax.com or message us on WhatsApp at +1 251 272 4704 — we usually reply within a few hours.",
          },
        ]}
      />
      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
      <StickyBuyBar
        lang="en"
        productName="3,000 Spanish Verbs Mastery — Pre-Order"
        price={formatPrice(PREORDER_PRICE, currency)}
        originalPrice={formatPrice(RETAIL_PRICE, currency)}
        rating={4.9}
        reviewCount={1200}
        ctaText={`PRE-ORDER NOW — ${formatPrice(PREORDER_PRICE, currency)}`}
        onBuyClick={handleAddToCart}
        isLoading={cartLoading}
        disabled={false}
        isPhysical={true}
        goesToInternalCheckout={true}
        sku={PRODUCT_SKU}
        currencyCode={currency}
        flag={currency === "USD" ? "🇺🇸" : currency === "EUR" ? "🇪🇺" : currency === "GBP" ? "🇬🇧" : currency === "AUD" ? "🇦🇺" : currency === "CAD" ? "🇨🇦" : "🌎"}
      />
    </main>
  );
};

export default ProductSpanish3000VerbsBook;
