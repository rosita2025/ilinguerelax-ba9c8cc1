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
import vocabTable1Asset from "@/assets/previews/vocab-table-preview-1.png.asset.json";
import vocabTable2Asset from "@/assets/previews/vocab-table-preview-2.png.asset.json";
import plannerTableAsset from "@/assets/previews/study-planner-preview-table.png.asset.json";
import koreanCoverAsset from "@/assets/previews/korean-2000-cover.asset.json";
import koreanTableAsset from "@/assets/previews/korean-2000-table.asset.json";
import koreanIndexAsset from "@/assets/previews/korean-2000-index.asset.json";


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
  es: "Spanish", en: "English", fr: "French", pt: "Portuguese", ko: "Korean",
  de: "German", it: "Italian", ja: "Japanese", nl: "Dutch",
};

const ProductDynamic = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState<string>("");
  
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  // Precarga el paquete de JS del checkout en segundo plano, mientras el
  // visitante todavía está leyendo esta página. Antes ese código (Checkout +
  // PaymentMethodsGroup, ~160KB de fuente + Stripe) recién empezaba a
  // descargarse DESPUÉS del clic en "comprar", lo cual se sentía como una
  // pantalla en blanco de 3-5 segundos justo en el momento más crítico.
  // Usamos requestIdleCallback (con fallback a setTimeout) para no competir
  // con la carga inicial de la propia página del producto.
  useEffect(() => {
    const prefetch = () => { import("@/pages/Checkout"); };
    const w = window as typeof window & { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(prefetch);
      return () => { /* no cleanup needed, prefetch is harmless if it fires */ };
    }
    const timeoutId = window.setTimeout(prefetch, 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      let data: unknown = null;
      let error: unknown = null;
      try {
        const result = await supabase
          .from("digital_products")
          .select("id, sku, name, description, learner_language, target_language, price_usd, price_usd_latam, price_usd_tienda, price_pen, compare_at_price_usd, compare_at_price_usd_latam, compare_at_price_usd_tienda, compare_at_price_pen, local_compare_at_prices, cover_image_url, gallery_images, gallery_metadata, is_upsell, active, bonus_titles, hotmart_url, store_enabled, excluded_countries, store_excluded_countries, hotmart_excluded_countries, rating, review_count, local_prices, local_usd_prices, local_compare_at_prices")
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
  
  const localPrices = product ? product.local_prices : null;
  const localUsdPrices = product ? product.local_usd_prices : null;

  const local = useLocalCurrency(effectiveUsd, localPrices, localUsdPrices);

  const vcFiredRef = useRef<string | null>(null);
  // Protección contra doble-toque: en móvil es muy común tocar el botón 2
  // veces por accidente (el dedo no se levanta a tiempo entre toques). Sin
  // esto, cada toque navega a /checkouts/:sku, y cada carga de esa página
  // dispara su propio InitiateCheckout — 2 toques reales pueden verse como
  // "evento duplicado" en el pixel aunque el código de tracking esté bien.
  // IMPORTANTE: este hook debe vivir ANTES de los early returns de
  // notFound/loading (si no, React crashea con "Rendered more hooks").
  const buyClickedRef = useRef(false);
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
  }, [product?.sku, effectiveUsd, trackHotmartEvent]);

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

  const penAmount = isPEN ? (Number(localPrices?.PEN ?? 0) || Number(product.price_pen ?? 0)) : 0;
  const displayPrice = penAmount > 0 ? penAmount : (local.amount || 0);
  const displayFormatted = penAmount > 0 ? formatCurrencyAmount(penAmount, "PEN") : (local.formatted || "$0.00");
  const displayCurrencyCode = isPEN ? "PEN" : (local.currency || "USD");
  
  // ~35% fallback discount: "too good" discounts (60-90%) read as an inflated original price and hurt trust.
  const ORIGINAL_MULTIPLIER = 1.54;
  const MAX_DISPLAY_DISCOUNT = 45;
  const manualCompareLocal = product.local_compare_at_prices?.[displayCurrencyCode];
  const regionCompareUsd = region.tier === "tienda" 
    ? product.compare_at_price_usd_tienda 
    : region.tier === "latam" 
      ? product.compare_at_price_usd_latam 
      : product.compare_at_price_usd;


  const compareRate = displayPrice > 0 && effectiveUsd > 0 ? displayPrice / effectiveUsd : 1;

  let originalAmount: number | null = null;
  if (typeof manualCompareLocal === "number" && manualCompareLocal > 0) originalAmount = manualCompareLocal;
  else if (isPEN && product.compare_at_price_pen != null && Number(product.compare_at_price_pen) > 0) originalAmount = Number(product.compare_at_price_pen);
  else if (regionCompareUsd && regionCompareUsd > 0) originalAmount = Number(regionCompareUsd) * compareRate;
  
  if (originalAmount === null || originalAmount <= displayPrice) originalAmount = displayPrice * ORIGINAL_MULTIPLIER;
  
  const originalFormatted = formatCurrencyAmount(originalAmount, displayCurrencyCode as Currency);
  // Cap the displayed discount: anything above ~45% looks like an inflated "before" price.
  const discountPercentage = Math.min(
    MAX_DISPLAY_DISCOUNT,
    Math.round(((originalAmount - displayPrice) / originalAmount) * 100)
  );
  
  const reviewsCount = product.review_count || 0;
  const reviewsRating = product.rating || 0;
  const cover = product.cover_image_url || "/placeholder.svg";
  const canonical = `https://ilinguerelax.com/products/${product.sku}`;
  
  const features = [
    `${product.name} + Pronunciation`,
    "Digital PDF Version",
    "Study Planner (6 Months Layout)",
    "Digital Flashcards (Anki/Quizlet)",
    "Spanish Proficiency Exam Pack",
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
    { title: "Study Planner (6 Months)", image: plannerPreviewAsset.url },
    { title: "Spanish Exam Pack", image: examPreviewAsset.url },
    { title: "Digital Flashcards", image: previewSpanishPhrases },
    { title: "Vocabulary Table 1", image: vocabTable1Asset.url },
    { title: "Vocabulary Table 2", image: vocabTable2Asset.url },
    { title: "Study Planner Table", image: plannerTableAsset.url },
    { title: "Korean Cover", image: koreanCoverAsset.url },
    { title: "Korean Index", image: koreanIndexAsset.url },
    { title: "Korean Vocabulary Table", image: koreanTableAsset.url }
  ].filter(asset => {
    const KOREAN_SKU = "2-000-palabras-esenciales-para-aprender-coreano-hangul-pronunciacion-para-hispanohablantes-npca";
    
    if (product.sku === "5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7") {
      return [
        "Study Planner (6 Months)", 
        "Spanish Exam Pack", 
        "Digital Flashcards",
        "Vocabulary Table 1",
        "Vocabulary Table 2",
        "Study Planner Table"
      ].includes(asset.title);
    }
    
    if (product.sku === KOREAN_SKU) {
      return [
        "Korean Cover",
        "Korean Index",
        "Korean Vocabulary Table"
      ].includes(asset.title);
    }
    
    return true;
  });




  // Protección contra doble-toque: en móvil es muy común tocar el botón 2
  // veces por accidente (el dedo no se levanta a tiempo entre toques). Sin
  // esto, cada toque navega a /checkouts/:sku, y cada carga de esa página
  // dispara su propio InitiateCheckout — 2 toques reales pueden verse como
  // "evento duplicado" en el pixel aunque el código de tracking esté bien.
  const buyClickedRef = useRef(false);
  const handleBuy = () => {
    if (buyClickedRef.current) return;
    buyClickedRef.current = true;
    // AddToCart aquí (no InitiateCheckout — ese lo dispara Checkout.tsx al
    // cargar /checkouts/:sku, una sola vez con guard initiatedRef). Antes
    // se disparaba InitiateCheckout aquí también, duplicando el evento.
    trackHotmartEvent("AddToCart", {
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
      localUsdPrices: product.local_usd_prices || undefined,
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
        description={product.description || `${product.name} PDF. Instant digital download.`}
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

      <main className="pt-0 pb-2">
        <div className="container px-4 sm:px-6">
          {/* Trust Pilot Badge */}
          <div className="flex justify-center mb-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-200 shadow-sm">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2 h-2 fill-emerald-500 text-emerald-500" strokeWidth={0} />
                ))}
              </div>
              <span className="text-[9px] font-bold text-slate-800">Excellent</span>
              <span className="text-[9px] font-bold text-emerald-600">★ Trustpilot</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 items-start">
            {/* Left Column: Image Gallery */}
            <div className="space-y-4">
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
                  {[cover, ...(product.gallery_images || [])].slice(0, 5).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-600">{reviewsRating}/5 ({reviewsCount}+ reviews)</span>
              </div>

              <h1 className="text-xl md:text-3xl font-black leading-tight text-slate-900 tracking-tight">
                {product.name}
              </h1>

              <p className="text-sm text-muted-foreground leading-snug">
                {product.sku === "5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7" 
                  ? "Reach C1 fluency faster with our professional 5,000 words guide, 6-month study planner, and proficiency exams."
                  : product.description?.split('\n')[0] || "Master your target language with our professional PDF guide."}

              </p>

              <div className="p-3 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-3xl md:text-4xl font-black text-foreground">{displayFormatted}</span>
                  {discountPercentage > 0 && (
                    <span className="text-xl text-muted-foreground line-through opacity-70 mb-1">{originalFormatted}</span>
                  )}
                </div>
                {discountPercentage > 0 && (
                  <div className="inline-block px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black mb-3">
                    SAVE {discountPercentage}%
                  </div>
                )}
                
                <Button 
                  onClick={handleBuy}
                  size="lg" 
                  className="w-full h-12 text-base font-black shadow-hero bg-emerald-600 hover:bg-emerald-700 text-white mb-2"
                >
                  GET IT NOW — {displayFormatted}
                </Button>

                <StockAlert count={7} className="mt-2 w-full justify-center" />


                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-4 grayscale opacity-60">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-4" alt="" />
                    <PaymentLogos />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                    <Shield className="w-2.5 h-2.5" /> SECURE CHECKOUT
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-[9px] font-black uppercase text-slate-400">Availability</div>
                    <div className="text-[11px] font-bold text-slate-700">Global Access</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-[9px] font-black uppercase text-slate-400">Format</div>
                    <div className="text-[11px] font-bold text-slate-700">Digital PDF</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <section className="mt-4 py-3 border-t border-slate-100">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-black mb-3 uppercase tracking-tight">What's Inside</h2>
                <div className="grid gap-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {benefits.map((b, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <b.icon className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-black text-slate-900 text-sm mb-1 uppercase tracking-tight">{b.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-tight">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Look Inside Gallery */}
          <section className="mt-4 py-3 bg-slate-900 rounded-[1.5rem] text-white overflow-hidden">
            <div className="px-4 md:px-8">
              <div className="text-center mb-4">
                <h2 className="text-xl md:text-2xl font-black mb-1 uppercase tracking-tight">Look Inside</h2>
                <p className="text-slate-400 text-xs max-w-2xl mx-auto">Visual guides to reach fluency faster.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {previewAssets.map((asset, i) => (
                  <Dialog key={i}>
                    <DialogTrigger asChild>
                      <button className="group relative aspect-[3/4] sm:aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 border border-white/10 transition-all hover:scale-[1.02] shadow-2xl">
                        <img 
                          src={asset.image} 
                          className="w-full h-full object-contain sm:object-cover bg-white/5" 
                          alt={asset.title} 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900/90 to-transparent">
                          <div className="font-black text-[10px] sm:text-xs uppercase tracking-widest text-white/90 truncate">{asset.title}</div>
                        </div>
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
          
          {(product.sku === "coreano-100-mapas-mentales" || 
            product.sku === "2-000-palabras-esenciales-para-aprender-coreano-hangul-pronunciacion-para-hispanohablantes-npca") && (
            <div className="mb-2">
              <ResenasWhatsAppCoreano />
            </div>
          )}

          {product.sku !== "2-000-palabras-esenciales-para-aprender-coreano-hangul-pronunciacion-para-hispanohablantes-npca" && (
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <LooxStyleReviews />
            </Suspense>
          )}

          {product.sku === "5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7" && (
            <div className="max-w-4xl mx-auto px-4 mb-4">
              <div className="p-3 md:p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Package className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <BookOpen className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-black mb-1 text-emerald-400 uppercase tracking-tight">Physical Book?</h3>
                    <p className="text-slate-400 text-xs md:text-sm leading-tight">
                      Get the premium printed edition of the 5,000 Spanish Words book shipped to your door. The perfect companion for your digital study.
                    </p>
                  </div>
                  <Button 
                    asChild
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-3 rounded-xl transition-all shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 h-auto text-[13px]"
                  >
                    <Link to="/products/5-000-spanish-words-with-english-pronunciation-physical">
                      GET THE PHYSICAL BOOK
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}


          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <FAQ 
              title="FAQ" 
              subtitle="Quick Answers" 
              items={["5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7", "2-000-palabras-esenciales-para-aprender-coreano-hangul-pronunciacion-para-hispanohablantes-npca"].includes(product.sku) ? [
                { question: "Delivery time?", answer: "Sent to your email within 5 minutes of purchase.", icon: Download },
                { question: "What is the format?", answer: "High-quality Digital PDF (Official iLingue Relax Brand).", icon: FileText },
                { question: "Payment methods?", answer: "Secure payments via Stripe, Credit/Debit Cards, and PayPal.", icon: CreditCard },
                { question: "7-Day Guarantee?", answer: "Yes — full refund within 7 days if you haven't downloaded the files yet, or 50% back if you already have.", icon: Shield }
              ] : [
                { question: "Delivery?", answer: "Immediate via email.", icon: Download },
                { question: "Format?", answer: "Digital PDF.", icon: FileText },
                { question: "Guarantee?", answer: "7-day money-back.", icon: Shield }
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
        lang={language === "es" ? "es" : "en"}
        ctaText={
          language === "es"
            ? `LO QUIERO AHORA — ${displayFormatted}`
            : language === "pt"
              ? `QUERO AGORA — ${displayFormatted}`
              : language === "fr"
                ? `JE LE VEUX — ${displayFormatted}`
                : `I WANT IT NOW — ${displayFormatted}`
        }
        onBuyClick={handleBuy}
        usdValue={effectiveUsd}
        localUsdPrices={product.local_usd_prices}
        testimonials={product.sku === "5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7" ? [
          "Sarah, USA: Exactly what I needed to stop translating in my head!",
          "James, UK: The 6-month study planner is a game changer for me.",
          "Elena, Canada: Clear pronunciation and very visual. Highly recommend."
        ] : undefined}
      />


    </div>
  );
};

export default ProductDynamic;
