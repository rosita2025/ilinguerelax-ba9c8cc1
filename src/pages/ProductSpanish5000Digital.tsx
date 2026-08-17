import { useMemo, useRef, useState, Suspense, useEffect } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { useNavigate } from "react-router-dom";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Check, Sparkles, Brain, Download, Zap, Shield, ShoppingCart,
  Star, Globe, CreditCard, Lock
} from "lucide-react";

import { useHotmartPixel } from "@/hooks/useMetaPixel";
import { useTrackProductView, useScrollTimeTracking } from "@/hooks/useGoogleAnalytics";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { LiveViewers } from "@/components/LiveViewers";
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";
import { useI18n } from "@/i18n/I18nContext";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";

import productDigitalImage from "@/assets/spanish-5000-digital-only.webp";

const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));

const PRICE = 30;
const ORIGINAL_PRICE = 43;
const DISCOUNT_PCT = Math.round(((ORIGINAL_PRICE - PRICE) / ORIGINAL_PRICE) * 100);

const features = [
  "5,000 Spanish Words + Pronunciation",
  "A1 → C1 Vocabulary Path",
  "Instant PDF download",
  "7-Day Refund Guarantee",
];

const ProductSpanish5000Digital = () => {
  const shortTestimonials = [
    "Mejor libro que he comprado",
    "Envío instantáneo y seguro",
    "La pronunciación ayuda mucho",
    "Perfecto de A1 a C1",
  ];
  const [isRedirecting, setIsRedirecting] = useState(false);
  const lockRef = useRef(false);
  const { countryCode, formatPrice } = useI18n();
  const ADMIN_SKU = "5-000-words-spanish-with-pronunciation-english-nwna";
  const TIENDA_PATH = "/checkouts/5000-spanish-digital-solo";
  const HOTMART_URL = "https://pay.hotmart.com/L106545921C?checkoutMode=10";
  
  const pricing = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, {
    tiendaPath: TIENDA_PATH,
    fallbackHotmartUrl: HOTMART_URL,
    fallbackPriceGlobalUsd: 30,
    fallbackPriceLatamUsd: 19,
    fallbackPricePen: 45,
  });

  const currentPrice = tier.priceUsd;
  const pricingReady = tier.loaded;

  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  const buildCartItem = () => ({
    id: "5000-spanish-digital-solo",
    name: "5,000 Spanish Words (Digital PDF)",
    price: currentPrice,
    image: "/images/product-5000-spanish.webp",
    description: "5,000 vocabulary words in Spanish with English pronunciation",
    quantity: 1,
  });

  const handleBuyNow = () => {
    if (!pricingReady || lockRef.current) return;
    lockRef.current = true;
    setIsRedirecting(true);
    if (tier.useTiendaOnly) {
      addItem(buildCartItem());
      navigate(TIENDA_PATH);
    } else {
      window.open(tier.hotmartUrl || HOTMART_URL, "_blank", "noopener,noreferrer");
      lockRef.current = false;
      setIsRedirecting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <link rel="preload" as="image" href={productDigitalImage} />
      </Helmet>
      <SEO
        title="5,000 Spanish Words PDF · English Pronunciation"
        description="Digital PDF with 5,000 essential Latin American Spanish words and English pronunciation. Instant download."
        canonicalUrl="https://ilinguerelax.com/products/5-000-words-spanish-with-pronunciation-english-nwna"
        sku="SPANISH-5000-DIGITAL-ONLY"
      />
      <Navbar />

      <section className="pt-6 pb-10">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Image */}
            <div className="relative sticky top-24">
              <img
                src={productDigitalImage}
                alt="Spanish Relax - 5,000 Spanish Words digital PDF"
                className="w-full h-auto rounded-2xl shadow-hero"
              />
              <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black shadow-lg">
                DIGITAL PDF — INSTANT ACCESS
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <LiveViewers minViewers={12} maxViewers={34} lang="en" />
                <h1 className="text-3xl md:text-4xl font-black leading-tight">
                  Learn 5,000 Spanish Words <span className="text-primary">Fast</span>
                </h1>
                <p className="text-muted-foreground">
                  The simplest guide to mastering Latin American Spanish vocabulary without confusing dictionaries.
                </p>
              </div>

              <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black">{tier.priceLabel}</span>
                  <span className="text-lg text-muted-foreground line-through opacity-50">{tier.originalLabel}</span>
                  <span className="ml-auto px-2 py-1 rounded bg-red-500 text-white text-[10px] font-black">
                    SAVE {DISCOUNT_PCT}%
                  </span>
                </div>

                <Button
                  onClick={handleBuyNow}
                  disabled={isRedirecting || !pricingReady}
                  size="xl"
                  className="w-full h-14 text-base font-black shadow-hero"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isRedirecting ? "Connecting..." : `GET IT NOW — ${tier.priceLabel}`}
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> Secure checkout · 7-day money-back guarantee
                </p>
              </div>

              <StockCounter />
              <PurchaseCounter />

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-black text-lg">What's included:</h3>
                <ul className="grid grid-cols-1 gap-3">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm font-semibold">
                      <Check className="w-4 h-4 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StickyBuyBar
        sku={ADMIN_SKU}
        productName="5,000 Spanish Words (Digital PDF)"
        price={tier.priceLabel}
        originalPrice={tier.originalLabel}
        onBuyClick={handleBuyNow}
        ctaText="BUY NOW"
        testimonials={shortTestimonials}
        lang="en"
        calmMode
        dismissible
      />

      <Suspense fallback={<div className="h-20" />}>
        <Footer />
      </Suspense>
    </main>
  );
};

export default ProductSpanish5000Digital;