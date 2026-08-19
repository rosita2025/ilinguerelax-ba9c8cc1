import { useState, useMemo, useRef, Suspense, useEffect } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useCartStore } from "@/stores/cartStore";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAbTest } from "@/hooks/useAbTest";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { useI18n } from "@/i18n/I18nContext";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { StickyBuyBar } from "@/components/StickyBuyBar";

import { CountdownTimer } from "@/components/CountdownTimer";
import { LiveViewers } from "@/components/LiveViewers";
import SalesNotification from "@/components/SalesNotification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import bonus1Image from "@/assets/bonus-1-spanish-exam.webp";
import bonus1ImageAvif from "@/assets/bonus-1-spanish-exam.avif";
import bonus2Image from "@/assets/bonus-2-daily-planner.webp";
import bonus2ImageAvif from "@/assets/bonus-2-daily-planner.avif";
import bonus3Image from "@/assets/bonus-3-pronunciation.webp";
import bonus3ImageAvif from "@/assets/bonus-3-pronunciation.avif";
import { Check, BookOpen, Sparkles, ArrowRight, Brain, User, FileText, GraduationCap, Lightbulb, CreditCard, Globe, Download, Zap, Shield, ShoppingCart, Star, ChevronDown, ChevronUp, Eye, Package, Tag, BadgeCheck, Truck, CalendarClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Product image
import productSpanish5000Image from "@/assets/spanish-5000-physical-cover.webp";
import productSpanish5000BundleImage from "@/assets/spanish-relax-physical-digital-bundle.webp";
import productSpanish5000BundleImageAvif from "@/assets/spanish-relax-physical-digital-bundle.avif";
import productGrammarPatternsImage from "@/assets/product-grammar-patterns-a1c1.webp";
import product3000VerbsImage from "@/assets/product-spanish-3000-verbs-book.webp";
import productSpanish5000DigitalOnlyImage from "@/assets/spanish-5000-digital-only.webp";

import previewSpanishVocab from "@/assets/preview-spanish-vocab.png";
import previewSpanishPhrases from "@/assets/preview-spanish-phrases.webp";
import previewSpanishIndex from "@/assets/preview-spanish-index.png";
import previewSpanishUpdates from "@/assets/preview-spanish-updates.jpg";

// Conversion components
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { StoreSubscriptionCard } from "@/components/StoreSubscriptionCard";
import { useCampaignPrice } from "@/hooks/useCampaignPrice";

// Lazy-loaded below-the-fold components for faster initial load
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const LooxStyleReviews = lazy(() => import("@/components/LooxStyleReviews").then(m => ({ default: m.LooxStyleReviews })));

const Top3ReviewsCarousel = lazy(() => import("@/components/Top3ReviewsCarousel").then(m => ({ default: m.Top3ReviewsCarousel })));
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));
const InfluencerVideoCarousel = lazy(() => import("@/components/InfluencerVideoCarousel").then(m => ({ default: m.InfluencerVideoCarousel })));
import { useTrackProductView, useScrollTimeTracking } from "@/hooks/useGoogleAnalytics";

// Store logos
import logoEbay from "@/assets/logo-ebay.png";
import logoShopify from "@/assets/logo-shopify.png";
import { PinterestSave } from "@/components/PinterestSave";

// Shopify product info for cart
const SHOPIFY_VARIANT_ID = "gid://shopify/ProductVariant/42931924795453";
const features = ["5,000+ essential Spanish words", "English pronunciation included", "Designed for English speakers", "No dictionary needed", "Stress-free step-by-step method", "UK & USA phonetics included", "Instant PDF download", "Study on any device"];
const benefits = [{
  icon: Download,
  title: "Instant Download",
  description: "Get immediate access to your PDF right after purchase. Start learning Spanish in minutes!"
}, {
  icon: Zap,
  title: "Learn Anywhere",
  description: "Study on your phone, tablet, or computer. Your Spanish vocabulary is always with you."
}, {
  icon: Sparkles,
  title: "Stress-Free Method",
  description: "Learn at your own pace with our relaxed methodology that respects your learning process."
}, {
  icon: Brain,
  title: "No Dictionaries Needed",
  description: "Everything you need is included. Meanings, pronunciation, and examples all in one place."
}];

