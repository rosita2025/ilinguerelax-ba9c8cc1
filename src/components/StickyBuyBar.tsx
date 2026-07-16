import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Shield, Star, ArrowRight, Clock, Loader2, Mail, ShoppingCart, Zap, TrendingUp, X, Lock } from "lucide-react";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";


interface StickyBuyBarProps {
  price: string;
  originalPrice?: string;
  rating?: number;
  reviewCount?: number;
  buyUrl?: string;
  onBuyClick?: () => void;
  ctaText?: string;
  productName?: string;
  disabled?: boolean;
  showReviews?: boolean;
  isLoading?: boolean;
  lang?: "es" | "en";
  showEmailSubscription?: boolean;
  onSubscribe?: (email: string) => Promise<void>;
  isSubscribed?: boolean;
  secondaryCtaText?: string;
  onSecondaryClick?: () => void;
  isSecondaryLoading?: boolean;
  ctaClassName?: string;
  isPhysical?: boolean;
  /** Disables pulsing/scaling animations for accessibility (e.g. older audiences) */
  calmMode?: boolean;
  /** Currency code label shown next to price (e.g. "USD", "COP", "ARS"). Defaults to "USD". */
  currencyCode?: string;
  /** Allow user to dismiss the sticky bar (shows an X button). */
  dismissible?: boolean;
  /** Country flag emoji shown next to the price (e.g. "🇺🇸", "🇨🇦"). */
  flag?: string;
}

