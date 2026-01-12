import { Button } from "@/components/ui/button";
import { Check, Shield, Star, ArrowRight, Clock, Loader2 } from "lucide-react";

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
}: StickyBuyBarProps) => {
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <div className="container px-3 sm:px-4 py-2 lg:py-3">
        {/* Mobile & Tablet: Vertical Stack Layout */}
        <div className="flex lg:hidden flex-col gap-2">
          {/* Row 1: Product Name */}
          {productName && (
            <div className="text-center">
              <span className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">
                {productName}
              </span>
            </div>
          )}
          
          {/* Row 2: Price */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-bold text-foreground">{price}</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
            )}
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
          
          {/* Row 3: Button */}
          <Button
            variant="hero"
            size="default"
            className={`w-full shadow-lg text-sm py-2.5 h-auto ${disabled ? 'bg-amber-500/50 cursor-not-allowed' : ''}`}
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
                {disabled ? <Clock className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
              </>
            )}
          </Button>
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
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{price}</span>
                {originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
                )}
                <span className="text-sm text-muted-foreground">USD</span>
              </div>
              {!disabled && (
                <p className="text-xs text-muted-foreground">
                  {lang === "en" ? "You can change your country's currency at checkout" : "Puedes cambiar la moneda de tu país en el checkout"}
                </p>
              )}
            </div>

            {/* Buy Button */}
            <Button
              variant="hero"
              size="default"
              className={`whitespace-nowrap shadow-lg text-sm px-4 py-2 h-auto ${disabled ? 'bg-amber-500/50 cursor-not-allowed' : ''}`}
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
                  {disabled ? <Clock className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
