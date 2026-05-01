import { useState, useMemo } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { useAbTest } from "@/hooks/useAbTest";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { ProductReviews } from "@/components/ProductReviews";
import { CountdownTimer } from "@/components/CountdownTimer";
import { LiveViewers } from "@/components/LiveViewers";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import SalesNotification from "@/components/SalesNotification";
import { FAQ } from "@/components/FAQ";
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
import bonus2Image from "@/assets/bonus-2-daily-planner.webp";
import bonus3Image from "@/assets/bonus-3-pronunciation.webp";
import learnSpanish3BooksVideo from "@/assets/learn-spanish-3-physical-books-preorder.mp4";
import { Check, BookOpen, Sparkles, ArrowRight, Brain, User, FileText, GraduationCap, Lightbulb, CreditCard, Globe, Download, Zap, Shield, ShoppingCart, Star, ChevronDown, ChevronUp, Eye, Package, Tag, BadgeCheck } from "lucide-react";

// Review images
import reviewPhoto5 from "@/assets/review-photo-5.jpg";
import reviewPhoto6 from "@/assets/review-photo-6.jpg";
import reviewPhoto7 from "@/assets/review-photo-7.jpg";
import reviewPhoto8 from "@/assets/review-photo-8.jpg";
import reviewBookToc from "@/assets/review-book-toc.jpg";
import reviewBookContent from "@/assets/review-book-content.jpg";

// Product image
import productSpanish5000Image from "@/assets/spanish-5000-cover.webp";
import productGrammarPatternsImage from "@/assets/product-grammar-patterns-a1c1.webp";
import product3000VerbsImage from "@/assets/product-spanish-3000-verbs-book.webp";

// Preview images
import previewSpanishVocab from "@/assets/preview-spanish-vocab.png";
import previewSpanishPhrases from "@/assets/preview-spanish-phrases.png";
import previewSpanishIndex from "@/assets/preview-spanish-index.png";
import previewSpanishUpdates from "@/assets/preview-spanish-updates.jpg";

// Conversion components
import { PurchaseCounter } from "@/components/PurchaseCounter";
import { StockCounter } from "@/components/StockCounter";
import { TrustBadges } from "@/components/TrustBadges";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { StoreSubscriptionCard } from "@/components/StoreSubscriptionCard";
import { useCampaignPrice } from "@/hooks/useCampaignPrice";
import { PdfFlipbook } from "@/components/PdfFlipbook";
import { BundleSelector, addBundleToCart } from "@/components/BundleSelector";
import { useBundleStore } from "@/stores/bundleStore";

