import { useMemo, useRef, useState, Suspense, useEffect } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Check, BookOpen, Sparkles, Brain, Download, Zap, Shield, ShoppingCart,
  Star, Eye, Globe, Smartphone, FileText, CreditCard, ArrowRight, Package, Lock, Headphones, Layers, FilePlus
} from "lucide-react";


import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { useTrackProductView, useScrollTimeTracking } from "@/hooks/useGoogleAnalytics";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { PaymentLogos } from "@/components/checkout/PaymentLogos";
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

import productDigitalAsset from "@/assets/mastery-system-spanish-digital.png.asset.json";
const productDigitalImage = productDigitalAsset.url;
import previewSpanishVocab from "@/assets/preview-spanish-vocab.png";
import previewSpanishPhrases from "@/assets/preview-spanish-phrases.webp";
import { PinterestSave } from "@/components/PinterestSave";
import plannerPreviewAsset from "@/assets/previews/spanish-daily-planner-preview.png.asset.json";
import examPreviewAsset from "@/assets/previews/spanish-exam-preview.png.asset.json";
import grammarPreviewAsset from "@/assets/previews/spanish-grammar-preview.png.asset.json";
import verbsPreviewAsset from "@/assets/previews/spanish-verbs-preview.png.asset.json";
import questionsPreviewAsset from "@/assets/previews/spanish-questions-preview.png.asset.json";
import verbsV2PreviewAsset from "@/assets/spanish-verbs-preview.png.asset.json";

const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));
const LooxStyleReviews = lazy(() => import("@/components/LooxStyleReviews").then(m => ({ default: m.LooxStyleReviews })));


// Fallbacks (referenciales, el hook useCountryTierRouting manda)
const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/aFa5kC2OIchv2mA8m98IU0e";

const features = [
  "5,000 Spanish Words + Pronunciation (250 Pages)",
  "Complete A1–C1 Grammar Guide (250 Pages)",
  "1,000 Essential Spanish Verbs + English Pronunciation",
  "500 Spanish Questions for Practice + English Pronunciation",
  "Practical Exercises & Study Plan",
  "Digital PDF Version",
  "FREE Bonus: Future Audio & iLingue Relax App Access (Coming Soon)",
  "Instant PDF download · Secure Payment",
  "Progressive A1 → C1 Learning Path",
];

