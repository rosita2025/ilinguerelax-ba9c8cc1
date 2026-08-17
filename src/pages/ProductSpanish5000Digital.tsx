import { useMemo, useRef, useState, Suspense, useEffect } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Check, BookOpen, Sparkles, Brain, Download, Zap, Shield, ShoppingCart,
  Star, Eye, Globe, Smartphone, FileText, CreditCard, ArrowRight,
} from "lucide-react";

import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { useTrackProductView, useScrollTimeTracking } from "@/hooks/useGoogleAnalytics";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { CountdownTimer } from "@/components/CountdownTimer";
import { LiveViewers } from "@/components/LiveViewers";
import SalesNotification from "@/components/SalesNotification";
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useI18n } from "@/i18n/I18nContext";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";

import productDigitalImage from "@/assets/spanish-5000-digital-only.webp";
import previewSpanishVocab from "@/assets/preview-spanish-vocab.png";
import previewSpanishPhrases from "@/assets/preview-spanish-phrases.webp";
import { PinterestSave } from "@/components/PinterestSave";
import plannerPreviewAsset from "@/assets/previews/spanish-daily-planner-preview.png.asset.json";
import examPreviewAsset from "@/assets/previews/spanish-exam-preview.png.asset.json";
import grammarPreviewAsset from "@/assets/previews/spanish-grammar-preview.png.asset.json";
import verbsPreviewAsset from "@/assets/previews/spanish-verbs-preview.png.asset.json";
import questionsPreviewAsset from "@/assets/previews/spanish-questions-preview.png.asset.json";
import verbsV2PreviewAsset from "@/assets/previews/spanish-verbs-v2-preview.png.asset.json";

const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));
const LooxStyleReviews = lazy(() => import("@/components/LooxStyleReviews").then(m => ({ default: m.LooxStyleReviews })));


const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/aFa5kC2OIchv2mA8m98IU0e";
const PRICE = 22;
const ORIGINAL_PRICE = 35;
const DISCOUNT_PCT = Math.round(((ORIGINAL_PRICE - PRICE) / ORIGINAL_PRICE) * 100);

const features = [
  "5,000 Spanish Words + Pronunciation (250 Pages)",
  "Complete A1–C1 Grammar Guide (250 Pages)",
  "1,000 Essential Spanish Verbs + English Pronunciation",
  "500 Spanish Questions for Practice + English Pronunciation",
  "Practical Exercises & Study Plan",
  "Escrito por humanos & Marca registrada",
  "Instant PDF download · Pago Seguro",
  "Progressive A1 → C1 Learning Path",
];

