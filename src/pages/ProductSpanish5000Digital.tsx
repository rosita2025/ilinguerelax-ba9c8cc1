import { useMemo, useRef, useState, Suspense } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Check, BookOpen, Sparkles, Brain, Download, Zap, Shield, ShoppingCart,
  Star, Eye, Globe, Smartphone, FileText, CreditCard, Gift, ArrowRight,
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
import bonus1Image from "@/assets/bonus-1-spanish-exam.webp";
import bonus2Image from "@/assets/bonus-2-daily-planner.webp";
import bonus3Image from "@/assets/bonus-3-pronunciation.webp";
import previewSpanishVocab from "@/assets/preview-spanish-vocab.png";
import previewSpanishPhrases from "@/assets/preview-spanish-phrases.webp";
import previewSpanishIndex from "@/assets/preview-spanish-index.png";
import { PinterestSave } from "@/components/PinterestSave";

const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));
const LooxStyleReviews = lazy(() => import("@/components/LooxStyleReviews").then(m => ({ default: m.LooxStyleReviews })));


const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/aFa5kC2OIchv2mA8m98IU0e";
const PRICE = 22;
const ORIGINAL_PRICE = 35;
const DISCOUNT_PCT = Math.round(((ORIGINAL_PRICE - PRICE) / ORIGINAL_PRICE) * 100);

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
  { icon: Download, title: "Instant Download", description: "Get immediate access to your PDF right after purchase. Start learning Spanish in minutes." },
  { icon: Zap, title: "Learn Anywhere", description: "Study on your phone, tablet, or computer. Your Spanish vocabulary is always with you." },
  { icon: Sparkles, title: "Stress-Free Method", description: "Learn at your own pace with a relaxed method that respects your process." },
  { icon: Brain, title: "No Dictionaries Needed", description: "Meanings, pronunciation, and examples all in one place." },
];

const bonuses = [
  {
    title: "BONUS #1 · Spanish Exam Test",
    subtitle: "Measure your progress with self-graded tests.",
    image: bonus1Image,
    value: "$19",
  },
  {
    title: "BONUS #2 · Daily Planner",
    subtitle: "A printable planner to keep your study routine consistent.",
    image: bonus2Image,
    value: "$14",
  },
  {
    title: "BONUS #3 · Pronunciation Guide",
    subtitle: "A guide with the tricky Spanish sounds and how to master them.",
    image: bonus3Image,
    value: "$17",
  },
];