// Store logos
import logoAmazon from "@/assets/logo-amazon.png";
import logoEbay from "@/assets/logo-ebay.png";
import logoShopify from "@/assets/logo-shopify.png";

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
  // Multi-currency display (USA / UK / Canada campaign). Display only.
  const campaign = useCampaignPrice();
  // Meta Pixel ViewContent event - using Hotmart pixel only
  const pixelParams = useMemo(() => ({
    content_name: "Spanish Relax - 5,000 Words",
    content_category: "Digital Book",
    content_ids: ["product-spanish-5000"],
    content_type: "product",
    value: 29.99,
    currency: "USD"
  }), []);
  useHotmartPixel(pixelParams);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const setDrawerOpen = useCartStore(state => state.setDrawerOpen);

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
    A_add_to_cart: "ADD TO CART",
    B_i_want_to_buy: "I WANT TO BUY",
    C_download_now: "DOWNLOAD NOW",
  };
  const stickyCtaText = ctaTextByVariant[ctaVariant ?? "A_add_to_cart"] ?? "ADD TO CART";

  // Live-mirror selected bundle into the StickyBuyBar (price updates automatically).
  const selectedBundle = useBundleStore((s) => s.selected);
  const stickyPriceLabel = selectedBundle
    ? `$${selectedBundle.total.toFixed(2)}`
    : campaign.price;
  const stickyOriginalLabel = selectedBundle
    ? `$${selectedBundle.retail.toFixed(2)}`
    : campaign.originalPrice;
  const stickyCurrency = selectedBundle ? "USD" : campaign.currency;

  // When sticky bar CTA is clicked, dispatch the currently-selected bundle (or default).
  const handleStickyBuy = async () => {
    const targetId = (selectedBundle?.id as "digital" | "digital_plus_2" | "complete") ?? "digital";
    await addBundleToCart(targetId);
  };

  const handleBuyNow = async () => {
    // Track AddToCart event with Meta Pixel
    trackHotmartEvent("AddToCart", {
      content_name: "Spanish Relax - 5,000 Words",
      content_category: "Digital Book",
      content_ids: ["product-spanish-5000"],
      content_type: "product",
      value: 29.99,
      currency: "USD",
      num_items: 1,
      ab_experiment: "spanish5000_headline_v1",
      ab_variant: headlineVariant ?? "unassigned",
      ab_cta_experiment: "spanish5000_sticky_cta_v1",
      ab_cta_variant: ctaVariant ?? "unassigned",
    });

    // Add to cart only; checkout continues from the cart drawer
    const shopifyProduct = {
      node: {
        id: "gid://shopify/Product/7788747784253",
        title: "Spanish Relax - 5,000 Words with English Pronunciation",
        description: "",
        handle: "spanish-relax-5-000-words-with-english-pronunciation",
        priceRange: { minVariantPrice: { amount: "29.99", currencyCode: "USD" } },
        images: { edges: [{ node: { url: productSpanish5000Image, altText: "Spanish Relax - 5,000 Words" } }] },
        variants: { edges: [{ node: { id: SHOPIFY_VARIANT_ID, title: "Default Title", price: { amount: "29.99", currencyCode: "USD" }, availableForSale: true, selectedOptions: [{ name: "Title", value: "Default Title" }] } }] },
        options: [{ name: "Title", values: ["Default Title"] }]
      }
    };

    await addItem({
      product: shopifyProduct,
      variantId: SHOPIFY_VARIANT_ID,
      variantTitle: "Default Title",
      price: { amount: "29.99", currencyCode: "USD" },
      quantity: 1,
      selectedOptions: [{ name: "Title", value: "Default Title" }]
    });

    // Open cart drawer to surface upsells before checkout
    setDrawerOpen(true);
  };
  return <main className="min-h-screen bg-background">
      <SEO title="Digital eBook: 5,000 Spanish Words with English Pronunciation" description="Download instantly! 5,000 Spanish words with English pronunciation. PDF format, study anywhere. Special launch price." canonicalUrl="https://ilinguerelax.com/products/5-000-spanish-words-with-english-pronunciation" image="https://ilinguerelax.com/product-spanish-5000.png" type="product" price="29.99" originalPrice="54" rating="4.8" reviewCount="500" sku="SPANISH-5000" keywords="learn Spanish, Spanish vocabulary, Spanish for English speakers, Spanish pronunciation, digital Spanish book" />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
              <div className="relative">
                <img src={productSpanish5000Image} alt="Spanish Relax - 5,000 Words Digital eBook" className="w-full h-auto rounded-2xl shadow-hero" />
              </div>
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
                className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight"
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

              <p className="text-base md:text-lg text-muted-foreground mb-4">
                <strong className="text-foreground">5,000 essential Spanish words</strong> written the way they{" "}
                <em>actually sound</em> in English. No phonetic symbols. No guessing. Just open the PDF and start speaking today.
              </p>

              {/* Benefits bullets — scannable above the fold */}
              <ul className="space-y-1.5 mb-4">
                {[
                  "Read Spanish like English — no IPA symbols",
                  "Instant PDF · works on phone, tablet & PC",
                  "Lifetime updates + 3 free bonuses included",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm md:text-base text-foreground">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Reviews — responsive single row, no wrap on 320/375/480+ */}
              <div className="flex items-center gap-1 xs:gap-1.5 mb-4 whitespace-nowrap">
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

              {/* Purchase Counter - Social Proof */}
              <div className="mb-4">
                <PurchaseCounter baseCount={500} lang="en" />
              </div>

              {/* Live Viewers */}
              <div className="mb-4">
                <LiveViewers minViewers={8} maxViewers={22} lang="en" />
              </div>

              {/* Price Section - More Impactful */}
              <motion.div initial={{
              y: 20,
              opacity: 0
            }} animate={{
              y: 0,
              opacity: 1
            }} transition={{
              delay: 0.4
            }} className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-600 font-semibold text-sm uppercase">Launch price ends Sunday</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">
                  <span className={`${campaign.price.length > 7 ? 'text-3xl md:text-5xl' : 'text-5xl md:text-6xl'} font-black text-foreground`}>{campaign.price}</span>
                  <span className={`${campaign.price.length > 7 ? 'text-base md:text-2xl' : 'text-2xl'} text-muted-foreground line-through`}>{campaign.originalPrice}</span>
                  <span className="text-sm md:text-base text-muted-foreground font-semibold">{campaign.currency}</span>
                  <motion.span animate={{
                  scale: [1, 1.05, 1]
                }} transition={{
                  repeat: Infinity,
                  duration: 2
                }} className="px-3 py-1 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs md:text-sm font-bold shadow-lg">
                    SAVE 48%
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  💳 One-time payment • No subscriptions • Lifetime access
                </p>

                {/* Value stack — anchors perceived value vs price */}
                <div className="bg-white/60 dark:bg-background/40 rounded-xl p-3 border border-purple-500/20 mb-3">
                  <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wide mb-1.5">
                    What you actually get today:
                  </p>
                  <ul className="space-y-1 text-xs text-foreground">
                    <li className="flex items-center justify-between">
                      <span>📘 5,000 Spanish Words PDF</span>
                      <span className="text-muted-foreground line-through">$54</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>🎁 Spanish Exam (Bonus)</span>
                      <span className="text-muted-foreground line-through">$19</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>🎁 Daily Planner (Bonus)</span>
                      <span className="text-muted-foreground line-through">$14</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>🎁 Pronunciation Guide (Bonus)</span>
                      <span className="text-muted-foreground line-through">$19</span>
                    </li>
                    <li className="flex items-center justify-between pt-1.5 mt-1 border-t border-purple-500/20 font-bold">
                      <span>Total value</span>
                      <span className="text-muted-foreground line-through">$106</span>
                    </li>
                    <li className="flex items-center justify-between text-emerald-700 font-extrabold">
                      <span>Today only</span>
                      <span>{campaign.price}</span>
                    </li>
                  </ul>
                </div>

                {/* Bonus stack preview — visible above CTA */}
                <div className="bg-white/60 dark:bg-background/40 rounded-xl p-3 border border-purple-500/20">
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> + 3 FREE Bonuses included today
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center text-center">
                      <img src={bonus1Image} alt="Bonus 1" className="w-12 h-12 rounded-lg object-cover border border-border mb-1" />
                      <span className="text-[10px] leading-tight text-muted-foreground">Spanish Exam</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src={bonus2Image} alt="Bonus 2" className="w-12 h-12 rounded-lg object-cover border border-border mb-1" />
                      <span className="text-[10px] leading-tight text-muted-foreground">Daily Planner</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src={bonus3Image} alt="Bonus 3" className="w-12 h-12 rounded-lg object-cover border border-border mb-1" />
                      <span className="text-[10px] leading-tight text-muted-foreground">Pronunciation</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stock Counter - Scarcity */}
              <div className="mb-6">
                <StockCounter totalStock={50} remainingStock={15} lang="en" />
              </div>

              {/* Bundle selector - 3 options (Atlas-style upsell) */}
              <div className="mb-4">
                <BundleSelector defaultBundle="digital" />
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
              <TrustBadges lang="en" variant="grid" />

              {/* Video — Learn Spanish with 3 Physical Books (Pre-order) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 rounded-2xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg"
              >
                <div className="px-4 pt-4 pb-2">
                  <p className="text-sm font-bold text-primary flex items-center gap-2">
                    🎬 Learn Spanish — 3 Physical Books (Pre-order from June 2026)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    8,000 Words + 3,000 Verbs + Grammar A1–C1 · Lock in the lowest price now
                  </p>
                </div>
                <video
                  src={learnSpanish3BooksVideo}
                  controls
                  controlsList="nodownload noremoteplayback noplaybackrate"
                  disablePictureInPicture
                  disableRemotePlayback
                  onContextMenu={(e) => e.preventDefault()}
                  playsInline
                  preload="metadata"
                  className="w-full h-auto max-h-[70vh] sm:max-h-[60vh] object-contain bg-black"
                />
              </motion.div>

              {/* PDF Flipbook — real preview to build trust before purchase */}
              <div className="mt-6">
                <PdfFlipbook
                  title="Look inside the PDF"
                  subtitle="Real interior pages — flip to see what you'll get"
                  accentClass="text-purple-600"
                  pages={[
                    {
                      src: previewSpanishIndex,
                      alt: "Complete index — 50 chapters from beginner to advanced",
                      caption: "📑 Complete index — 50 organized chapters",
                    },
                    {
                      src: previewSpanishVocab,
                      alt: "Vocabulary table with English pronunciation",
                      caption: "🔤 5,000 words written the way they sound in English",
                    },
                    {
                      src: previewSpanishPhrases,
                      alt: "Practical phrases with grammar structure",
                      caption: "💬 Real-life phrases with phonetic pronunciation",
                    },
                    {
                      src: previewSpanishUpdates,
                      alt: "Free lifetime updates included",
                      caption: "🔄 Free lifetime updates included",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <CountdownTimer hoursFromNow={48} currentPrice={campaign.priceWithCurrency} originalPrice={campaign.originalWithCurrency} storageKey="countdown_spanish_book" lang="en" />

      {/* Reviews carousel — moved up to build trust early (no form) */}
      <ProductReviews productType="spanish" />

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
                    <img src={bonus1Image} alt="Complete Spanish Language Exam" className="w-full h-full object-cover" loading="lazy" />
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
                    <img src={bonus2Image} alt="Daily Study Planner — Spanish for English Speakers" className="w-full h-full object-cover" loading="lazy" />
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
                    <img src={bonus3Image} alt="Spanish Pronunciation Cheat Sheet" className="w-full h-full object-cover" loading="lazy" />
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

            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              A complete system to learn Spanish vocabulary with pronunciation adapted for English speakers
            </p>

            {/* Preview Badge */}
            <div className="flex justify-center mb-8">
              <motion.div initial={{
              scale: 0.9,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} transition={{
              delay: 0.2
            }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500/10 text-purple-600 text-sm font-bold border border-purple-500/20">
                <BookOpen className="w-4 h-4" />
                <span>📖 PREVIEW OR DEMO</span>
              </motion.div>
            </div>

            {/* Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Card 1: Complete Index */}
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-300">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={previewSpanishIndex} alt="Complete Index - Chapters 1 to 50" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-500" />
                    Complete Index
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    50 chapters organized from beginner to advanced level. Includes Home, Shopping, Food, Transportation, and more.
                  </p>
                </div>
              </motion.div>

              {/* Card 2: Grammar Structure */}
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.1
            }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-300">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={previewSpanishPhrases} alt="Grammar Structure with Phrases" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                    Grammar Structure
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Practical phrases with Spanish-English translation and phonetic pronunciation for English speakers.
                  </p>
                </div>
              </motion.div>

              {/* Card 3: Vocabulary Tables */}
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.2
            }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-300">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={previewSpanishVocab} alt="Vocabulary Tables with Pronunciation" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    Vocabulary Tables
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complete vocabulary organized by categories with English pronunciation. Common phrases and expressions included.
                  </p>
                </div>
              </motion.div>

              {/* Card 4: Free Updates */}
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.3
            }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-300">
                <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                  <img src={previewSpanishUpdates} alt="Free Lifetime Updates" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Free Lifetime Updates
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get all future updates and new versions completely free. Your eBook is always up to date!
                  </p>
                </div>
              </motion.div>
            </div>

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


      {/* Review submission form — kept at the end */}
      <ProductReviews productType="spanish" showReviewForm />

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-purple-500">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Get Your Digital Copy Now!
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Instant download. Start learning Spanish today!
            </p>

            <div className="bg-card rounded-3xl shadow-hero p-8 mb-8">
              <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 mb-2">
                <span className={`${campaign.price.length > 7 ? 'text-3xl md:text-5xl' : 'text-5xl'} font-bold text-foreground`}>{campaign.price}</span>
                <span className={`${campaign.price.length > 7 ? 'text-base md:text-2xl' : 'text-2xl'} text-muted-foreground line-through`}>{campaign.originalPrice}</span>
                <span className="text-purple-600 font-bold text-sm md:text-base">{campaign.currency}</span>
              </div>
              <div className="flex justify-center mb-4">
                <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">SAVE 48%</span>
              </div>
              <p className="text-muted-foreground mb-6">
                One-time payment • Instant PDF download • Lifetime access
              </p>
              <Button variant="hero" size="xl" className="w-full" onClick={handleBuyNow}>
                ADD TO CART
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-white/70">
              🔒 100% secure payment • Satisfaction guaranteed
            </p>
          </div>
        </div>
      </section>

      {/* Bundle Upsell Section: Spanish Relax Complete Collection */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.15),_transparent_60%)]" />
        <div className="container px-4 md:px-6 relative">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold mb-4 uppercase tracking-wider">
              <Package className="w-4 h-4" />
              Best Value · Save $18
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Complete the <span className="text-amber-400">Spanish Relax Collection</span>
            </h2>
            <p className="text-base md:text-lg text-slate-300">
              Build true fluency with all 4 books: <strong className="text-white">5,000 Words</strong>, <strong className="text-white">8,000 Words</strong>, <strong className="text-white">3,000 Verbs</strong> and <strong className="text-white">Grammar Patterns A1–C1</strong>.
            </p>
          </div>

          {/* Bundle items grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
            {/* Item 1 — current product */}
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-sm">
              <div className="aspect-square bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl flex items-center justify-center mb-4 p-4">
                <img src={productSpanish5000Image} alt="5,000 Spanish Words" className="max-h-full object-contain" />
              </div>
              <div className="inline-block px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase mb-2">Included</div>
              <h3 className="text-white font-bold text-sm mb-1">5,000 Spanish Words</h3>
              <p className="text-slate-400 text-xs mb-2">Vocabulary + English pronunciation</p>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-3">
                <span className="text-white font-bold text-sm">{campaign.price}</span>
                <span className="text-slate-500 line-through text-[10px]">{campaign.originalPrice}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-purple-400/40 text-purple-200 hover:bg-purple-500/10 hover:text-white text-xs"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                Buy this only
              </Button>
            </div>

            {/* Item 2 — 8,000 Words Physical Book */}
            <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">+ Add</div>
              <div className="aspect-square bg-gradient-to-br from-emerald-500/10 to-transparent rounded-xl flex items-center justify-center mb-4 p-4">
                <img src="/images/product-spanish-8000-book.webp" alt="8,000 Spanish Words Physical Book" className="max-h-full object-contain" />
              </div>
              <div className="inline-block px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase mb-2">Pre-Order</div>
              <h3 className="text-white font-bold text-sm mb-1">8,000 Words Book</h3>
              <p className="text-slate-400 text-xs mb-2">Expanded vocabulary · Physical edition</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-white font-bold">$15</span>
                <span className="text-slate-500 line-through text-xs">$35</span>
              </div>
              <Button
                size="sm"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                onClick={() => window.location.href = '/products/spanish-relax-8000-words-physical-book-preorder'}
              >
                <Package className="w-3.5 h-3.5 mr-1.5" />
                Pre-Order $15
              </Button>
            </div>

            {/* Item 3 — 3000 Verbs */}
            <div className="bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-sm relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">+ Add</div>
              <div className="aspect-square bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl flex items-center justify-center mb-4 p-4">
                <img src={product3000VerbsImage} alt="3,000 Spanish Verbs Mastery" className="max-h-full object-contain" />
              </div>
              <div className="inline-block px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase mb-2">Pre-Order</div>
              <h3 className="text-white font-bold text-sm mb-1">3,000 Spanish Verbs</h3>
              <p className="text-slate-400 text-xs mb-2">Past, Present & Future tenses</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-white font-bold">$17</span>
                <span className="text-slate-500 line-through text-xs">$29.99</span>
              </div>
              <Button
                size="sm"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                onClick={() => window.location.href = '/products/3-000-spanish-verbs-mastery-physical-book-preorder'}
              >
                <Package className="w-3.5 h-3.5 mr-1.5" />
                Pre-Order $17
              </Button>
            </div>

            {/* Item 4 — Grammar Patterns */}
            <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-sm relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">+ Add</div>
              <div className="aspect-square bg-gradient-to-br from-amber-500/10 to-transparent rounded-xl flex items-center justify-center mb-4 p-4">
                <img src={productGrammarPatternsImage} alt="Spanish Grammar Patterns A1–C1" className="max-h-full object-contain" />
              </div>
              <div className="inline-block px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase mb-2">Pre-Order</div>
              <h3 className="text-white font-bold text-sm mb-1">Grammar Patterns A1–C1</h3>
              <p className="text-slate-400 text-xs mb-2">The "Lego" sentence-building system</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-white font-bold">$15</span>
                <span className="text-slate-500 line-through text-xs">$29.99</span>
              </div>
              <Button
                size="sm"
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                onClick={() => window.location.href = '/products/spanish-grammar-patterns-a1-c1-mastery-preorder'}
              >
                <Package className="w-3.5 h-3.5 mr-1.5" />
                Pre-Order $15
              </Button>
            </div>
          </div>

          {/* Bundle pricing card */}
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-amber-500/10 to-purple-500/10 border-2 border-amber-400/40 rounded-3xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300 font-bold text-sm uppercase tracking-wider">Bundle Discount</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Get All 4 Together</h3>
                <div className="flex items-baseline gap-3 justify-center md:justify-start">
                  <span className="text-4xl md:text-5xl font-black text-amber-400">$59</span>
                  <span className="text-xl text-slate-400 line-through">$76.99</span>
                  <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-300 text-xs font-bold">SAVE 23%</span>
                </div>
                <p className="text-slate-400 text-xs mt-2">USD · Pre-orders ship June 2026</p>
              </div>
              <Button
                variant="hero"
                size="xl"
                className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950"
                onClick={() => window.location.href = '/products/spanish-grammar-patterns-a1-c1-mastery-preorder'}
              >
                <Package className="w-5 h-5 mr-2" />
                Get the Bundle
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
              <div className="text-slate-300 text-xs"><Check className="w-4 h-4 inline text-green-400 mr-1" />Lifetime access</div>
              <div className="text-slate-300 text-xs"><Check className="w-4 h-4 inline text-green-400 mr-1" />Free shipping</div>
              <div className="text-slate-300 text-xs"><Check className="w-4 h-4 inline text-green-400 mr-1" />30-day guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Physical Book Coming Soon Section */}
      {/* Upsell Section */}
      {/* FAQ Section */}
      <FAQ items={[{
      question: "What does \"SPANISH RELAX\" mean?",
      answer: "SPANISH RELAX is our stress-free method to learn Spanish without pressure, frustration, or confusing rules. \"Relax\" because you study at your own pace, with pronunciation already simplified, so your brain absorbs Spanish naturally — like a conversation, not a class.",
      icon: Sparkles
    }, {
      question: "Is the pronunciation really stress-free? I've tried other apps and got lost.",
      answer: "Yes. Every Spanish word is written the way it actually SOUNDS in English — no IPA symbols, no weird accent marks to memorize. If you can read English, you can pronounce Spanish from page 1. Example: \"Hola\" → OH-lah. That's it.",
      icon: BookOpen
    }, {
      question: "Do I need a dictionary or other apps to use it?",
      answer: "No. Everything is included in the PDF: the Spanish word, its English translation, and the pronunciation — all on the same line. No tabs to switch, no Google Translate, no extra purchases. Open the PDF and learn.",
      icon: Brain
    }, {
      question: "What exactly is included in the PDF?",
      answer: "5,000 essential Spanish words organized by topic (greetings, food, travel, work, family, emotions, etc.), each with English translation + simplified pronunciation. Plus 3 FREE bonuses: a Spanish placement exam, a daily study planner, and a pronunciation cheat-sheet. ~250 pages, instant download.",
      icon: FileText
    }, {
      question: "Who is the author of this eBook?",
      answer: "SPANISH RELAX is a work by iLingue Relax, an educational brand focused on learning Spanish in a simple, practical, and stress-free way.",
      icon: User
    }, {
      question: "How do I receive the eBook?",
      answer: "Immediately after your purchase, you'll receive an email with a download link to your PDF. You can start studying right away!",
      icon: Download
    }, {
      question: "What format is the eBook?",
      answer: "The eBook is in PDF format, which works on any device - phone, tablet, computer, or e-reader.",
      icon: FileText
    }, {
      question: "Is it suitable for self-study?",
      answer: "Yes. SPANISH RELAX is designed for self-study, to learn at your own pace without pressure.",
      icon: GraduationCap
    }, {
      question: "Do I need to know Spanish before using this?",
      answer: "No. You can start from scratch, with no prior knowledge of Spanish.",
      icon: Lightbulb
    }, {
      question: "Does the eBook include pronunciation?",
      answer: "Yes. All 5,000 words include pronunciation adapted for English speakers with UK and USA phonetics.",
      icon: BookOpen
    }, {
      question: "How do I make the payment?",
      answer: "You can pay securely using an international credit or debit card. We accept Visa, Mastercard, American Express, and more.",
      icon: CreditCard
    }]} title="Frequently Asked Questions" subtitle="We answer your questions about the digital eBook" />

      <Footer />

      {/* Sticky Buy Bar */}
      <StickyBuyBar price={stickyPriceLabel} originalPrice={stickyOriginalLabel} currencyCode={stickyCurrency} productName={selectedBundle ? selectedBundle.label : "5,000 Words With English Pronunciation and includes grammatical structures"} onBuyClick={handleStickyBuy} ctaText={stickyCtaText} showReviews={true} rating={4.8} reviewCount={500} lang="en" calmMode />

      {/* Spacer for sticky bar */}
      <div className="h-32 lg:h-16" />

      {/* Sales Notification Popup */}
      <SalesNotification lang="en" productKey="spanish5000" />

      {/* Exit Intent Popup */}
      {/* Exit-intent popup hidden in US/UK/CA — older audience converts worse with popups */}
      {!["US", "GB", "UK", "CA"].includes(campaign.countryCode) && (
        <ExitIntentPopup onBuyClick={handleBuyNow} discount="15%" lang="en" storageKey="exit_intent_spanish" />
      )}

      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={500} />

      {/* WhatsApp Support Button */}
      <WhatsAppButton />
    </main>;
};
export default ProductSpanish5000;