export const StickyBuyBar = ({
  price,
  originalPrice,
  rating = 4.65,
  reviewCount = 800,
  buyUrl,
  onBuyClick,
  ctaText = "COMPRAR AHORA",
  productName,
  disabled = false,
  showReviews = true,
  isLoading = false,
  lang = "es",
  showEmailSubscription = false,
  onSubscribe,
  isSubscribed = false,
  secondaryCtaText,
  onSecondaryClick,
  isSecondaryLoading = false,
  ctaClassName,
  isPhysical = false,
  calmMode = false,
  currencyCode = "USD",
  dismissible = false,
  flag,
}: StickyBuyBarProps) => {
  // Long currencies (COP$119.900, AR$35.990) need extra-tight layout on mobile
  const isLongPrice = price.length > 7;
  const isVeryLongPrice = price.length > 10;
  // Compute savings = originalPrice - price (keeps the currency symbol from `price`)
  const parseNum = (s?: string) => {
    if (!s) return NaN;
    const cleaned = s.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    return parseFloat(cleaned);
  };
  const priceNum = parseNum(price);
  const origNum = parseNum(originalPrice);
  const savings = isFinite(priceNum) && isFinite(origNum) && origNum > priceNum ? origNum - priceNum : 0;
  const symbol = (price.match(/^[^\d]+/)?.[0] || "$").trim();
  const savingsLabel = savings > 0 ? `${symbol}${savings.toFixed(savings % 1 === 0 ? 0 : 2)}` : "";
  const [stickyEmail, setStickyEmail] = useState("");
  const [stickySubmitting, setStickySubmitting] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [clickLock, setClickLock] = useState(false);
  // Hide entirely on checkout / admin / thank-you routes so it can never
  // navigate the user to *another* checkout while one is already in progress.
  const isOnCheckout = typeof window !== "undefined" && (() => {
    const p = window.location.pathname.toLowerCase();
    return p.startsWith("/checkout") || p.startsWith("/checkouts") ||
           p.startsWith("/admin") || p.includes("success") ||
           p.startsWith("/gracias") || p.startsWith("/thank");
  })();
  const [priceFlash, setPriceFlash] = useState(false);
  const flagEmojiStyle = {
    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
  } as const;
  const flagBadge = flag ? (
    <span
      role="img"
      aria-label={`${currencyCode} country flag`}
      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-1.5 text-lg leading-none shadow-sm"
      style={flagEmojiStyle}
    >
      {flag}
    </span>
  ) : null;

  // Subtle pulse every 6s to grab attention without being annoying
  useEffect(() => {
    if (calmMode) return; // skip pulsing entirely in calm mode
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }, 6000);
    return () => clearInterval(id);
  }, [calmMode]);

  // Auto re-open the sticky bar 25s after the user dismisses it,
  // so customers always come back to the price/CTA without losing the page.
  useEffect(() => {
    if (!dismissed) return;
    const id = setTimeout(() => setDismissed(false), 15000);
    return () => clearTimeout(id);
  }, [dismissed]);

  // Auto-collapse to floating circle when user scrolls down (gives back page space),
  // auto-expand again when user scrolls back up. Customer can also tap the circle.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      if (dy > 8 && y > 400) {
        setDismissed(true);
      } else if (dy < -8) {
        setDismissed(false);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Publish the sticky bar's real height as a CSS variable so floating
  // buttons (WhatsApp, ScrollToTop) can position themselves safely above it
  // and never overlap — regardless of email form, product name length, etc.
  const barRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = barRef.current;
    const root = document.documentElement;
    const setVar = (h: number) => {
      root.style.setProperty("--sticky-bar-h", `${Math.round(h)}px`);
    };
    if (!el) {
      setVar(0);
      return () => root.style.removeProperty("--sticky-bar-h");
    }
    setVar(el.getBoundingClientRect().height);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setVar(entry.contentRect.height);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--sticky-bar-h");
    };
  }, [dismissed]);

  // When the price changes (e.g. user selects a different bundle), pop the bar
  // open and flash it so they see the new total immediately.
  useEffect(() => {
    setDismissed(false);
    setPriceFlash(true);
    const id = setTimeout(() => setPriceFlash(false), 1400);
    return () => clearTimeout(id);
  }, [price]);

  const handleBuy = () => {
    if (disabled || isLoading || clickLock) return;
    // Short single-click guard (1.2s) — swallows accidental double-taps
    // without making the button feel sluggish.
    setClickLock(true);
    setTimeout(() => setClickLock(false), 1200);
    // Fire AddToCart so the funnel counts the same user going from ViewContent
    // → AddToCart → InitiateCheckout even when the sticky bar skips the cart.
    try {
      trackHotmartEvent("AddToCart", {
        content_name: productName,
        content_type: "product",
        value: parseFloat(String(price).replace(/[^\d.,-]/g, "").replace(",", ".")) || undefined,
        currency: currencyCode,
      });
    } catch {}
    if (onBuyClick) {
      onBuyClick();
    } else if (buyUrl) {
      // assign() starts navigation synchronously in the same event tick.
      window.location.assign(buyUrl);
    }
  };

  // Preconnect + prefetch checkout URL on hover/touch so navigation is instant.
  const warmupCheckout = () => {
    if (!buyUrl || typeof document === "undefined") return;
    try {
      const url = new URL(buyUrl, window.location.origin);
      const key = `__ilr_prefetch_${url.href}`;
      if ((window as any)[key]) return;
      (window as any)[key] = true;
      const pre = document.createElement("link");
      pre.rel = "preconnect";
      pre.href = url.origin;
      document.head.appendChild(pre);
      if (url.origin === window.location.origin) {
        const pf = document.createElement("link");
        pf.rel = "prefetch";
        pf.href = url.pathname + url.search;
        document.head.appendChild(pf);
      }
    } catch {}
  };

  // Never render on checkout / admin / thank-you routes
  if (isOnCheckout) return null;

  // Render stars with partial fill
  const renderStars = () => {
    const fullStars = Math.floor(rating);
    const hasPartial = rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < fullStars
                ? "fill-amber-400 text-amber-400"
                : i === fullStars && hasPartial
                ? "fill-amber-400/60 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  if (dismissed) {
    return (
      <div ref={barRef} className="fixed bottom-4 right-4 z-30 flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={() => setDismissed(false)}
          aria-label={lang === "en" ? "Show buy bar" : "Mostrar barra de compra"}
          className={`w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-[0_8px_28px_rgba(16,185,129,0.55)] flex flex-col items-center justify-center gap-0.5 font-extrabold ring-2 ring-white/40 transition-transform hover:scale-105 active:scale-95 ${calmMode ? '' : 'animate-pulse'} ${priceFlash ? 'ring-4 ring-amber-300 scale-110' : ''}`}
        >
          <ShoppingCart className="w-5 h-5" />
          {flag && (
            <span role="img" aria-label={`${currencyCode} country flag`} className="text-base leading-none" style={flagEmojiStyle}>
              {flag}
            </span>
          )}
          <span className="text-[11px] leading-none whitespace-nowrap">{price}</span>
        </button>
        {isPhysical && (
          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-md whitespace-nowrap animate-pulse">
            {lang === "en" ? "Only 12 books left" : "Solo 12 libros quedan"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={barRef} className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t-2 border-primary/20 shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={lang === "en" ? "Hide buy bar" : "Ocultar barra"}
          className="absolute top-1 right-1 z-40 w-7 h-7 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="container px-3 sm:px-4 py-2 lg:py-3">
        {/* Mobile & Tablet: Vertical Stack Layout */}
        <div className="flex lg:hidden flex-col gap-1.5">
          {/* Product name (mobile) */}
          {productName && (
            <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
              {productName}
            </p>
          )}
          {/* Row 1: Price */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-baseline gap-1 min-w-0 flex-shrink flex-wrap">
              <span className={`${isVeryLongPrice ? 'text-sm' : isLongPrice ? 'text-base' : 'text-lg'} sm:text-xl font-black text-foreground tabular-nums leading-none whitespace-nowrap max-w-full`}>{price}</span>
              {originalPrice && (
                <span className="text-[10px] sm:text-[11px] text-muted-foreground line-through tabular-nums whitespace-nowrap">{originalPrice}</span>
              )}
              {flagBadge}
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{currencyCode}</span>
            </div>
            {savingsLabel && (
              <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                {lang === "en" ? `Save ${savingsLabel}` : `Ahorras ${savingsLabel}`}
              </span>
            )}
          </div>
          {/* Row: Reviews */}
          {showReviews && (
            <div className="flex items-center gap-1.5 text-[11px]">
              {renderStars()}
              <span className="text-foreground font-bold tabular-nums">{rating}</span>
              <span className="text-muted-foreground">
                ({reviewCount} {lang === "en" ? "reviews" : "reseñas"})
              </span>
            </div>
          )}
          
          {/* Row: Email or Button */}
          {showEmailSubscription && !isSubscribed ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (onSubscribe && stickyEmail) {
                setStickySubmitting(true);
                await onSubscribe(stickyEmail);
                setStickySubmitting(false);
              }
            }} className="flex gap-2 w-full">
              <Input type="email" placeholder="tu@correo.com" value={stickyEmail} onChange={(e) => setStickyEmail(e.target.value)} className="flex-1 h-12" required />
              <Button type="submit" variant="hero" className="h-12 whitespace-nowrap" disabled={stickySubmitting}>
                {stickySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4 mr-1" /> Suscribirme</>}
              </Button>
            </form>
          ) : isSubscribed ? (
            <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-semibold">
              <Check className="w-5 h-5" /> ¡Suscrito! Te avisaremos.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 w-full">
              <Button
                type="button"
                size="default"
                className={`relative z-10 w-full h-12 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.5)] ${isVeryLongPrice ? 'text-[13px]' : isLongPrice ? 'text-sm' : 'text-base'} font-extrabold transition-all hover:scale-[1.02] active:scale-[0.98] touch-manipulation px-3 sm:px-4 ${pulse ? 'animate-pulse ring-4 ring-emerald-400/40' : ''} ${disabled ? 'bg-amber-500/50 cursor-not-allowed' : ''} ${ctaClassName || ''}`}
                onClick={handleBuy}
                onMouseEnter={warmupCheckout}
                onTouchStart={warmupCheckout}
                onFocus={warmupCheckout}
                disabled={disabled || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="min-w-0 truncate">{ctaText}</span>
                    {disabled && <Clock className="w-4 h-4 ml-2" />}
                  </>
                )}
              </Button>
              {/* Mobile trust microcopy */}
              {!disabled && !secondaryCtaText && (
                <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    {lang === "en" ? "Secure" : "Pago Seguro"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {lang === "en" ? "Instant access" : "Acceso inmediato"}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    {lang === "en" ? "6-day guarantee" : "Garantía 6 días"}
                  </span>
                </div>
              )}
              {/* Country picker moved to global Footer to avoid duplication */}

              {secondaryCtaText && onSecondaryClick && (
                <Button
                  type="button"
                  size="default"
                  className="w-full h-10 rounded-full text-sm font-bold bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-lg"
                  onClick={onSecondaryClick}
                  disabled={isSecondaryLoading}
                >
                  {isSecondaryLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 mr-1.5" />
                  )}
                  {secondaryCtaText}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden lg:flex items-center justify-between gap-3">
          {/* Product Name & Trust Badges */}
          <div className="flex items-center gap-4 flex-wrap">
            {productName && (
              <span className="text-base font-semibold text-foreground truncate max-w-[300px]">
                {productName}
              </span>
            )}

            {/* Verified Badge */}
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-muted-foreground">{lang === "en" ? "Verified Purchase" : "Compra Verificada"}</span>
            </div>

            {/* Secure Badge */}
            <div className="flex items-center gap-1.5 text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{lang === "en" ? "Secure Payment" : "Pago Seguro"}</span>
            </div>

            {/* Reviews */}
            {showReviews && (
              <div className="flex items-center gap-1.5 text-sm">
                {renderStars()}
                <span className="text-foreground font-medium">{rating}</span>
                <span className="text-muted-foreground">({reviewCount} {lang === "en" ? "reviews" : "reseñas"})</span>
              </div>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-center gap-4">
            {/* Price */}
            <div className="text-right">
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="text-2xl font-bold text-foreground">{price}</span>
                {originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
                )}
                {savingsLabel && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {lang === "en" ? `Save ${savingsLabel}` : `Ahorras ${savingsLabel}`}
                  </span>
                )}
                {flagBadge}
                <span className="text-sm text-muted-foreground">{currencyCode}</span>
              </div>
            </div>


            {/* Buy Button with 100% secure badge */}
            <div className="flex flex-col items-center gap-1">
              <Button
              size="default"
              className={`whitespace-nowrap h-14 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-[0_6px_24px_rgba(16,185,129,0.5)] text-base px-8 font-extrabold tracking-wide transition-all hover:scale-[1.03] active:scale-[0.98] ${pulse ? 'ring-4 ring-emerald-400/40 scale-[1.02]' : ''} ${disabled ? 'bg-amber-500/50 cursor-not-allowed' : ''} ${ctaClassName || ''}`}
              onClick={handleBuy}
              onMouseEnter={warmupCheckout}
              onTouchStart={warmupCheckout}
              onFocus={warmupCheckout}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {ctaText}
                    {disabled && <Clock className="w-5 h-5 ml-2" />}
                </>
              )}
              </Button>
            </div>
            {secondaryCtaText && onSecondaryClick && (
              <Button
                size="default"
                className="whitespace-nowrap h-12 rounded-full text-base px-6 font-bold bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-xl"
                onClick={onSecondaryClick}
                disabled={isSecondaryLoading}
              >
                {isSecondaryLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                {secondaryCtaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
