import { useMemo, useRef, useState, Suspense } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { useNavigate } from "react-router-dom";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { Helmet } from "react-helmet-async";
import {
  Check, Sparkles, Brain, Download, Zap, Shield, ShoppingCart,
  Star, Lock, ArrowRight, BookOpen
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
import grammarPreviewAsset from "@/assets/previews/spanish-grammar-preview.png.asset.json";
import verbsV2PreviewAsset from "@/assets/previews/spanish-verbs-v2-preview.png.asset.json";

const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));

const PRICE = 97;
const ORIGINAL_PRICE = 149;
const DISCOUNT_PCT = Math.round(((ORIGINAL_PRICE - PRICE) / ORIGINAL_PRICE) * 100);

const masteryFeatures = [
  "5,000 Spanish Words + Pronunciation (250 Pages)",
  "Complete A1–C1 Grammar Guide (250 Pages)",
  "1,000 Essential Spanish Verbs + English Pronunciation",
  "500 Spanish Questions + English Pronunciation",
  "Structural Spanish Method (Mastery System)",
  "Instant PDF download · Lifetime Updates",
];

const ProductSpanishMastery = () => {
  const shortTestimonials = [
    "Mejor sistema que he probado",
    "Por fin entiendo las estructuras",
    "Los 1,000 verbos son clave",
    "Dominio total de A1 a C1",
  ];
  const [isRedirecting, setIsRedirecting] = useState(false);
  const lockRef = useRef(false);
  const { countryCode } = useI18n();
  const ADMIN_SKU = "5-000-spanish-words-with-english-pronunciation-digital";
  const TIENDA_PATH = "/checkouts/spanish-mastery-digital";
  const HOTMART_URL = "https://pay.hotmart.com/L106545921C?checkoutMode=10";
  
  const pricing = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, {
    tiendaPath: TIENDA_PATH,
    fallbackHotmartUrl: HOTMART_URL,
    fallbackPriceGlobalUsd: 97,
    fallbackPriceLatamUsd: 67,
    fallbackPricePen: 250,
  });

  const currentPrice = tier.priceUsd;
  const pricingReady = tier.loaded;

  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  const buildCartItem = () => ({
    id: "spanish-mastery-digital",
    name: "Spanish Mastery System (All Digital Guides)",
    price: currentPrice,
    image: "/images/product-5000-spanish.webp",
    description: "Full bundle: 5,000 words, 1,000 verbs, Grammar Guide, and more.",
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
        title="Spanish Mastery System · 5,000 Words & Grammar"
        description="The complete Spanish Mastery System: 5,000 words, 1,000 verbs, and structural grammar guide. Instant download."
        canonicalUrl="https://ilinguerelax.com/products/5-000-spanish-words-with-english-pronunciation-digital"
        sku="SPANISH-MASTERY-DIGITAL"
      />
      <Navbar />

      <section className="pt-6 pb-12">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr,1.1fr] gap-8 items-center">
            <div className="relative">
              <img
                src={productDigitalImage}
                alt="Spanish Mastery System Bundle"
                className="w-full h-auto rounded-2xl shadow-lg border border-primary/10"
              />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
                  Full Bundle Access
                </div>
                <h1 className="text-4xl md:text-5xl font-black leading-tight">
                  Spanish Mastery <span className="text-primary">System</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium">
                  The definitive collection for English speakers. From zero to C1 with our structural method and 5,000 essential words.
                </p>
              </div>

              <div className="p-8 rounded-[2.5rem] border-4 border-primary/20 bg-card shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl -mr-16 -mt-16 rounded-full" />
                
                <div className="relative z-10">
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-5xl font-black">{tier.priceLabel}</span>
                    <span className="text-xl line-through text-muted-foreground opacity-50">{tier.originalLabel}</span>
                  </div>

                  <Button
                    onClick={handleBuyNow}
                    disabled={isRedirecting || !pricingReady}
                    size="xl"
                    className="w-full h-16 text-lg font-black rounded-2xl shadow-hero bg-primary hover:bg-primary/90"
                  >
                    <Zap className="w-5 h-5 mr-2 fill-current" />
                    {isRedirecting ? "Connecting..." : "BUY MASTERY SYSTEM"}
                  </Button>
                  
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 7-Day Refund</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Secure Access</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StockCounter />
                <PurchaseCounter />
              </div>

              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Check className="w-6 h-6 text-primary" /> Everything Included:
                </h3>
                <ul className="space-y-3">
                  {masteryFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-12">The Mastery Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
              <BookOpen className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-black mb-4">Vocabulary Core</h3>
              <p className="text-muted-foreground text-sm font-medium">5,000 essential words with English pronunciation to build your base fast.</p>
            </div>
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
              <Zap className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-black mb-4">1,000 Verbs</h3>
              <p className="text-muted-foreground text-sm font-medium">Master the actions. Present, past, and future with clear English phonetics.</p>
            </div>
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
              <Brain className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-black mb-4">Grammar Logic</h3>
              <p className="text-muted-foreground text-sm font-medium">No boring rules. Understand how the language is built structurally.</p>
            </div>
          </div>
        </div>
      </section>

      <StickyBuyBar
        sku={ADMIN_SKU}
        productName="Spanish Mastery System"
        price={tier.priceLabel}
        originalPrice={tier.originalLabel}
        onBuyClick={handleBuyNow}
        ctaText="GET MASTERY"
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

export default ProductSpanishMastery;