const benefits = [
  { icon: Download, title: "Instant Download", description: "Get immediate access to your PDF right after purchase. Start learning Spanish in minutes." },
  { icon: Zap, title: "Learn Anywhere", description: "Study on your phone, tablet, or computer. Your Spanish vocabulary is always with you." },
  { icon: Sparkles, title: "Stress-Free Method", description: "Learn at your own pace with a relaxed method that respects your process." },
  { icon: Brain, title: "No Dictionaries Needed", description: "Meanings, pronunciation, and examples all in one place." },
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

const ProductSpanish5000Digital = () => {
  const shortTestimonials = [
    "Best Spanish book I've found!",
    "Finally understood Ser vs Estar.",
    "Fast delivery & secure payment.",
    "The pronunciation guide is a life saver!",
    "Perfect for A1 to C1 levels.",
    "Everything I needed in one PDF."
  ];
  const [isRedirecting, setIsRedirecting] = useState(false);
  const lockRef = useRef(false);
  const { currency, countryCode, formatPrice } = useI18n();
  const ADMIN_SKU_SP5K = "5-000-spanish-words-with-english-pronunciation-digital";
  const TIENDA_PATH_SP5K = "/checkouts/5000-spanish-words";
  const HOTMART_SP5K_LATAM = "https://pay.hotmart.com/L106545921C?checkoutMode=10";
  const pricing = useAdminPricing(ADMIN_SKU_SP5K);
  const tier = useCountryTierRouting(ADMIN_SKU_SP5K, {
    tiendaPath: TIENDA_PATH_SP5K,
    fallbackHotmartUrl: HOTMART_SP5K_LATAM,
    fallbackPriceGlobalUsd: 22,
    fallbackPriceLatamUsd: 19,
    fallbackPriceTiendaUsd: 10,
    fallbackPricePen: 45,
  });
  const currentPrice = tier.priceUsd;
  const pricingReady = tier.loaded;
  const { useTiendaOnly, useHotmartLatam, priceGlobalUsd, priceLatamUsd, priceTiendaUsd, pricePen } = tier;
  const localizedPrice = (tier.isPeru && pricePen && Number(pricePen) > 0) ? `S/${Number(pricePen).toFixed(2)}` : formatPrice(currentPrice);
  const localizedOriginal = formatPrice(ORIGINAL_PRICE);
  const flag = countryToFlag(countryCode);

  const pixelParams = useMemo(() => ({
    content_name: "Spanish Relax - 5,000 Words (Digital)",
    content_category: "Digital Book",
    content_ids: ["product-spanish-5000-digital"],
    content_type: "product",
    value: currentPrice,
    currency: "USD",
  }), [currentPrice]);
  useHotmartPixel(pixelParams);
  useTrackProductView({
    productId: "product-spanish-5000-digital",
    productName: "Spanish Relax - 5,000 Words (Digital)",
    price: currentPrice,
    currency: "USD",
    category: "Digital Book",
  });
  useScrollTimeTracking("product_spanish_5000_digital");

  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  const buildCartItem = () => ({
    id: "5000-spanish-words",
    name: "5,000 Spanish Words with English Pronunciation (Digital PDF)",
    price: currentPrice,
    pricePen: pricePen ?? undefined,
    regionPrices: { 
      latam: priceLatamUsd, 
      global: priceGlobalUsd, 
      tienda: priceTiendaUsd 
    },
    localUsdPrices: pricing.localUsdPrices ?? undefined,
    image: "/images/product-5000-spanish.webp",
    description: "5,000 vocabulary words in Spanish with English pronunciation",
    quantity: 1,
  });

  const handleBuyNow = () => {
    if (!pricingReady) return;
    if (lockRef.current) return;
    lockRef.current = true;
    setIsRedirecting(true);
    if (useTiendaOnly) {
      // Fire Meta Pixel only for our own /checkouts page. Hotmart embeds the
      // same pixel id, so firing here for Hotmart routes would double-count.
      trackHotmartEvent("InitiateCheckout", {
        content_name: "Spanish Relax - 5,000 Words (Digital)",
        content_category: "Digital Book",
        content_ids: ["product-spanish-5000-digital"],
        content_type: "product",
        value: currentPrice,
        currency: "USD",
        num_items: 1,
      });
      addItem(buildCartItem());
      navigate(TIENDA_PATH_SP5K);
    } else {
      window.open(tier.hotmartUrl || HOTMART_SP5K_LATAM, "_blank", "noopener,noreferrer");
      lockRef.current = false;
      setIsRedirecting(false);
    }
  };

  const handleAddToCart = () => {
    if (!pricingReady) return;
    addItem(buildCartItem());
    toast.success("Product added to cart", {
      description: "Keep browsing or go to checkout.",
      action: {
        label: "Go to checkout",
        onClick: () => navigate(TIENDA_PATH_SP5K),
      },
    });
  };


  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <link rel="preload" as="image" href={productDigitalImage} />
      </Helmet>
      <SEO
        title={pricing.name ?? "5,000 Spanish Words PDF · English Pronunciation"}
        description={pricing.description ?? "Digital PDF with 5,000 essential Latin American Spanish words and English pronunciation. Includes 1,000 verbs and 500 questions. Instant download."}
        canonicalUrl="https://ilinguerelax.com/products/5-000-spanish-words-with-english-pronunciation-digital"
        image={pricing.coverImageUrl ?? "https://ilinguerelax.com/product-spanish-5000.webp"}
        type="product"
        price={String(currentPrice)}
        originalPrice={String(ORIGINAL_PRICE)}
        rating="4.8"
        reviewCount="500"
        sku="SPANISH-5000-DIGITAL"
        keywords="5000 Spanish words pdf, learn Spanish vocabulary, Spanish for English speakers, Spanish pronunciation guide, best Spanish ebook, Spanish A1 to C1, Spanish Relax digital, Spanish vocabulary book pdf, download Spanish book, Spanish for beginners"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Image */}
            <div className="relative">
              <div className="flex justify-center mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-[2px]">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white" strokeWidth={0} />
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800">Excellent</span>
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-600">★ Trustpilot</span>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-60 blur-3xl rounded-3xl" />
              <div className="relative">
                <img
                  src={productDigitalImage}
                  alt="Spanish Relax - 5,000 Spanish Words digital PDF"
                  className="w-full h-auto rounded-2xl shadow-hero"
                  width={1200}
                  height={1200}
                  fetchPriority="high"
                  decoding="async"
                />
                <PinterestSave overlay />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-black shadow-lg">
                  <Download className="w-3.5 h-3.5" /> DIGITAL PDF — INSTANT ACCESS
                </div>
                <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-black shadow-lg">
                  -{DISCOUNT_PCT}%
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-5">
              <LiveViewers minViewers={18} maxViewers={54} lang="en" />
              <PurchaseCounter />

              <h1 className="text-3xl md:text-5xl font-black leading-tight">
                {pricing.name ?? (<>Learn 5,000 Spanish Words —{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    with English Pronunciation
                  </span></>)}
              </h1>

              <p className="text-base md:text-lg text-muted-foreground">
                {pricing.description ?? (<>Digital-only PDF designed for English speakers learning Latin American Spanish. Every word written the way it{" "}
                <em>actually sounds</em>. No dictionaries, no stress — start speaking Spanish today.</>)}
              </p>

              {/* Price block */}
              <div className="p-5 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-4xl md:text-5xl font-black text-foreground">{tier.priceLabel}</span>
                  <span className="text-xl text-muted-foreground line-through mb-1 opacity-70">{tier.originalLabel}</span>
                  <span className="px-2 py-1 rounded-md bg-red-500 text-white text-xs font-black shadow-sm">
                    SAVE {DISCOUNT_PCT}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  One-time payment · Instant PDF · Escrito humano · Pago seguro
                </p>
                <Button
                  onClick={handleBuyNow}
                  disabled={isRedirecting || !pricingReady}
                  size="lg"
                  className="mt-4 w-full h-14 text-base font-black shadow-hero"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isRedirecting ? "Redirecting to secure checkout…" : `GET IT NOW — ${tier.priceLabel}`}
                </Button>

                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  size="lg"
                  className="mt-2 w-full h-12 text-sm font-bold border-2"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to cart
                </Button>
                <p className="text-[11px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> Secure checkout by Stripe · 30-day money-back guarantee
                </p>
              </div>

              <StockCounter />

              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-10 md:py-16">
        <div className="container px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black">Spanish Mastery System</h2>
            <p className="text-lg md:text-xl text-muted-foreground mt-2 font-bold text-foreground">
              The Complete Latin American Spanish Learning System — From A1 to C1
            </p>
            <p className="text-muted-foreground mt-4 max-w-3xl mx-auto">
              Master Spanish with a structured, progressive system designed to help you build vocabulary, strengthen grammar, master essential verbs, and practice real Spanish step by step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Features List */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" /> What’s Included
              </h3>
              <ul className="space-y-3">
                {[
                  "5,000 Spanish Words + Pronunciation (250 Pages) $43 now $30",
                  "Complete A1–C1 Grammar Guide — 250 Pages $34 now $25",
                  "1,000 Essential Spanish Verbs + English Pronunciation $27 now $20",
                  "500 Spanish Questions for Practice + English Pronunciation $25 now $15",
                  "Practical Exercises $20 now $10",
                  "Structured Study Plan FREE",
                  "Practice Materials FREE",
                  "Progressive A1 → C1 — Learning Path"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Journey Section */}
            <div className="p-6 md:p-8 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <h3 className="text-xl font-bold mb-4">Your Learning Journey</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Follow a clear path from beginner to advanced Spanish, combining vocabulary, grammar, verbs, questions, and exercises in one complete learning system.
              </p>
              
              <div className="relative pt-6 border-t border-primary/10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-black mb-3">
                  <Zap className="w-4 h-4" /> 🚀 Updates & Audio
                </div>
                <h4 className="font-bold text-base mb-2 text-foreground">Free Updates & Future Audio:</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Recibirás actualizaciones gratuitas del material directamente en tu correo de forma automática. 
                </p>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs font-bold text-red-600">
                    ⚠️ Próximamente subirá el precio con la inclusión del Audio Edition.
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-primary/10">
                  <h4 className="font-bold text-base mb-2 text-foreground flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> Want the physical book?
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get the 250-page printed edition delivered to your door + the digital version for FREE.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-primary/30 hover:bg-primary/5 text-primary font-bold"
                    onClick={() => window.location.href = "/products/5-000-spanish-words-with-english-pronunciation"}
                  >
                    UPGRADE TO PHYSICAL · {formatPrice(34.99)}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Look Inside */}
      <section className="py-12 md:py-20 bg-muted/30 overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Look Inside the Spanish Mastery System</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto font-medium">
              Take a closer look at the structured path, vocabulary pages, and practical exercises included in your digital bundle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                img: previewSpanishVocab, 
                title: "5,000 Spanish Words + Pronunciation (250 Pages) $43 now $30", 
                desc: "Every word is written the way it actually sounds in English. No phonetic symbols to learn." 
              },
              { 
                img: grammarPreviewAsset.url, 
                title: "Complete A1–C1 Grammar Guide — 250 Pages $34 now $25", 
                desc: "Clear explanations of Ser vs Estar and essential sentence structures." 
              },
              { 
                img: verbsV2PreviewAsset.url, 
                title: "1,000 Essential Spanish Verbs + English Pronunciation $27 now $20", 
                desc: "Comprehensive tables covering present, past, and future tenses with English pronunciation." 
              },
              { 
                img: questionsPreviewAsset.url, 
                title: "500 Spanish Questions for Practice + English Pronunciation $25 now $15", 
                desc: "Real-world conversational questions to build fluency and confidence." 
              },
              { 
                img: previewSpanishPhrases, 
                title: "Practical Exercises $20 now $10", 
                desc: "Real-world examples and exercises to reinforce what you've learned and build confidence." 
              },
              { 
                img: plannerPreviewAsset.url, 
                title: "Structured Study Plan FREE", 
                desc: "A step-by-step 4-step daily method to keep your routine consistent." 
              },
              { 
                img: examPreviewAsset.url, 
                title: "Practice Materials FREE", 
                desc: "Real tests to measure your vocabulary and grammar progress." 
              },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-white shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <p className="text-white text-sm font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <img 
                    src={item.img} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 z-20">
                    <div className="p-2 rounded-full bg-white/90 shadow-sm backdrop-blur-sm">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center md:text-left">
                  <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* How it works */}
      <section className="py-10 md:py-14 bg-muted/30">
        <div className="container px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-black">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: CreditCard, title: "1. Secure checkout", text: "Pay with card via Stripe. Takes less than a minute." },
              { icon: Download, title: "2. Instant PDF", text: "Download link delivered to your email right after payment." },
              { icon: Smartphone, title: "3. Learn anywhere", text: "Open the PDF on any device and start learning at your own pace." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="p-5 rounded-xl bg-card border border-border text-center">
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-10 md:py-14">
        <div className="container px-4 md:px-6">
          <Suspense fallback={<div className="h-40" />}>
            <LooxStyleReviews />
          </Suspense>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 md:py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container px-4 md:px-6 max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Ready to speak Spanish with confidence?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-6">
            5,000 essential Spanish words · English pronunciation · The Complete System.
            <br />
            <span className="text-accent font-bold mt-2 inline-block">⚠️ Price will increase when Audio Edition is released.</span>
          </p>
          <div className="flex items-baseline justify-center gap-3 mb-4">
            <span className="text-5xl font-black">{tier.priceLabel}</span>
            <span className="text-xl line-through text-muted-foreground">{tier.originalLabel}</span>
            <span className="px-2 py-1 rounded-md bg-red-500 text-white text-xs font-black">-{DISCOUNT_PCT}%</span>
          </div>
          <Button
            onClick={handleBuyNow}
            disabled={isRedirecting || !pricingReady}
            size="lg"
            className="h-14 px-8 text-base font-black shadow-hero"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {isRedirecting ? "Redirecting…" : `GET IT NOW — ${tier.priceLabel}`}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> Secure checkout · 30-day money-back guarantee
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="h-40" />}>
        <FAQ
          title="Frequently Asked Questions"
          subtitle="Everything about the digital PDF, learning materials, and delivery."
          items={[
            {
              question: "How do I receive the product after purchase?",
              answer: "As soon as your Stripe payment is confirmed, the Spanish Mastery System (PDF and all materials) is sent automatically to your email. If you don't see it, check your spam/promotions folder or write to hola@ilinguerelax.com.",
              icon: Download,
            },
            {
              question: "What's the difference between this and the physical book version?",
              answer: "This is the DIGITAL-ONLY edition (PDF). No shipping, no waiting: instant download. The physical book version is a separate product and includes the printed edition plus the digital PDF free.",
              icon: FileText,
            },
            {
              question: "Can I read it on my phone, tablet or computer?",
              answer: "Yes. It's a standard PDF that opens on any device — iPhone, Android, iPad, Mac, PC. Read it offline anytime.",
              icon: Smartphone,
            },
            {
              question: "Is the pronunciation in English or Spanish?",
              answer: "Every Spanish word is written with English pronunciation so you can read it the way it actually sounds — no phonetic symbols to learn.",
              icon: Globe,
            },
            {
              question: "Do you offer a refund?",
              answer: "Yes. 30-day money-back guarantee, no questions asked. Just email hola@ilinguerelax.com.",
              icon: Shield,
            },
          ]}
        />
      </Suspense>

      <Suspense fallback={<div className="h-20" />}>
        <Footer />
      </Suspense>

      <StickyBuyBar
        sku={ADMIN_SKU_SP5K}
        productName="Spanish 5,000 Words — Digital PDF"
        price={tier.priceLabel}
        originalPrice={tier.originalLabel}
        currencyCode={tier.currencyCode}
        flag={flag}
        usdValue={currentPrice}
        localUsdPrices={pricing.localUsdPrices}
        buyUrl={useTiendaOnly ? undefined : (tier.hotmartUrl || HOTMART_SP5K_LATAM)}
        onBuyClick={handleBuyNow}
        ctaText={useTiendaOnly ? `GET IT NOW — ${tier.priceLabel}` : `BUY ON HOTMART — ${tier.priceLabel}`}
        testimonials={shortTestimonials}
        lang="en"
        rating={4.8}
        reviewCount={500}
        calmMode
        dismissible
      />
      <ScrollToTop />
      <WhatsAppButton />
      <SalesNotification />
    </main>
  );
};

export default ProductSpanish5000Digital;
