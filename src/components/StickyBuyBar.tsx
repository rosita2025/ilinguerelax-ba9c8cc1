import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Shield, Star, ArrowRight, Clock, Loader2, Mail, ShoppingCart, Zap, TrendingUp, X } from "lucide-react";

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
}: StickyBuyBarProps) => {
  // Long currencies (COP$119.900, AR$35.990) need extra-tight layout on mobile
  const isLongPrice = price.length > 7;
  const [stickyEmail, setStickyEmail] = useState("");
  const [stickySubmitting, setStickySubmitting] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Subtle pulse every 6s to grab attention without being annoying
  useEffect(() => {
    if (calmMode) return; // skip pulsing entirely in calm mode
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }, 6000);
    return () => clearInterval(id);
  }, [calmMode]);

  const handleBuy = () => {
    if (!disabled && !isLoading) {
      if (onBuyClick) {
        onBuyClick();
      } else if (buyUrl) {
        window.open(buyUrl, "_blank");
      }
    }
  };

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
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="fixed bottom-4 right-4 z-30 h-12 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_6px_20px_rgba(16,185,129,0.5)] flex items-center gap-2 text-sm font-bold"
        aria-label={lang === "en" ? "Show buy bar" : "Mostrar barra de compra"}
      >
        <ShoppingCart className="w-4 h-4" />
        {price}
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t-2 border-primary/20 shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
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
      {/* Top urgency strip - high visibility */}
      {!disabled && !showEmailSubscription && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white py-1 px-3 text-center">
          <p className={`text-[11px] lg:text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 ${calmMode ? '' : 'animate-pulse'}`}>
            <ShoppingCart className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white" />
            {isPhysical
              ? (lang === "en" ? "LIMITED OFFER • Fast Physical Shipping • 3 FREE BONUSES" : "OFERTA LIMITADA • Envío Físico Rápido • 3 BONUS GRATIS")
              : (lang === "en" ? "LIMITED OFFER • Instant Digital Delivery • 3 FREE BONUSES" : "OFERTA LIMITADA • Entrega Digital Inmediata • 3 BONUS GRATIS")}
            <ShoppingCart className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white" />
          </p>
        </div>
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
          {/* Row 1: Price + Reviews compacto en una línea */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1 min-w-0 flex-shrink">
              <span className={`${isLongPrice ? 'text-sm' : 'text-base'} sm:text-lg font-bold text-foreground whitespace-nowrap`}>{price}</span>
              {originalPrice && !isLongPrice && (
                <span className="text-[11px] text-muted-foreground line-through whitespace-nowrap">{originalPrice}</span>
              )}
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{currencyCode}</span>
            </div>
            {showReviews && (
              <div className="flex items-center gap-1 text-xs flex-shrink-0">
                {!isLongPrice && renderStars()}
                <span className="text-foreground font-medium">★ {rating}</span>
                <span className="text-muted-foreground">({reviewCount})</span>
              </div>
            )}
          </div>
          
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
                className={`relative z-10 w-full h-12 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.5)] text-base font-extrabold tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${pulse ? 'animate-pulse ring-4 ring-emerald-400/40' : ''} ${disabled ? 'bg-amber-500/50 cursor-not-allowed' : ''} ${ctaClassName || ''}`}
                onClick={handleBuy}
                disabled={disabled || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {ctaText}
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
                <span className="text-sm text-muted-foreground">{currencyCode}</span>
              </div>
              {!disabled && (
                <p className="text-xs text-muted-foreground">
                  {lang === "en" ? "You can change your country's currency at checkout" : "Puedes cambiar la moneda de tu país en el checkout"}
                </p>
              )}
            </div>

            {/* Buy Button */}
            <Button
              size="default"
              className={`whitespace-nowrap h-14 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-[0_6px_24px_rgba(16,185,129,0.5)] text-base px-8 font-extrabold tracking-wide transition-all hover:scale-[1.03] active:scale-[0.98] ${pulse ? 'ring-4 ring-emerald-400/40 scale-[1.02]' : ''} ${disabled ? 'bg-amber-500/50 cursor-not-allowed' : ''} ${ctaClassName || ''}`}
              onClick={handleBuy}
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