const BonusPreviewDialog = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5">
        <Eye className="w-4 h-4" /> See sample
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </DialogHeader>
      <div className="relative mx-auto w-full bg-white text-slate-900 rounded-lg shadow-lg overflow-hidden border border-border">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10 select-none">
          <span className="text-5xl md:text-6xl font-black text-slate-900/10 -rotate-45 tracking-widest whitespace-nowrap">
            PREVIEW · ilinguerelax.com
          </span>
        </div>
        <div className="relative p-6 md:p-8">{children}</div>
      </div>
      <p className="text-xs text-center text-muted-foreground mt-2">
        This is a 1-page sample. Full PDF delivered after purchase.
      </p>
    </DialogContent>
  </Dialog>
);

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
    regionPrices: { latam: priceLatamUsd, global: priceGlobalUsd, tienda: priceTiendaUsd },
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
        description={pricing.description ?? "Digital PDF with 5,000 essential Spanish words and English pronunciation. 3 free bonuses. Launch price $22 (was $35). Instant download."}
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
                {pricing.description ?? (<>Digital-only PDF designed for English speakers. Every word written the way it{" "}
                <em>actually sounds</em>. No dictionaries, no stress — start speaking Spanish today.</>)}
              </p>

              {/* Price block */}
              <div className="p-5 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-4xl md:text-5xl font-black text-foreground">{tier.priceLabel}</span>
                  <span className="text-xl text-muted-foreground line-through mb-1">{tier.originalLabel}</span>
                  <span className="px-2 py-1 rounded-md bg-red-500 text-white text-xs font-black">
                    SAVE {DISCOUNT_PCT}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  One-time payment · Instant PDF download · Includes 3 free bonuses
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

      {/* Benefits */}
      <section className="py-10 md:py-14 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-black">Why this PDF works</h2>
            <p className="text-muted-foreground mt-2">Built to save you months of dictionary-hopping.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="p-5 rounded-xl bg-card border border-border"
              >
                <Icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview pages */}
      <section className="py-10 md:py-14">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-black">Take a peek inside</h2>
            <p className="text-muted-foreground mt-2">Real sample pages from the PDF.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { src: previewSpanishIndex, alt: "5,000 Spanish Words PDF — Table of contents sample page (Spanish for English speakers)" },
              { src: previewSpanishVocab, alt: "5,000 Spanish Words PDF — Vocabulary sample page with English pronunciation" },
              { src: previewSpanishPhrases, alt: "5,000 Spanish Words PDF — Real-life phrases sample page with English pronunciation" },
            ].map((p, i) => (
              <img
                key={i}
                src={p.src}
                alt={p.alt}
                className="w-full h-auto rounded-xl border border-border shadow-md"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Bonuses */}
      <section className="py-10 md:py-14 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-black mb-3">
              <Gift className="w-4 h-4" /> INCLUDED FREE
            </div>
            <h2 className="text-2xl md:text-4xl font-black">3 exclusive bonuses (worth $50)</h2>
            <p className="text-muted-foreground mt-2">Added to your download at no extra cost.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bonuses.map(b => (
              <div key={b.title} className="p-5 rounded-2xl bg-card border border-border">
                <img src={b.image} alt={b.title} className="w-full h-40 object-cover rounded-lg mb-3" loading="lazy" />
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm">{b.title}</h3>
                  <span className="text-xs font-black text-primary">Value {b.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">{b.subtitle}</p>
                <BonusPreviewDialog title={b.title} subtitle={b.subtitle}>
                  <p className="text-sm">Sample content will be delivered inside your PDF.</p>
                </BonusPreviewDialog>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-10 md:py-14">
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

      {/* Physical book cross-sell */}
      <section className="py-8 md:py-10 bg-background">
        <div className="container px-4 md:px-6 max-w-3xl">
          <a
            href="/products/5-000-spanish-words-with-english-pronunciation-physical"
            className="block p-5 md:p-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 hover:border-primary transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary mb-1">
                  Are you interested?
                </p>
                <h3 className="text-lg md:text-xl font-black text-foreground">
                  Get the Physical Book edition
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Printed book + digital PDF included. Ships worldwide.
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary shrink-0" />
            </div>
          </a>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-10 md:py-14 bg-muted/30">
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
            5,000 essential Spanish words · English pronunciation · 3 free bonuses.
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
          subtitle="Everything about the digital PDF, bonuses, and delivery."
          items={[
            {
              question: "How do I receive the PDF after purchase?",
              answer: "As soon as your Stripe payment is confirmed, the 5,000 Words digital PDF and the 3 free bonuses are sent automatically to your email. If you don't see it, check your spam/promotions folder or write to hola@ilinguerelax.com.",
              icon: Download,
            },
            {
              question: "What's the difference between this and the physical book version?",
              answer: "This is the DIGITAL-ONLY edition (PDF). No shipping, no waiting: instant download for $22. The physical book version is a separate product and includes the printed edition plus the digital PDF free.",
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
        productName="Spanish 5,000 Words — Digital PDF"
        price={tier.priceLabel}
        originalPrice={tier.originalLabel}
        currencyCode={tier.currencyCode}
        flag={flag}
        buyUrl={useTiendaOnly ? TIENDA_PATH_SP5K : (tier.hotmartUrl || HOTMART_SP5K_LATAM)}
        onBuyClick={handleBuyNow}
        ctaText={useTiendaOnly ? `GET IT NOW — ${tier.priceLabel}` : `BUY ON HOTMART — ${tier.priceLabel}`}

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
