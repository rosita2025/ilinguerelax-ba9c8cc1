import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMetaPixelViewContent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";

import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Check, Sparkles, Truck, Package, Star, Shield, Clock, Globe,
  TrendingUp, Mail, Loader2, ShoppingCart, Blocks, Layers, Zap, Gift, Puzzle,
} from "lucide-react";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";
import { fetchShopifyProducts } from "@/lib/shopify";
import coverImage from "@/assets/product-grammar-patterns-a1c1.webp";
import { PinterestSave } from "@/components/PinterestSave";

const COVER_IMAGE_PUBLIC = "/images/product-grammar-patterns-a1c1.webp";

const PRICE = 45;
const FREE_SHIPPING_THRESHOLD = 50;

const features = [
  "1,500+ grammar patterns from A1 to C1",
  "Past, Present & Future — every mood and tense",
  "'Lego-style' system to build sentences with ease",
  "Native shortcuts for natural-sounding fluency",
  "English explanations for every Spanish pattern",
  "Premium softcover, professionally printed",
  "Designed as the bridge between vocabulary and verbs",
  "Worldwide shipping via Amazon logistics",
];

const pillars = [
  {
    icon: Blocks,
    title: "The Lego System",
    description:
      "Snap simple grammar blocks together to build any sentence — from beginner phrases to advanced ideas — without overthinking.",
  },
  {
    icon: Layers,
    title: "A1 → C1 Progression",
    description:
      "1,500+ patterns laid out in a clear path from absolute beginner to advanced fluency. Always know what to learn next.",
  },
  {
    icon: Zap,
    title: "Native Shortcuts",
    description:
      "The exact connectors, fillers, and natural turns of phrase real Spanish speakers use — so you stop sounding like a robot.",
  },
];