const benefits = [
  { icon: Headphones, title: "Future Audio & App Access", description: "FREE Bonus: Get the native pronunciation MP3s and iLingue Relax App access as soon as they launch." },
  { icon: Layers, title: "Digital Flashcards", description: "Ready-to-use decks for Anki/Quizlet to memorize the 5,000 words 3x faster." },
  { icon: Zap, title: "Learn Anywhere", description: "Study on your phone, tablet, or computer. Your Spanish vocabulary is always with you." },
  { icon: FilePlus, title: "Quick Conjugation Guide", description: "A high-impact miniguide for the most common 100 Spanish conversations." },
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
    "\"Best Spanish kit I've bought\" — Sarah, USA",
    "\"The pronunciation guide is a game changer\" — Sarah, USA",
    "\"Memorized 500 words in 1 week with flashcards\" — Julie, Canada",
    "\"The pronunciation makes it so easy\" — Tom, USA",
    "\"Perfect for reaching B2 level\" — Anna, Ireland",
    "\"Everything I needed in one kit\" — David, Australia"
  ];

  const [isRedirecting, setIsRedirecting] = useState(false);
  const lockRef = useRef(false);
  const { currency, countryCode, formatPrice, setCurrency, setCountryCode } = useI18n();
  const ADMIN_SKU_SP5K = "5-000-spanish-words-with-english-pronunciation-digital";
  const PRODUCT_SKU = "5-000-spanish-words-with-english-pronunciation-digital";
  const TIENDA_PATH_SP5K = `/checkouts/${PRODUCT_SKU}`;
  const HOTMART_SP5K_LATAM = "https://pay.hotmart.com/L106545921C?checkoutMode=10";
  const pricing = useAdminPricing(ADMIN_SKU_SP5K);
  const tier = useCountryTierRouting(ADMIN_SKU_SP5K, {
    tiendaPath: TIENDA_PATH_SP5K,
    fallbackHotmartUrl: HOTMART_SP5K_LATAM,
    fallbackPriceGlobalUsd: 72.99,
    fallbackPriceLatamUsd: 72.99,
    fallbackPriceTiendaUsd: 72.99,
    fallbackPricePen: 280,
  });
  const localizedPrice = tier.priceLabel;
  const localizedOriginal = tier.originalLabel;
  const currentPrice = tier.priceUsd;
  const pricingReady = tier.loaded;
  const { useTiendaOnly, useHotmartLatam, priceGlobalUsd, priceLatamUsd, priceTiendaUsd, pricePen } = tier;
  const flag = countryToFlag(countryCode);

  const pixelParams = useMemo(() => ({
    content_name: "Spanish Mastery System - Digital Only",
    content_category: "Digital Book",
    content_ids: ["product-spanish-5000-digital"],
    content_type: "product",
    value: currentPrice,
    currency: "USD",
  }), [currentPrice]);
  useHotmartPixel(pixelParams);
  useTrackProductView({
    productId: "product-spanish-5000-digital",
    productName: "Spanish Mastery System - Digital Only",
    price: currentPrice,
    currency: "USD",
    category: "Digital Book",
  });
  useScrollTimeTracking("product_spanish_5000_digital");

  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  const buildCartItem = () => ({
    id: "5000-spanish-words",
    name: "Spanish Mastery System - 5,000 Spanish Words (Digital PDF)",
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
    
    // Siempre al checkout propio: mandar al cliente a un sitio externo justo
    // en el momento de comprar rompe la confianza que ya ganamos en esta
    // página. Si Hotmart debe seguir disponible para algún país, se ofrece
    // como un método de pago MÁS dentro de este mismo checkout (panel
    // /admin/checkout-methods), no como un salto a otra web.
    trackHotmartEvent("AddToCart", {
      content_name: "Spanish Mastery System - Digital Only",
      content_category: "Digital Book",
      content_ids: ["product-spanish-5000-digital"],
      content_type: "product",
      value: currentPrice,
      currency: "USD",
      num_items: 1,
    });
    addItem(buildCartItem());
    navigate(TIENDA_PATH_SP5K);
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
        originalPrice={tier.compareAtPriceUsd ? String(tier.compareAtPriceUsd) : undefined}
        rating={String(pricing.rating ?? 4.8)}
        reviewCount={String(pricing.reviewCount ?? 500)}
        sku={ADMIN_SKU_SP5K}
        keywords="5000 Spanish words pdf, learn Spanish vocabulary, Spanish for English speakers, Spanish pronunciation guide, best Spanish ebook, Spanish A1 to C1, Spanish Relax digital, Spanish vocabulary book pdf, download Spanish book, Spanish for beginners"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-0 sm:px-6 w-full max-w-full overflow-hidden box-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center w-full max-w-full overflow-hidden">
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
                  loading="eager"
                  decoding="async"
                />
                <PinterestSave overlay />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-black shadow-lg">
                  <Download className="w-3.5 h-3.5" /> DIGITAL PDF — INSTANT ACCESS
                </div>
                {tier.isOnSale && (
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-black shadow-lg">
                    -{tier.discountPercentage}%
                  </div>
                )}
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-5 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-2 justify-center md:justify-start">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-700">{pricing.rating ?? 4.8}/5 ({pricing.reviewCount ?? 500}+ student reviews)</span>
                </div>
              </div>
              
              <LiveViewers minViewers={18} maxViewers={54} lang="en" />
              <PurchaseCounter />

              <h1 className="text-xl sm:text-2xl md:text-5xl font-black leading-tight text-slate-900 break-words text-center md:text-left overflow-x-hidden w-full max-w-full px-1 mx-auto">
                {pricing.name ?? (<>Spanish Mastery System: 5,000 Essential Words —{" "}
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    with English Pronunciation
                  </span></>)}
              </h1>

              <p className="text-base md:text-lg text-muted-foreground text-center md:text-left mx-auto">
                {pricing.description ?? (<>Digital-only PDF designed for English speakers learning Latin American Spanish. Every word written the way it{" "}
                <em>actually sounds</em>. No dictionaries, no stress — start speaking Spanish today.</>)}
              </p>

              <div className="w-full mx-auto p-3 sm:p-5 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden w-full max-w-full box-border">
                <div className="flex items-end gap-2 sm:gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground">{tier.priceLabel}</span>
                  {tier.isOnSale && (
                    <>
                      <span className="text-lg sm:text-xl text-muted-foreground line-through mb-1 opacity-70">{tier.originalLabel}</span>
                      <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] sm:text-xs font-black shadow-lg">
                        SAVE {tier.discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[10px] sm:text-sm text-muted-foreground mt-1">
                  One-time payment · Instant Access · Secure Checkout
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-4 items-center">
                  <Button
                    onClick={handleBuyNow}
                    disabled={isRedirecting || !pricingReady}
                    size="lg"
                    className="w-full h-14 text-base font-black shadow-hero bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {isRedirecting ? "Redirecting to secure checkout…" : `GET THE FULL KIT — ${tier.priceLabel}`}
                  </Button>
                  
                </div>

                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  size="lg"
                  className="mt-2 w-full h-12 text-sm font-bold border-2"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to cart
                </Button>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-center gap-6 grayscale opacity-60">
                    <PaymentLogos />
                  </div>
                </div>
              </div>

              {/* Added Trust Icons */}
              <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-md mx-auto md:mx-0">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Secure</div>
                    <div className="text-xs font-bold text-slate-700">AES-256 SSL</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Delivery</div>
                    <div className="text-xs font-bold text-slate-700">Instant Email</div>
                  </div>
                </div>
              </div>

              <StockCounter />

            </div>
          </div>
        </div>
      </section>

      {/* Content Section - High Conversion */}
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-12 items-start">
            {/* Left: Benefits & Features (Clean & Fast) */}
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl md:text-5xl font-black mb-6 text-slate-900 leading-tight">Master Spanish Without the Struggle</h2>
                <p className="text-xl text-slate-600 font-medium leading-relaxed">
                  Most apps only teach you words. Our system gives you the <span className="text-emerald-600 font-black italic underline decoration-emerald-200">Tools</span>, the <span className="text-emerald-600 font-black italic underline decoration-emerald-200">Context</span>, and the <span className="text-emerald-600 font-black italic underline decoration-emerald-200">Native Sounds</span> to start speaking today.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 transition-all duration-300 shadow-sm">
                    <benefit.icon className="w-6 h-6 text-emerald-600 mb-3" />
                    <h3 className="font-bold text-sm mb-1 text-slate-900">{benefit.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{benefit.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                  <Check className="w-5 h-5 text-emerald-600" /> Included Today (Instant Download):
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-8">
                  {[
                    "5,000 Words + Pronunciation (250 Pages)",
                    "A1–C1 Grammar Guide (250 Pages)",
                    "1,000 Essential Verbs + Pronunciation",
                    "500 Practice Questions + Pronunciation",
                    "Interactive Flashcards (Anki/Quizlet)",
                    "Top 100 Conversations Miniguide",
                    "7-Day Money-Back Guarantee",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Launch Bonuses (Early Access):
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    "Future Audio MP3 Pack (FREE Bonus)",
                    "iLingue Relax App (FREE Early Access)",
                    "Free Lifetime Updates",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-900">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Star className="w-3 h-3 text-amber-600 fill-amber-600" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Featured Review Box (Conversion Booster) */}
            <div className="lg:sticky lg:top-32 space-y-6">
              <div className="p-8 rounded-3xl bg-emerald-600 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Star className="w-24 h-24 fill-white" />
                </div>
                <div className="relative z-10">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-white text-white" />
                    ))}
                  </div>
                  <p className="text-xl font-bold italic mb-6 leading-relaxed">
                    "I've tried every app out there, but this is the first time I actually feel confident speaking. The English pronunciation system for the 5,000 words is pure genius!"
                  </p>
                  <div className="flex items-center gap-4 border-t border-white/20 pt-6">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-xl">M</div>
                    <div>
                      <div className="font-black">Michelle R.</div>
                      <div className="text-sm text-white/70">Verified Student · USA</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
                <div className="text-center">
                  <div className="text-4xl font-black text-slate-900 mb-2">5,000+</div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Happy Learners</div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {["🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇮🇪"].map(f => (
                      <span key={f} className="text-2xl grayscale hover:grayscale-0 cursor-default transition-all">{f}</span>
                    ))}
                  </div>
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
                title: "5,000 Spanish Words + Pronunciation (250 Pages) — Included", 
                desc: "Every word is written the way it actually sounds in English. No phonetic symbols to learn." 
              },
              { 
                img: grammarPreviewAsset.url, 
                title: "Complete A1–C1 Grammar Guide (250 Pages) — Included", 
                desc: "Clear explanations of Ser vs Estar and essential sentence structures." 
              },
              { 
                img: verbsV2PreviewAsset.url, 
                title: "1,000 Essential Spanish Verbs + English Pronunciation — Included", 
                desc: "Comprehensive tables covering present, past, and future tenses with English pronunciation." 
              },
              { 
                img: questionsPreviewAsset.url, 
                title: "500 Spanish Questions for Practice + English Pronunciation — Included", 
                desc: "Real-world conversational questions to build fluency and confidence." 
              },
              { 
                img: previewSpanishPhrases, 
                title: "Practical Exercises — Included", 
                desc: "Real-world examples and exercises to reinforce what you've learned and build confidence." 
              },

              { 
                img: plannerPreviewAsset.url, 
                title: "Structured Study Plan — Included", 
                desc: "A step-by-step 4-step daily method to keep your routine consistent." 
              },
              { 
                img: examPreviewAsset.url, 
                title: "Practice Materials — Included", 
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
      <section className="py-16 md:py-24 bg-slate-50 border-y border-slate-100">
        <div className="container px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">Your Path to Fluency</h2>
            <p className="text-slate-600 mt-4 text-lg">Three simple steps to start speaking Spanish like a native.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: CreditCard, title: "1. Secure Access", text: "Choose your payment method. Encrypted and 100% secure via Stripe." },
              { icon: Download, title: "2. Instant Delivery", text: "Your complete interactive kit is sent to your email the second you finish." },
              { icon: Smartphone, title: "3. Interactive Learning", text: "Use our PDF, MP3s, and Flashcards on any device, anywhere." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm text-center group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 transition-colors">
                  <Icon className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
                <p className="text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="bg-slate-50 py-16 md:py-24" id="reviews">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 border-b border-slate-200 pb-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                ))}
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                Trusted by 5,000+ Students Worldwide
              </h2>
              <p className="text-slate-600 mt-4 text-lg">
                See why students are switching to our English-based pronunciation system.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="text-center border-r border-slate-100 pr-4">
                  <div className="text-2xl font-black text-emerald-600">4.8</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-900">100%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guaranteed</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden mb-12 w-full max-w-full box-border text-center md:text-left">
            <div className="relative z-10 flex-1 w-full max-w-full overflow-hidden px-2">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Physical Edition Available</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-2 break-words">Want the Physical Printed Book?</h3>
              <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto md:mx-0 break-words leading-relaxed">
                Get the luxury physical book shipped to your door and receive the full Digital Mastery Kit (PDF, MP3s, Flashcards) 100% FREE.
              </p>
            </div>
            <div className="w-full md:w-auto px-2">
              <Button
                onClick={() => navigate("/products/5-000-spanish-words-with-english-pronunciation-physical")}
                className="w-full relative z-10 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-6 text-base font-black text-white shadow-xl hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95 h-auto whitespace-normal text-center"
              >
                Get Physical Book + Free Digital — {formatPrice(44.00, currency)}
              </Button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-3xl -mr-32 -mt-32 rounded-full" />
          </div>

          <Suspense fallback={<div className="h-40" />}>
            <LooxStyleReviews />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={<div className="h-40" />}>
        <div className="[&>section]:py-8 md:[&>section]:py-10">
        <FAQ
          title="Frequently Asked Questions"
          subtitle="Everything about the digital Mastery System, learning materials, and delivery."
          items={[
            {
              question: "What exactly is included in the Mastery System?",
              answer: "You get a complete interactive kit: The 5,000 Words & Pronunciation Guide (250 Pages), A1–C1 Grammar Manual (250 Pages), 1,000 Essential Verbs, 500 Conversational Questions, and Digital Flashcards for Anki/Quizlet. PLUS: You get Early Access to the Native Audio MP3 Pack and the future iLingue Relax App as a launch bonus.",
              icon: FileText,
            },
            {
              question: "When will I receive the Audio Modules and App access?",
              answer: "The Audio Pack and App are currently in final development. By purchasing today, you lock in 'Early Access'. You will receive the instant PDF and Flashcard materials immediately, and the bonuses will be sent to your email automatically as soon as they launch, with no extra cost.",
              icon: Zap,
            },
            {
              question: "How do I receive the kit after purchase?",
              answer: "Instantly. As soon as your payment is confirmed, you'll get a download link for all PDF and flashcard materials sent directly to your email. Bonuses will follow via the same email upon release.",
              icon: Download,
            },
            {
              question: "Can I use the flashcards on my phone?",
              answer: "Absolutely. We provide the decks formatted for Anki and Quizlet, which have free mobile apps. You can study your 5,000 words while commuting or waiting in line.",
              icon: Smartphone,
            },
            {
              question: "Is the audio from native speakers?",
              answer: "Yes. All audio modules feature native Latin American Spanish speakers so you learn the correct accent and rhythm from day one.",
              icon: Headphones,
            },
            {
              question: "Is the pronunciation in English or Spanish?",
              answer: "Every Spanish word is written with a unique English-based pronunciation system so you can read it correctly even if you've never spoken Spanish before.",
              icon: Globe,
            },
            {
              question: "Do you offer a guarantee?",
              answer: "Yes. We offer a 7-day, no-questions-asked money-back guarantee. If you don't feel you're learning faster, just email us for a full refund.",
              icon: Shield,
            },
          ]}
        />
        </div>
      </Suspense>


      <Suspense fallback={<div className="h-20" />}>
        <Footer />
      </Suspense>

      <StickyBuyBar
        sku={PRODUCT_SKU}
        productName={pricing.name ?? "Spanish Mastery System — DIGITAL PDF"}
        price={tier.priceLabel}
        originalPrice={tier.isOnSale ? (tier.originalLabel || undefined) : undefined}
        currencyCode={tier.currencyCode}
        flag={pricingReady ? (currency === "USD" ? "🇺🇸" : currency === "EUR" ? "🇪🇺" : currency === "GBP" ? "🇬🇧" : currency === "AUD" ? "🇦🇺" : currency === "CAD" ? "🇨🇦" : "🌎") : undefined}
        usdValue={currentPrice}
        localUsdPrices={pricing.localUsdPrices}
        buyUrl={undefined}
        onBuyClick={handleBuyNow}
        ctaText={`GET IT NOW — ${tier.priceLabel}`}
        testimonials={shortTestimonials}
        lang="en"
        rating={pricing.rating ?? 4.8}
        reviewCount={pricing.reviewCount ?? 500}
        calmMode
      />
      <ScrollToTop />
      
      <WhatsAppButton />
      <SalesNotification />
    </main>
  );
};

export default ProductSpanish5000Digital;