// ============= Bonus Preview Dialog =============
type BonusPreviewProps = {
  triggerLabel?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};
const BonusPreviewDialog = ({ triggerLabel = "See sample", title, subtitle, children }: BonusPreviewProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5">
        <Eye className="w-4 h-4" /> {triggerLabel}
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </DialogHeader>
      {/* Simulated PDF page */}
      <div className="relative mx-auto w-full bg-white text-slate-900 rounded-lg shadow-lg overflow-hidden border border-border">
        {/* Diagonal watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10 select-none">
          <span className="text-5xl md:text-6xl font-black text-slate-900/10 -rotate-45 tracking-widest whitespace-nowrap">
            PREVIEW · ilinguerelax.com
          </span>
        </div>
        <div className="relative p-6 md:p-8">
          {children}
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground mt-2">
        This is a 1-page sample. Full PDF delivered after purchase.
      </p>
    </DialogContent>
  </Dialog>
);

const ProductSpanish5000 = () => {
  const { formatPrice, currency, countryCode } = useI18n();
  const PRODUCT_SKU = "5-000-spanish-words-with-english-pronunciation-physical";
  const productPricing = useAdminPricing(PRODUCT_SKU);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    if (productPricing.coverImageUrl) {
      setActiveImage(productPricing.coverImageUrl);
    }
  }, [productPricing.coverImageUrl]);


  // Configuración de precios dinámica basada en SKU
  const tier = useCountryTierRouting(PRODUCT_SKU, {
    fallbackPriceGlobalUsd: 44,
    fallbackPriceLatamUsd: 44,
    fallbackPriceTiendaUsd: 44,
    fallbackPricePen: 168.40,
  });

  const campaign = useMemo(() => {
    return {
      price: tier.priceLabel,
      originalPrice: tier.originalLabel || undefined,
      currency: tier.currencyCode,
      discountPercentage: tier.discountPercentage,
      finalPriceAmount: tier.finalPriceAmount,
      priceUsd: tier.priceUsd
    };
  }, [tier]);

  // Meta Pixel ViewContent event - using Hotmart pixel only
  const pixelParams = useMemo(() => ({
    content_name: "Spanish Relax - 5,000 Words",
    content_category: "Digital Book",
    content_ids: ["product-spanish-5000"],
    content_type: "product",
    value: 34.99,
    currency: "USD"
  }), []);
  useHotmartPixel(pixelParams);
  // Google Analytics 4: product_view + scroll/time tracking
  useTrackProductView({
    productId: "product-spanish-5000",
    productName: "Spanish Relax - 5,000 Words",
    price: 34.99,
    currency: "USD",
    category: "Digital Book",
  });
  useScrollTimeTracking("product_spanish_5000");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isCreatingDigitalCheckout, setIsCreatingDigitalCheckout] = useState(false);
  
  const navigate = useNavigate();
  const checkoutLockRef = useRef(false);

  const addItem = useCartStore(state => state.addItem);

  // A/B test: main headline (50/50 split, persisted per browser)
  const headlineVariant = useAbTest(
    "spanish5000_headline_v1",
    ["A_speak7days", "B_5000words"] as const,
  );

  // A/B test: sticky bar CTA copy (3-way split)
  const ctaVariant = useAbTest(
    "spanish5000_sticky_cta_v1",
    ["A_add_to_cart", "B_i_want_to_buy", "C_download_now"] as const,
  );
  const ctaTextByVariant: Record<string, string> = {
    A_add_to_cart: "BUY NOW",
    B_i_want_to_buy: "BUY NOW",
    C_download_now: "BUY NOW",
  };
  const stickyCtaText = "BUY NOW";

  // Physical book — Stripe checkout with international shipping.
  const isPhysicalBundle = true;
  const dynamicCtaText = stickyCtaText;
  const stickyPriceLabel = campaign.price;
  const stickyOriginalLabel = campaign.originalPrice;
  const stickyCurrency = campaign.currency;
  const handleStickyBuy = async () => {
    navigate('/checkout/5-000-spanish-words-with-english-pronunciation-physical');
  };

  const handleBuyNow = async () => {
    navigate('/checkout/5-000-spanish-words-with-english-pronunciation-physical');
  };

  const handleViewDigital = () => {
    navigate("/products/5-000-spanish-words-with-english-pronunciation-digital");
  };

  const ADMIN_SKU_DIGITAL = "5-000-spanish-words-with-english-pronunciation-digital";
  const TIENDA_PATH_DIGITAL = "/checkouts/5000-spanish-words";
  
  const digitalPricing = useAdminPricing(ADMIN_SKU_DIGITAL);
  const digitalTier = useCountryTierRouting(ADMIN_SKU_DIGITAL, {
    tiendaPath: TIENDA_PATH_DIGITAL,
    fallbackPriceGlobalUsd: 72.99,
    fallbackPriceLatamUsd: 72.99,
    fallbackPriceTiendaUsd: 72.99,
    fallbackPricePen: 280,
  });

  const digitalPriceLabel = digitalTier.priceLabel;
  const digitalOriginalLabel = digitalTier.originalLabel;
  const digitalDiscountPct = digitalTier.discountPercentage;

  return <main className="min-h-screen bg-background">
      <Helmet>
        <link rel="preload" as="image" href={productSpanish5000BundleImageAvif} type="image/avif" />
      </Helmet>
      <SEO title="5,000 Spanish Words Physical Book + Digital PDF FREE" description="Spanish Relax 5,000 Words physical book: learn 5,000 essential Spanish words with English pronunciation. Physical book + digital PDF FREE + 3 bonuses." canonicalUrl="https://ilinguerelax.com/products/5-000-spanish-words-with-english-pronunciation-physical" image="https://ilinguerelax.com/product-spanish-5000.webp" type="product" price="34.99" originalPrice="54" rating="4.8" reviewCount="500" sku="SPANISH-5000-PHYSICAL" keywords="5000 Spanish words physical book, learn Spanish for English speakers, Spanish vocabulary book, Spanish pronunciation, Spanish Relax book, Spanish ebook bundle" />
      <Navbar />

      {/* Hero Section */}
      <div className="w-full max-w-full overflow-x-hidden px-0 sm:px-2 box-border">
      <section className="pt-4 pb-6 md:pt-8 md:pb-10 w-full max-w-full overflow-x-hidden px-0 sm:px-4 box-border">
        <div className="container px-0 sm:px-4 w-full max-w-full overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            {/* Product Image */}
            <div className="relative">
              {/* Trustpilot-style badge — placed above product image, responsive 320/375/480+ */}
              <div className="flex justify-center mb-3">
                <div className="inline-flex items-center gap-1 xs:gap-1.5 px-2 xs:px-2.5 py-1 rounded-md bg-white border border-emerald-200 shadow-sm whitespace-nowrap">
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="inline-flex items-center justify-center w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-[2px]">
                        <Star className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 fill-white text-white" strokeWidth={0} />
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] xs:text-[11px] sm:text-xs font-bold text-slate-800 shrink-0">Excellent</span>
                  <span className="text-[10px] xs:text-[11px] sm:text-xs font-bold text-emerald-600 shrink-0">★ Trustpilot</span>
                </div>
              </div>

              <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-60 blur-3xl rounded-3xl" />
              <div className="relative group">
                <picture>
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt="Spanish Relax - Buy the physical book, get the digital version FREE"
                      className="w-full h-auto rounded-2xl shadow-hero transition-all duration-300"
                      width={1200}
                      height={1200}
                      fetchPriority="high"
                      decoding="async"
                      loading="eager"
                    />
                  ) : (
                    <>
                      <source type="image/avif" srcSet={productSpanish5000BundleImageAvif} />
                      <source type="image/webp" srcSet={productSpanish5000BundleImage} />
                      <img
                        src={productSpanish5000BundleImage}
                        alt="Spanish Relax - Buy the physical book, get the digital version FREE"
                        className="w-full h-auto rounded-2xl shadow-hero"
                        width={1200}
                        height={1200}
                        fetchPriority="high"
                        decoding="async"
                        loading="eager"
                      />
                    </>
                  )}
                  <PinterestSave overlay media={activeImage || productSpanish5000BundleImage} />
                </picture>
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-black shadow-lg">
                  <Package className="w-3.5 h-3.5" /> PHYSICAL + DIGITAL FREE
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {productPricing.galleryImages && productPricing.galleryImages.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {[productPricing.coverImageUrl || productSpanish5000BundleImage, ...productPricing.galleryImages].map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        activeImage === img ? "border-emerald-500 shadow-sm scale-95" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`Vista ${i + 1}`} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                        decoding="async"
                      />
                      {activeImage === img && (
                        <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-5 h-5 text-emerald-500 drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* Product Info */}
            <div>
              {/* Trending & Bonus Badge */}
              

              {/* Pre-headline trust strip — reduces bounce on cold traffic */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-purple-700">
                  #1 Spanish PDF for English speakers · 500+ buyers
                </span>
              </div>

              <h1
                className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground mb-3 leading-tight break-words text-center md:text-left overflow-x-hidden w-full max-w-full px-1 mx-auto"
                data-ab-experiment="spanish5000_headline_v1"
                data-ab-variant={headlineVariant ?? "loading"}
              >
                {headlineVariant === "B_5000words" ? (
                  <>
                    5,000 Spanish Words{" "}
                    <span className="text-purple-600">You Can Pronounce</span> Today
                  </>
                ) : (
                  <>
                    Speak Spanish in 7 Days —{" "}
                    <span className="text-purple-600">Without the Frustration</span> of Confusing Pronunciation
                  </>
                )}
              </h1>
              
              {/* Regional Pricing Display */}
              <div className="flex flex-col items-center md:items-start mb-6">
                <div className="flex items-baseline flex-wrap gap-x-3 gap-y-2 mb-2">
                  {tier.loaded ? (
                    <>
                      <span className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground leading-none">{campaign.price}</span>
                      <span className="text-lg sm:text-xl md:text-2xl text-muted-foreground line-through opacity-70">{campaign.originalPrice}</span>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <Skeleton className="h-12 w-48 sm:h-16 sm:w-64" />
                      <Skeleton className="h-8 w-24 opacity-50" />
                    </div>
                  )}
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg whitespace-nowrap">
                    SAVE {campaign.discountPercentage}%
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                  <Package className="w-3 h-3" /> Special Limited Offer
                </div>
              </div>

              <p className="text-base md:text-lg text-muted-foreground mb-4 text-center md:text-left mx-auto">
                <strong className="text-foreground">Buy the physical book and get the digital version FREE</strong> — plus <strong className="text-foreground">3 exclusive bonuses</strong> still available. 5,000 essential Spanish words written the way they <em>actually sound</em> in English.
              </p>

              {/* Benefits bullets — scannable above the fold */}
              <div className="flex flex-col items-center md:items-start my-4 w-full">
                <ul className="inline-block space-y-1.5 px-1 max-w-md text-left">
                  {[
                    "📦 Physical book shipped to your door (limited stock — no preorder)",
                    "📱 Digital PDF version included FREE — instant access",
                    "🎁 Only 3 bonuses left + lifetime updates",
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs sm:text-base text-foreground leading-tight">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reviews — responsive single row, no wrap on 320/375/480+ */}
              <div className="flex items-center justify-center md:justify-start gap-1 xs:gap-1.5 mb-4 whitespace-nowrap mx-auto md:mx-0">
                <div className="flex items-center gap-0.5 shrink-0">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <span className="font-bold text-foreground text-xs xs:text-sm shrink-0">4.8</span>
                <span className="text-muted-foreground text-[10px] xs:text-xs shrink-0">(500+)</span>
                <span className="inline-flex items-center gap-0.5 px-1 xs:px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-[9px] xs:text-[10px] sm:text-xs font-semibold shrink-0">
                  <BadgeCheck className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                  Verified
                </span>
              </div>

              {/* Buy Now CTA */}
              <div className="w-full mx-auto p-3 sm:p-5 mb-4 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden box-border">
                <Button
                  type="button"
                  size="xl"
                  onClick={() => navigate('/checkout/5-000-spanish-words-with-english-pronunciation-physical')}
                  className="w-full text-base sm:text-lg py-5 px-3 h-auto min-h-[56px] whitespace-normal touch-manipulation shadow-[0_8px_30px_rgba(234,179,8,0.45)] bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-slate-900 border border-amber-500 transition-all hover:scale-[1.02] active:scale-[0.99]"
                >
                  <span className="flex items-center justify-center gap-2 font-black text-sm sm:text-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    GET THE PHYSICAL + DIGITAL COMBO NOW · {campaign.price}
                  </span>
                </Button>
                <p className="text-[11px] text-center text-muted-foreground mt-2">
                  Secure card checkout (Stripe) · International shipping
                </p>
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/5 dark:border-emerald-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-foreground leading-snug">
                      <strong>International shipping:</strong> 🇺🇸 USA · 🇨🇦 Canada · 🇬🇧 UK · 🇦🇺 Australia · 🇳🇿 New Zealand — flat <strong>$8 USD</strong>.
                      <br />
                      📦 Delivery address and country collected at checkout.
                      <br />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">🎁 FREE shipping on orders over $50</span> (add 2+ books at checkout).
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent buyer micro-testimonial — fights buyer hesitation */}
              <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-foreground italic leading-snug">
                      "Finally a Spanish book that doesn't use weird symbols. I was speaking sentences on day 2."
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">— Sarah M., verified buyer · Texas, USA</p>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}

              {/* Influencer video carousel — social proof */}
              <div className="mt-6 -mx-4 md:-mx-0">
                <Suspense fallback={<div className="h-64" />}>
                <InfluencerVideoCarousel
                  onCta={() => {
                    const el = document.querySelector('[data-bundle-selector]') as HTMLElement | null;
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                      el.classList.add("ring-4", "ring-primary", "rounded-2xl");
                      setTimeout(() => el.classList.remove("ring-4", "ring-primary", "rounded-2xl"), 1800);
                    }
                  }}
                />
                </Suspense>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Top 3 reviews carousel — fills the gap before Meet the Author */}
      <Suspense fallback={<div className="h-32" />}>
        <Top3ReviewsCarousel />
      </Suspense>


      {/* Benefits */}
      <section className="pt-6 pb-12 md:pt-8 md:pb-16 bg-secondary/30">
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
            {benefits.map(benefit => <div key={benefit.title} className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-hero transition-all duration-500">
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
              </div>)}
          </div>
        </div>
      </section>

      {/* Digital Alternative Option */}
      <section className="py-14 md:py-20 bg-slate-900 text-white overflow-hidden w-full max-w-full box-border">
        <div className="container px-4 md:px-6 w-full max-w-full box-border">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <Download className="w-4 h-4" />
              Digital-Only Version
            </div>
            <h2 className="text-3xl md:text-4xl font-black leading-tight break-words px-2">
              Looking for a <span className="text-emerald-400">Digital-Only</span> version?
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed px-2">
              Get instant access to the PDF version without waiting for international shipping. 
              Study on your phone, tablet, or computer right away.
            </p>
            <div className="pt-4 px-2">
              <Button 
                onClick={handleViewDigital}
                size="xl"
                className="w-full max-w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-[0_8px_30px_rgba(16,185,129,0.3)] text-base sm:text-lg py-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] h-auto whitespace-normal text-center"
              >
                View Digital Version — {digitalTier.priceLabel}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">
              Instant Delivery via Email · Secure Checkout
            </p>
          </div>
        </div>
      </section>


      {/* What's Included */}
      <section className="pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
              Everything Included
            </h2>

            {/* Bonuses Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-purple-500/5 to-accent/5 p-6 md:p-10 shadow-card"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-4 border border-accent/20">
                  <Sparkles className="w-4 h-4" />
                  Limited Time Offer
                </div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                  Master the Spanish Language with{" "}
                  <span className="text-primary">'Spanish Relax'</span>
                </h3>
                <p className="mt-3 text-lg md:text-xl font-semibold text-foreground">
                  The Ultimate 5,000 Word System{" "}
                  <span className="text-accent">+ 3 FREE Bonuses!</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Bonus #1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 }}
                  className="relative bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-hero transition-all duration-300"
                >
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase">
                    <Sparkles className="w-3 h-3" /> Bonus #1
                  </div>
                  <div className="mt-3 mb-3 aspect-square w-full overflow-hidden rounded-xl border border-border">
                    <picture>
                      <source type="image/avif" srcSet={bonus1ImageAvif} />
                      <source type="image/webp" srcSet={bonus1Image} />
                      <img src={bonus1Image} alt="Complete Spanish Language Exam" className="w-full h-full object-cover" loading="lazy" decoding="async" width={600} height={600} />
                    </picture>
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-2">
                    Complete Spanish Language Exam
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    A complete PDF exam to test your Spanish vocabulary, grammar, and comprehension — track your real progress.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Download className="w-3.5 h-3.5" /> Instant PDF
                  </div>
                  <BonusPreviewDialog
                    title="Complete Spanish Language Exam"
                    subtitle="Sample page — 1 of 24"
                  >
                    <h3 className="text-xl font-bold mb-1 text-center">Complete Spanish Language Exam</h3>
                    <p className="text-center text-sm text-slate-600 mb-6">Section 1 — Vocabulary &amp; Grammar</p>
                    <ol className="space-y-4 text-sm">
                      <li>
                        <p className="font-semibold mb-1">1. What is the correct translation of "house"?</p>
                        <ul className="ml-5 space-y-0.5 text-slate-700">
                          <li>A) Coche</li><li>B) Casa</li><li>C) Perro</li><li>D) Libro</li>
                        </ul>
                      </li>
                      <li>
                        <p className="font-semibold mb-1">2. Choose the correct verb form: "Yo ___ español."</p>
                        <ul className="ml-5 space-y-0.5 text-slate-700">
                          <li>A) habla</li><li>B) hablo</li><li>C) hablas</li><li>D) hablan</li>
                        </ul>
                      </li>
                      <li>
                        <p className="font-semibold mb-1">3. Which word means "tomorrow"?</p>
                        <ul className="ml-5 space-y-0.5 text-slate-700">
                          <li>A) Ayer</li><li>B) Hoy</li><li>C) Mañana</li><li>D) Noche</li>
                        </ul>
                      </li>
                      <li>
                        <p className="font-semibold mb-1">4. Complete: "Ella ___ una manzana."</p>
                        <ul className="ml-5 space-y-0.5 text-slate-700">
                          <li>A) come</li><li>B) comes</li><li>C) comemos</li><li>D) comen</li>
                        </ul>
                      </li>
                      <li>
                        <p className="font-semibold mb-1">5. The opposite of "grande" is:</p>
                        <ul className="ml-5 space-y-0.5 text-slate-700">
                          <li>A) Alto</li><li>B) Pequeño</li><li>C) Bonito</li><li>D) Rápido</li>
                        </ul>
                      </li>
                    </ol>
                  </BonusPreviewDialog>
                </motion.div>

                {/* Bonus #2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="relative bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-hero transition-all duration-300"
                >
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase">
                    <Sparkles className="w-3 h-3" /> Bonus #2
                  </div>
                  <div className="mt-3 mb-3 aspect-square w-full overflow-hidden rounded-xl border border-border">
                    <picture>
                      <source type="image/avif" srcSet={bonus2ImageAvif} />
                      <source type="image/webp" srcSet={bonus2Image} />
                      <img src={bonus2Image} alt="Daily Study Planner — Spanish for English Speakers" className="w-full h-full object-cover" loading="lazy" decoding="async" width={600} height={600} />
                    </picture>
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-2">
                    Daily Study Planner
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    A printable planner to organize your daily learning routine and stay consistent without stress.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Download className="w-3.5 h-3.5" /> Instant PDF
                  </div>
                  <BonusPreviewDialog
                    title="Daily Study Planner"
                    subtitle="Sample page — Weekly template"
                  >
                    <h3 className="text-xl font-bold mb-1 text-center">Daily Study Planner</h3>
                    <p className="text-center text-sm text-slate-600 mb-6">Stay consistent — 15 minutes a day</p>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 p-2 text-left">Day</th>
                          <th className="border border-slate-300 p-2 text-left">Vocabulary</th>
                          <th className="border border-slate-300 p-2 text-left">Grammar</th>
                          <th className="border border-slate-300 p-2 text-left">Practice</th>
                          <th className="border border-slate-300 p-2 text-center">✓</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Monday", "20 new words", "Present tense", "Listen to podcast"],
                          ["Tuesday", "Review Mon.", "Articles", "Read short story"],
                          ["Wednesday", "20 new words", "Adjectives", "Speaking 5 min"],
                          ["Thursday", "Review Wed.", "Past tense", "Write a paragraph"],
                          ["Friday", "20 new words", "Questions", "Watch a video"],
                          ["Saturday", "Flashcards", "Review week", "Conversation"],
                          ["Sunday", "Rest / Recap", "—", "Self-test"],
                        ].map(([d, v, g, p]) => (
                          <tr key={d}>
                            <td className="border border-slate-300 p-2 font-semibold">{d}</td>
                            <td className="border border-slate-300 p-2">{v}</td>
                            <td className="border border-slate-300 p-2">{g}</td>
                            <td className="border border-slate-300 p-2">{p}</td>
                            <td className="border border-slate-300 p-2 text-center">☐</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </BonusPreviewDialog>
                </motion.div>

                {/* Bonus #3 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 }}
                  className="relative bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-hero transition-all duration-300"
                >
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase">
                    <Sparkles className="w-3 h-3" /> Bonus #3
                  </div>
                  <div className="mt-3 mb-3 aspect-square w-full overflow-hidden rounded-xl border border-border">
                    <picture>
                      <source type="image/avif" srcSet={bonus3ImageAvif} />
                      <source type="image/webp" srcSet={bonus3Image} />
                      <img src={bonus3Image} alt="Spanish Pronunciation Cheat Sheet" className="w-full h-full object-cover" loading="lazy" decoding="async" width={600} height={600} />
                    </picture>
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-2">
                    Spanish Pronunciation Cheat Sheet
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    A quick-reference sheet with phonetic rules so you can pronounce any Spanish word with confidence.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Download className="w-3.5 h-3.5" /> Instant PDF
                  </div>
                  <BonusPreviewDialog
                    title="Spanish Pronunciation Cheat Sheet"
                    subtitle="Sample page — Vowels &amp; key consonants"
                  >
                    <h3 className="text-xl font-bold mb-1 text-center">Spanish Pronunciation Cheat Sheet</h3>
                    <p className="text-center text-sm text-slate-600 mb-6">Pronounce any Spanish word with confidence</p>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 p-2 text-left">Letter</th>
                          <th className="border border-slate-300 p-2 text-left">Sound</th>
                          <th className="border border-slate-300 p-2 text-left">English example</th>
                          <th className="border border-slate-300 p-2 text-left">Spanish example</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["A", "ah", "father", "casa"],
                          ["E", "eh", "bed", "mesa"],
                          ["I", "ee", "see", "fino"],
                          ["O", "oh", "more", "loco"],
                          ["U", "oo", "food", "luna"],
                          ["J", "h (strong)", "hot", "jamón"],
                          ["LL", "y", "yes", "llave"],
                          ["Ñ", "ny", "canyon", "niño"],
                          ["RR", "rolled r", "—", "perro"],
                        ].map(([l, s, e, sp]) => (
                          <tr key={l}>
                            <td className="border border-slate-300 p-2 font-bold">{l}</td>
                            <td className="border border-slate-300 p-2">{s}</td>
                            <td className="border border-slate-300 p-2 italic">{e}</td>
                            <td className="border border-slate-300 p-2">{sp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </BonusPreviewDialog>
                </motion.div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-primary" /> All 3 bonuses included free
                </div>
                <span className="hidden md:inline">•</span>
                <div className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-primary" /> Delivered instantly with your purchase
                </div>
              </div>
            </motion.div>

            {/* Features List */}
            <div className="bg-card rounded-3xl border border-border shadow-card p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map(feature => <div key={feature} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>)}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Loox-style photo reviews from real customers — placed before FAQ + footer */}
      <Suspense fallback={<div className="h-32" />}>
        <LooxStyleReviews />
      </Suspense>

      {/* Bundle FAQ — Physical + Digital FREE */}
      <Suspense fallback={<div className="h-32" />}>
      <FAQ items={[{
        question: "How does the \"Spanish Relax Physical Book + Digital FREE\" offer work?",
        answer: "This is a PHYSICAL book purchase. When you buy the Spanish Relax physical book, you also receive the 5,000 Words digital PDF for FREE plus 3 FREE bonuses — all sent to your email instantly after checkout. There is no digital-only option: every order ships a real printed book.",
        icon: Package,
      }, {
        question: "Who is the author of Spanish Relax?",
        answer: "Spanish Relax is created by Crady, founder of iLingue Relax — a language-learning brand specialized in calm, relaxed methods to learn Spanish, English, French and Portuguese. Every book and digital resource is designed and curated personally by Crady to guarantee a stress-free learning experience.",
        icon: User,
      }, {
        question: "Is iLingue Relax a real brand?",
        answer: "Yes. iLingue Relax is the official brand behind all our books, PDFs and audio courses (ilinguerelax.com). We ship physical books worldwide, deliver digital content by email, and offer dedicated WhatsApp support at +1 251 272 4704 and email at hola@ilinguerelax.com.",
        icon: BadgeCheck,
      }, {
        question: "How long until I receive the DIGITAL PDF by email?",
        answer: "The 5,000 Words digital PDF + the 3 FREE bonuses are sent automatically to your email within a few minutes after checkout. If you don't see it in your inbox, please check your spam/promotions folder or contact us at hola@ilinguerelax.com.",
        icon: Download,
      }, {
        question: "How long until the PHYSICAL book arrives?",
        answer: "Your Spanish Relax physical book is dispatched from our warehouse within 24–72 hours and is delivered worldwide in approximately 7–15 days depending on your country. You'll receive a tracking number by email as soon as it ships.",
        icon: Truck,
      }, {
        question: "Is there a digital-only option?",
        answer: "Yes, we also offer a digital-only version of the Spanish Mastery System. However, most students prefer the physical bundle to have a real book to study from plus the digital access.",
        icon: BookOpen,
      }]} title="Bundle & Shipping FAQ" subtitle="Spanish Relax physical book + digital FREE + 3 bonuses · FREE worldwide shipping when you order 2 or more books (24–72h dispatch, 7–15 days delivery)" />
      </Suspense>

      <Suspense fallback={<div className="h-32" />}>
        <Footer />
      </Suspense>

      {/* Sticky Buy Bar */}
      <StickyBuyBar 
        sku={PRODUCT_SKU}
        price={campaign.price} 
        originalPrice={campaign.originalPrice} 
        currencyCode={campaign.currency} 


        productName={productPricing.name ?? "Book Physical & Digital — FREE Bonuses"} 
        onBuyClick={handleStickyBuy} 
        ctaText={stickyCtaText} 
        isPhysical={true} 
        showReviews={true} 
        rating={productPricing.rating ?? 4.8} 
        reviewCount={productPricing.reviewCount ?? 500} 
        lang="en" 
        calmMode 
        dismissible 
        isLoading={isCreatingDigitalCheckout} 
        disabled={isCreatingDigitalCheckout} 
        goesToInternalCheckout={true}
        usdValue={campaign.priceUsd}
        localUsdPrices={productPricing.localUsdPrices}
        flag={productPricing.loaded ? (currency === "USD" ? "🇺🇸" : currency === "EUR" ? "🇪🇺" : currency === "GBP" ? "🇬🇧" : currency === "AUD" ? "🇦🇺" : currency === "CAD" ? "🇨🇦" : "🌎") : undefined}
      />

      {/* Spacer for sticky bar */}
      <div className="h-32 lg:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification lang="en" productKey="spanish5000" />

      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={500} />

      {/* WhatsApp Support Button */}
      <WhatsAppButton url="https://wa.link/7sr20t" label="Need help?" />
      </div>
    </main>;
};
export default ProductSpanish5000;