const ProductSpanishGrammarPatterns = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [shopifyVariantId, setShopifyVariantId] = useState<string | null>(null);
  const [shopifyProduct, setShopifyProduct] = useState<any>(null);
  const { addItem, isLoading: cartLoading } = useCartStore();
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    navigate("/checkouts/spanish_grammar");
  };

  const AMAZON_URL_GRAMMAR = "https://www.amazon.com/s?k=Spanish+Relax+Grammar+Patterns";


  const pixelParams = useMemo(
    () => ({
      content_name: "Spanish Relax - Grammar Patterns A1-C1 Mastery",
      content_category: "Physical Book",
      content_ids: ["spanish-grammar-patterns"],
      content_type: "product",
      value: PRICE,
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
        product_type: "Spanish Relax - Grammar Patterns A1-C1 Mastery",
        store_name: "Grammar Patterns Updates",
      });
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        throw error;
      }
      setSubscribed(true);
      toast.success("You're subscribed! We'll keep you posted.");
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
        title="Spanish Grammar Patterns Book · A1 to C1"
        description="1,500+ Spanish grammar patterns from A1 to C1 in one Lego-style sentence builder book. For English speakers. $45 USD, ships worldwide."
        canonicalUrl="https://ilinguerelax.com/products/spanish-grammar-patterns-a1-c1-mastery-preorder"
        image={`https://ilinguerelax.com${COVER_IMAGE_PUBLIC}`}
        type="product"
        price={String(PRICE)}
        sku="ILINGUE-SPANISH-GRAMMAR-PATTERNS"
        keywords="Spanish grammar book, Spanish grammar patterns, Spanish sentence builder, learn Spanish grammar, Spanish grammar A1 to C1, Spanish for English speakers, Spanish grammar exercises, best Spanish grammar book, Spanish Relax grammar, Spanish structure book"
        availability="InStock"
        isPhysical={true}
      />
      <Navbar />

      {/* Hero — Lavender + Gold premium aesthetic */}
      <section className="relative pt-6 pb-10 md:pt-10 md:pb-14 overflow-hidden bg-gradient-to-br from-[#1a1233] via-[#2a1f4d] to-[#1a1233] text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#a78bfa]/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#d4af37]/15 blur-3xl" />
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
            {/* Image */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-[#a78bfa]/40 via-[#d4af37]/20 to-[#a78bfa]/40 blur-3xl rounded-3xl" />
              <motion.div
                initial={{ rotate: -6, scale: 0.96, opacity: 0 }}
                animate={{ rotate: -3, scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-2xl shadow-2xl shadow-[#a78bfa]/30 ring-1 ring-[#d4af37]/40"
                style={{ transform: "perspective(1200px) rotateY(-8deg) rotateX(2deg)" }}
              >
                <img
                  src={coverImage}
                  alt="Grammar Patterns A1-C1 Mastery — Spanish Sentence Builder cover"
                  className="w-full h-auto"
                  loading="eager"
                />
                <PinterestSave 
                  overlay 
                  media={coverImage}
                  url="https://ilinguerelax.com/products/100-essential-grammar-patterns-in-spanish-with-pronunciation"
                  description="Master 100 essential Spanish grammar patterns with pronunciation and practical examples."
                />
              </motion.div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-[#a78bfa]/30 blur-2xl rounded-full" />
            </div>

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/15 text-[#f4d782] text-sm font-bold border border-[#d4af37]/40"
                >
                  <Check className="w-4 h-4" />
                  <span>✅ Available Now — In Stock</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#a78bfa]/15 text-[#c4b5fd] text-sm font-medium border border-[#a78bfa]/40"
                >
                  <Package className="w-4 h-4" />
                  <span>Ships worldwide</span>
                </motion.div>
              </div>

              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs uppercase tracking-wider text-[#f4d782] font-bold">
                <Puzzle className="w-3.5 h-3.5" />
                The Final Piece of the Puzzle
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
                Grammar Patterns
                <br />
                <span className="bg-gradient-to-r from-[#f4d782] via-[#d4af37] to-[#f4d782] bg-clip-text text-transparent">
                  A1 — C1 Mastery
                </span>
              </h1>

              <p className="text-base md:text-lg text-slate-200 mb-2">
                The Spanish Sentence Builder — by iLingue Relax.
              </p>
              <p className="text-base md:text-lg text-slate-300 mb-5 italic">
                "Connect your words and verbs into perfect sentences."
              </p>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#d4af37] text-[#d4af37]" />
                  ))}
                </div>
                <span className="text-slate-300 text-sm">
                  The premium add-on to the Spanish Relax collection
                </span>
              </div>

              {/* Price block */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden rounded-2xl p-6 border-2 border-[#d4af37]/60 mb-5 bg-gradient-to-br from-[#a78bfa]/10 via-[#d4af37]/5 to-[#1a1233]/40 backdrop-blur"
              >
                <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl bg-[#d4af37] text-[#1a1233] text-xs font-black uppercase tracking-wider">
                  ⚡ Premium Edition
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-[#f4d782]" />
                  <span className="text-[#f4d782] font-bold text-sm uppercase">
                    Standard price — available worldwide
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <span className="text-5xl md:text-6xl font-black text-white">
                    ${PRICE}
                  </span>
                  <span className="text-[#f4d782] font-bold">USD</span>
                </div>

                <p className="text-sm text-slate-300 mb-3">
                  Premium softcover, printed & shipped worldwide via Amazon logistics.
                </p>

                <div className="flex flex-col gap-2 mt-3 p-3 rounded-xl bg-[#1a1233]/60 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                    <span className="text-sm text-slate-200 font-medium">
                      Standard price: <strong>${PRICE} USD</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                    <span className="text-sm text-slate-200 font-medium">
                      🚚 FREE international shipping over{" "}
                      <strong>${FREE_SHIPPING_THRESHOLD} USD</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                    <span className="text-sm text-slate-200 font-medium">
                      Printed & shipped worldwide via <strong>Amazon</strong>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Important Notice */}
              <div className="mb-4 p-4 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-sm text-[#f4d782]">
                <strong className="text-[#f4d782]">✅ In Stock:</strong> Available now.
                Ships in <strong>3–7 business days</strong> worldwide via Amazon logistics.
              </div>

              {/* Primary CTA */}
              <Button
                size="xl"
                className="w-full mb-2 text-lg py-6 bg-gradient-to-r from-[#d4af37] to-[#f4d782] hover:from-[#f4d782] hover:to-[#d4af37] text-[#1a1233] font-black border-0 shadow-lg shadow-[#d4af37]/30"
                onClick={handleAddToCart}
                disabled={false}
              >
                {cartLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-6 h-6 mr-2" />
                )}
                {`ADD TO CART — $${PRICE}.00`}
              </Button>
              <p className="text-xs text-center text-slate-300 mb-5">
                Secure checkout · Free shipping over ${FREE_SHIPPING_THRESHOLD} · Ships worldwide
              </p>

              {/* Email reservation */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#1a1233] px-3 text-slate-400">Or get updates by email</span>
                </div>
              </div>

              {!subscribed ? (
                <form onSubmit={handleNotify} className="space-y-3 mb-4">
                  <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#d4af37]" />
                    Get bonuses, tips & restock updates
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-white/10 bg-[#1a1233] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#d4af37]"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="xl"
                      className="text-base py-3 border-[#d4af37]/50 text-[#f4d782] hover:bg-[#d4af37]/10 hover:text-[#f4d782]"
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
                <div className="mb-4 p-5 rounded-xl bg-[#d4af37]/10 border-2 border-[#d4af37]/30">
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-[#f4d782]" />
                    <div>
                      <p className="font-bold text-white">You're on the list! 🎉</p>
                      <p className="text-sm text-slate-300">
                        We'll keep you posted with bonuses, tips and updates.
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

      {/* The Glue section */}
      <section className="py-14 md:py-16 bg-[#1a1233] text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/40 text-[#f4d782] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Structural Grammar Mastery
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-5">
              Structural Grammar,
              <br />
              <span className="bg-gradient-to-r from-[#f4d782] via-[#d4af37] to-[#f4d782] bg-clip-text text-transparent">
                Built to Speak.
              </span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              A complete <strong>structural grammar</strong> system — 1,500+ patterns from A1 to C1
              that turn the Spanish you know into natural, native-sounding sentences.
            </p>
          </div>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-[#1a1233] to-[#2a1f4d] text-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              The 3 <span className="text-[#f4d782]">Mastery Pillars</span>
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              A complete sentence-building method, distilled into three powerful systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {pillars.map((p, idx) => (
              <motion.div
                key={p.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative rounded-2xl border-2 border-[#d4af37]/30 p-6 bg-gradient-to-br from-[#a78bfa]/10 to-[#1a1233]/40 backdrop-blur overflow-hidden hover:border-[#d4af37]/60 transition-colors"
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#d4af37]/10 blur-2xl" />
                <div className="relative w-14 h-14 rounded-xl bg-[#1a1233]/70 text-[#f4d782] flex items-center justify-center mb-4 ring-1 ring-[#d4af37]/30">
                  <p.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">{p.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* A1 → C1 progression */}
      <section className="py-14 md:py-16 bg-[#1a1233] text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-3">
              From <span className="text-[#f4d782]">A1 to C1</span> — Step by Step
            </h2>
            <p className="text-center text-slate-300 mb-10">
              1,500+ patterns across every CEFR level. Always know what comes next.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {["A1", "A2", "B1", "B2", "C1"].map((lvl) => (
                <div
                  key={lvl}
                  className="rounded-2xl p-5 text-center bg-[#2a1f4d]/60 border border-[#d4af37]/30 hover:border-[#d4af37]/70 transition-colors"
                >
                  <p className="text-[#f4d782] text-xs uppercase tracking-widest font-bold mb-2">
                    Level
                  </p>
                  <p className="text-3xl font-black text-white">{lvl}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-[#1a1233] to-[#2a1f4d] text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-10">
              What's <span className="text-[#f4d782]">inside</span>
            </h2>
            <div className="rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#2a1f4d] to-[#1a1233] p-8 shadow-xl shadow-[#a78bfa]/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#d4af37] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#1a1233]" />
                    </div>
                    <span className="text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 md:py-20 bg-[#1a1233] text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-10">
              The <span className="text-[#f4d782]">Premium Edition</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#2a1f4d]/60 rounded-2xl border-2 border-[#d4af37] p-6 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#d4af37] text-[#1a1233] text-xs font-bold uppercase">
                  In Stock
                </div>
                <Gift className="w-8 h-8 text-[#f4d782] mx-auto mb-3" />
                <p className="text-sm text-slate-300 mb-2">Standard price</p>
                <p className="text-3xl font-black text-white">${PRICE}</p>
                <p className="text-xs text-slate-400 mt-2">Premium softcover</p>
              </div>
              <div className="bg-[#2a1f4d]/60 rounded-2xl border-2 border-[#a78bfa]/60 p-6 text-center">
                <Truck className="w-8 h-8 text-[#c4b5fd] mx-auto mb-3" />
                <p className="text-sm text-slate-300 mb-2">Ships in</p>
                <p className="text-3xl font-black text-white">3–7 days</p>
                <p className="text-xs text-slate-400 mt-2">Worldwide via Amazon</p>
              </div>
              <div className="bg-[#2a1f4d]/60 rounded-2xl border border-white/10 p-6 text-center">
                <Shield className="w-8 h-8 text-[#f4d782] mx-auto mb-3" />
                <p className="text-sm text-slate-300 mb-2">Guarantee</p>
                <p className="text-3xl font-black text-white">7 days</p>
                <p className="text-xs text-slate-400 mt-2">Money-back promise</p>
              </div>
            </div>
            <p className="text-center text-sm text-slate-300 mt-6">
              🚚 Free international shipping on orders over ${FREE_SHIPPING_THRESHOLD} USD.
            </p>

            <div className="mt-8 flex justify-center">
              <Button
                size="xl"
                className="text-base px-8 py-5 bg-gradient-to-r from-[#d4af37] to-[#f4d782] hover:from-[#f4d782] hover:to-[#d4af37] text-[#1a1233] font-black border-0 shadow-lg shadow-[#d4af37]/30"
                onClick={handleAddToCart}
                disabled={false}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart — ${PRICE}.00
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-12 bg-gradient-to-b from-[#1a1233] to-[#2a1f4d] text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#d4af37]/10 to-[#a78bfa]/10 border-2 border-[#d4af37]/40">
            <div className="w-14 h-14 rounded-full bg-[#d4af37] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#d4af37]/30">
              <Shield className="w-7 h-7 text-[#1a1233]" />
            </div>
            <div>
              <p className="text-base font-bold text-white">7-Day Money-Back Guarantee</p>
              <p className="text-sm text-slate-200">
                Try the book risk-free. If it's not for you, email us within 7 days for a full refund.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FAQ
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about the book"
        items={[
          {
            question: "What is this book exactly?",
            answer:
              "It's a physical book containing 1,500+ Spanish grammar patterns from A1 (beginner) to C1 (advanced). It covers every mood and tense (Past, Present, Future) with a 'Lego-style' system to build sentences naturally, plus native shortcuts for sounding fluent.",
          },
          {
            question: "Why is it the 'glue' of the Spanish Relax system?",
            answer:
              "It's the structural grammar layer of the Spanish Relax system: 1,500+ patterns that show you exactly how Spanish sentences are built, so the words and verbs you already know finally come out as natural, native-sounding speech.",
          },
          {
            question: "When will the book ship?",
            answer:
              "Orders ship in 3–7 business days via Amazon's worldwide logistics network. You'll receive tracking by email as soon as your copy is dispatched.",
          },
          {
            question: "Is the book really available now?",
            answer:
              "Yes. The book is in stock and ships worldwide via Amazon. Most orders arrive within 3–7 business days.",
          },
          {
            question: "What's included with my order?",
            answer:
              "You'll receive the premium softcover Grammar Patterns A1-C1 Mastery book, professionally printed and shipped worldwide via Amazon logistics.",
          },
          {
            question: "How does free shipping work?",
            answer:
              "We offer free international shipping on orders over $50 USD worldwide via Amazon logistics.",
          },
          {
            question: "Need help with your order?",
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
        productName="Grammar Patterns A1-C1 Mastery"
        price={`$${PRICE}`}
        rating={4.9}
        reviewCount={1500}
        ctaText={`ADD TO CART — $${PRICE}.00`}
        sku="SPANISH-GRAMMAR-PATTERNS"
        onBuyClick={handleAddToCart}
        isLoading={cartLoading}
        disabled={false}
        isPhysical={true}
        goesToInternalCheckout={true}
      />
  );
};

export default ProductSpanishGrammarPatterns;
