import { useEffect, useState, useRef, useMemo, lazy, Suspense } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { 
  Check, ArrowLeft, Download, Shield, Zap, Sparkles, HelpCircle, Lock, Star, 
  Eye, Globe, Smartphone, FileText, CreditCard, ArrowRight, Package, Headphones, Layers, FilePlus, BookOpen, Brain, TrendingUp, Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { supabase } from "@/integrations/supabase/client";
import { subscribeCatalogUpdates } from "@/lib/catalogSync";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { DigitalProductNotice } from "@/components/DigitalProductNotice";
import { PinterestSave } from "@/components/PinterestSave";
import { VerifiedReviews } from "@/components/VerifiedReviews";
import { CartBadge } from "@/components/CartBadge";
import { ResenasWhatsAppCoreano } from "@/components/ResenasWhatsAppCoreano";
import { StockAlert } from "@/components/StockAlert";
import { SocialProofPill } from "@/components/SocialProofPill";
import { ProductTypeBadge } from "@/components/ProductTypeBadge";
import { useI18n } from "@/i18n/I18nContext";
import { formatCurrencyAmount, type Currency } from "@/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PaymentLogos } from "@/components/checkout/PaymentLogos";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";
import { useRegionTier } from "@/hooks/useRegionTier";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";

// Assets for Preview Section
import previewSpanishVocab from "@/assets/preview-spanish-vocab.png";
import previewSpanishPhrases from "@/assets/preview-spanish-phrases.webp";
import plannerPreviewAsset from "@/assets/previews/spanish-daily-planner-preview.png.asset.json";
import examPreviewAsset from "@/assets/previews/spanish-exam-preview.png.asset.json";
import grammarPreviewAsset from "@/assets/previews/spanish-grammar-preview.png.asset.json";
import verbsPreviewAsset from "@/assets/previews/spanish-verbs-preview.png.asset.json";
import questionsPreviewAsset from "@/assets/previews/spanish-questions-preview.png.asset.json";
import verbsV2PreviewAsset from "@/assets/spanish-verbs-preview.png.asset.json";

const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));
const LooxStyleReviews = lazy(() => import("@/components/LooxStyleReviews").then(m => ({ default: m.LooxStyleReviews })));


interface DBProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  learner_language: string;
  target_language: string;
  price_usd: number;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
  price_pen: number | null;
  compare_at_price_usd: number | null;
  compare_at_price_usd_latam: number | null;
  compare_at_price_usd_tienda: number | null;
  compare_at_price_pen: number | null;
  local_compare_at_prices: Record<string, number> | null;
  local_usd_prices: Record<string, number> | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  is_upsell: boolean;
  active: boolean;
  bonus_titles: unknown;
  hotmart_url: string | null;
  store_enabled: boolean;
  excluded_countries: string[] | null;
  store_excluded_countries: string[] | null;
  hotmart_excluded_countries: string[] | null;
  gallery_metadata: Record<string, any> | null;
  rating: number | null;
  review_count: number | null;
  local_prices: Record<string, number> | null;
}

const FLAG: Record<string, string> = {
  es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", pt: "🇵🇹", ko: "🇰🇷",
  de: "🇩🇪", it: "🇮🇹", ja: "🇯🇵", nl: "🇳🇱",
};
const LANG: Record<string, string> = {
  es: "Español", en: "Inglés", fr: "Francés", pt: "Portugués", ko: "Coreano",
  de: "Alemán", it: "Italiano", ja: "Japonés", nl: "Neerlandés",
};

const ProductDynamic = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState<string>("");
  
  const { t } = useI18n();
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      let data: unknown = null;
      let error: unknown = null;
      try {
        const result = await supabase
          .from("digital_products")
          .select("id, sku, name, description, learner_language, target_language, price_usd, price_usd_latam, price_usd_tienda, price_pen, compare_at_price_usd, compare_at_price_usd_latam, compare_at_price_usd_tienda, compare_at_price_pen, local_compare_at_prices, cover_image_url, gallery_images, gallery_metadata, is_upsell, active, bonus_titles, hotmart_url, store_enabled, excluded_countries, store_excluded_countries, hotmart_excluded_countries, rating, review_count, local_prices, local_usd_prices")
          .eq("sku", slug)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } catch (err) {
        error = err;
      }
      if (cancelled) return;
      if (error || !data) setNotFound(true);
      else { 
        const p = data as unknown as DBProduct;
        setProduct(p); 
        setActiveImage(p.cover_image_url || "/placeholder.svg");
        setNotFound(false); 
      }
      setLoading(false);
    };
    load();
    const unsubscribe = subscribeCatalogUpdates({ sku: slug, onUpdate: load, pollMs: 60000 });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [slug]);

  const region = useRegionTier();
  const pricingReady = loading === false && product !== null;
  const upperCountry = region.country?.toUpperCase() || "";
  const isPEN = upperCountry === "PE";
  const flag = (() => {
    if (!upperCountry || upperCountry.length !== 2) return "🌍";
    const base = 0x1f1e6;
    const A = "A".charCodeAt(0);
    return String.fromCodePoint(
      base + upperCountry.charCodeAt(0) - A,
      base + upperCountry.charCodeAt(1) - A
    );
  })();

  const effectiveUsd = product
    ? (region.tier === "tienda" && product.price_usd_tienda != null
        ? Number(product.price_usd_tienda)
        : region.tier === "latam" && product.price_usd_latam != null
          ? Number(product.price_usd_latam)
          : Number(product.price_usd || 0))
    : 0;
  
  const localPrices = product ? (product as any).local_prices : null;
  const localUsdPrices = product ? (product as any).local_usd_prices : null;
  const local = useLocalCurrency(effectiveUsd, localPrices, localUsdPrices);

  const vcFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!product || vcFiredRef.current === product.sku) return;
    vcFiredRef.current = product.sku;
    trackHotmartEvent("ViewContent", {
      content_ids: [product.sku],
      content_name: product.name,
      content_type: "product",
      value: effectiveUsd,
      currency: "USD",
      product_id: product.sku,
    });
  }, [product?.sku, effectiveUsd]);

  if (notFound) return <Navigate to="/404" replace />;
  
  if (loading || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="min-h-dvh pt-4 pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <div className="space-y-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const penAmount = isPEN ? (Number((localPrices as any)?.PEN ?? 0) || Number(product.price_pen ?? 0)) : 0;
  const displayPrice = penAmount > 0 ? penAmount : (local.amount || 0);
  const displayFormatted = penAmount > 0 ? formatCurrencyAmount(penAmount, "PEN") : (local.formatted || "$0.00");
  const displayCurrencyCode = isPEN ? "PEN" : (local.currency || "USD");
  
  const ORIGINAL_MULTIPLIER = 2.5;
  const manualCompareLocal = (product as any)?.local_compare_at_prices?.[displayCurrencyCode];
  const regionCompareUsd = region.tier === "tienda" ? product.compare_at_price_usd_tienda : region.tier === "latam" ? product.compare_at_price_usd_latam : product.compare_at_price_usd;
  const compareRate = displayPrice > 0 && effectiveUsd > 0 ? displayPrice / effectiveUsd : 1;

  let originalAmount: number | null = null;
  if (typeof manualCompareLocal === "number" && manualCompareLocal > 0) originalAmount = manualCompareLocal;
  else if (isPEN && (product as any)?.compare_at_price_pen != null && Number((product as any).compare_at_price_pen) > 0) originalAmount = Number((product as any).compare_at_price_pen);
  else if (regionCompareUsd && regionCompareUsd > 0) originalAmount = Number(regionCompareUsd) * compareRate;
  
  if (originalAmount === null || originalAmount <= displayPrice) originalAmount = displayPrice * ORIGINAL_MULTIPLIER;
  
  const originalFormatted = formatCurrencyAmount(originalAmount, displayCurrencyCode as Currency);
  const discountPercentage = Math.round(((originalAmount - displayPrice) / originalAmount) * 100);
  
  const reviewsCount = product.review_count || 0;
  const reviewsRating = product.rating || 0;
  const cover = product.cover_image_url || "/placeholder.svg";
  const canonical = `https://ilinguerelax.com/products/${product.sku}`;
  
  const features = [
    `${product.name} + Pronunciation`,
    "Digital PDF Version",
    "Complete Grammar Guide",
    "Essential Verbs + English Pronunciation",
    "Practice Questions + English Pronunciation",
    "Digital Flashcards (Anki/Quizlet)",
    "Instant PDF download · Secure Payment",
    "7-Day Money-Back Guarantee"
  ];

  const benefits = [
    { icon: Headphones, title: "Future Audio & App Access", description: "FREE Bonus: Get native pronunciation MP3s and App access soon." },
    { icon: Layers, title: "Digital Flashcards", description: "Ready-to-use decks to memorize vocabulary 3x faster." },
    { icon: Zap, title: "Learn Anywhere", description: "Study on phone, tablet, or PC. Always with you." },
    { icon: FilePlus, title: "Quick Conversations", description: "High-impact guide for 100 common conversations." },
  ];

  const previewAssets = [
    { title: "Vocabulary", image: previewSpanishVocab },
    { title: "Grammar Guide", image: grammarPreviewAsset.url },
    { title: "Daily Planner", image: plannerPreviewAsset.url },
    { title: "Practice Exam", image: examPreviewAsset.url },
    { title: "Essential Verbs", image: verbsV2PreviewAsset.url },
    { title: "Questions", image: questionsPreviewAsset.url }
  ];

  const handleBuy = () => {
    trackHotmartEvent("InitiateCheckout", {
      content_name: product.name,
      content_category: "Digital Book",
      content_ids: [product.sku],
      content_type: "product",
      value: effectiveUsd,
      currency: "USD",
      num_items: 1,
    });
    
    addItem({
      id: product.sku,
      name: product.name,
      price: effectiveUsd,
      regionPrices: {
        latam: product.price_usd_latam || product.price_usd,
        global: product.price_usd,
        tienda: product.price_usd_tienda || product.price_usd
      },
      pricePen: product.price_pen || undefined,
      localPrices: product.local_prices || undefined,
      localUsdPrices: (product as any).local_usd_prices || undefined,
      image: product.cover_image_url || "/placeholder.svg",
      description: product.description || "",
      quantity: 1,
    });
    
    navigate(`/checkouts/${product.sku}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={product.name}
        description={product.description || `${product.name} PDF. Descarga digital inmediata.`}
        canonicalUrl={canonical}
        image={cover}
        type="product"
        price={String(effectiveUsd)}
        sku={product.sku}
        rating={String(reviewsRating)}
        reviewCount={String(reviewsCount)}
        availability="InStock"
        isPhysical={false}
      />
      
      <Navbar />

      <main className="pt-4 pb-20">
        <div className="container px-4 sm:px-6">
          {/* Trust Pilot Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-emerald-200 shadow-sm">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-500" strokeWidth={0} />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800">Excellent</span>
              <span className="text-xs font-bold text-emerald-600">★ Trustpilot</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column: Image Gallery */}
            <div className="space-y-6">
              <div className="relative group bg-card border border-border rounded-3xl overflow-hidden shadow-hero">
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full aspect-square object-cover transition-all duration-300"
                  loading="eager"
                />
                <PinterestSave 
                  overlay 
                  media={activeImage} 
                  url={canonical}
                  description={`${product.name} — ${product.description || "PDF con pronunciación · iLingue Relax"}`}
                />
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-black shadow-lg">
                  <Download className="w-4 h-4" /> DIGITAL PDF — INSTANT ACCESS
                </div>
              </div>


              {product.gallery_images && product.gallery_images.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {[cover, ...product.gallery_images].slice(0, 5).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImage === img ? "border-primary scale-95" : "border-transparent opacity-70"
                      }`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Copy & Pricing */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-600">{reviewsRating}/5 ({reviewsCount}+ reviews)</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black leading-tight text-slate-900">
                {product.name}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {product.description?.split('\n')[0] || "Master your target language with our professional PDF guide."}
              </p>

              <div className="p-6 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="flex items-end gap-3 mb-1">
                  <span className="text-4xl md:text-5xl font-black text-foreground">{displayFormatted}</span>
                  {discountPercentage > 0 && (
                    <span className="text-xl text-muted-foreground line-through opacity-70 mb-1">{originalFormatted}</span>
                  )}
                </div>
                {discountPercentage > 0 && (
                  <div className="inline-block px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-black mb-4">
                    SAVE {discountPercentage}%
                  </div>
                )}
                
                <Button 
                  onClick={handleBuy}
                  size="lg" 
                  className="w-full h-16 text-xl font-black shadow-hero bg-emerald-600 hover:bg-emerald-700 text-white mb-4"
                >
                  GET IT NOW — {displayFormatted}
                </Button>

                <StockAlert count={7} className="mt-2 w-full justify-center" />


                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-4 grayscale opacity-60">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-4" alt="" />
                    <PaymentLogos />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <Shield className="w-3 h-3" /> SECURE CHECKOUT
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Globe className="w-6 h-6 text-emerald-600" />
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Availability</div>
                    <div className="text-xs font-bold text-slate-700">Global Access</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Smartphone className="w-6 h-6 text-emerald-600" />
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Format</div>
                    <div className="text-xs font-bold text-slate-700">Digital PDF</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <section className="mt-24 py-16 border-t border-slate-100">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-black mb-8">What's Inside the System</h2>
                <div className="grid gap-4">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-bold text-slate-700">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {benefits.map((b, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <b.icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-black text-slate-900 mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Look Inside Gallery */}
          <section className="mt-24 py-16 bg-slate-900 rounded-[3rem] text-white overflow-hidden">
            <div className="px-6 md:px-12">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-black mb-4">Look Inside the PDF</h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">See why thousands of students trust iLingue Relax to reach fluency faster.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                {previewAssets.map((asset, i) => (
                  <Dialog key={i}>
                    <DialogTrigger asChild>
                      <button className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border border-white/10 transition-all hover:scale-[1.02]">
                        <img src={asset.image} className="w-full h-full object-cover" alt={asset.title} />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute bottom-4 left-4 font-black text-sm uppercase tracking-widest">{asset.title}</div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white">
                      <DialogHeader className="p-4 bg-slate-900 text-white">
                        <DialogTitle>{asset.title} - Preview</DialogTitle>
                      </DialogHeader>
                      <div className="p-1">
                        <img src={asset.image} className="w-full h-auto" alt="" />
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          </section>
          
          {product.sku === "coreano-100-mapas-mentales" && <ResenasWhatsAppCoreano />}

          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <LooxStyleReviews />
          </Suspense>


          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <FAQ 
              title="Common Questions" 
              subtitle={product.name}
              items={[
                { question: "How do I receive the product?", answer: "Immediately after purchase, you will receive an email with a secure link to download the PDF.", icon: Download },
                { question: "Is it a physical book?", answer: "This is a digital PDF version optimized for mobile, tablets, and computers.", icon: FileText },
                { question: "Do you offer a guarantee?", answer: "Yes, we offer a 7-day risk-free money-back guarantee.", icon: Shield }
              ]}
            />
          </Suspense>
        </div>
      </main>

      <Footer />

      <StickyBuyBar
        sku={product.sku}
        price={displayFormatted}
        originalPrice={originalFormatted}
        currencyCode={displayCurrencyCode}
        flag={flag}
        rating={reviewsRating}
        reviewCount={reviewsCount}
        productName={product.name}
        onBuyClick={handleBuy}
        usdValue={effectiveUsd}
      />
    </div>
  );
};

export default ProductDynamic;
