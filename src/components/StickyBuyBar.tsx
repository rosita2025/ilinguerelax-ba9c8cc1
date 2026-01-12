import { Button } from "@/components/ui/button";
import { Check, Shield, Star, ArrowRight, Clock } from "lucide-react";

interface StickyBuyBarProps {
  price: string;
  originalPrice?: string;
  rating?: number;
  reviewCount?: number;
  buyUrl: string;
  ctaText?: string;
  productName?: string;
  disabled?: boolean;
  showReviews?: boolean;
}

export const StickyBuyBar = ({
  price,
  originalPrice,
  rating = 4.65,
  reviewCount = 800,
  buyUrl,
  ctaText = "COMPRAR AHORA",
  productName,
  disabled = false,
  showReviews = true,
}: StickyBuyBarProps) => {
  const handleBuy = () => {
    if (!disabled) {
      window.open(buyUrl, "_blank");
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
      <div className="container px-4 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Product Name & Trust Badges */}
          <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
            {/* Product Name */}
            {productName && (
              <span className="text-sm md:text-base font-semibold text-foreground">
                {productName}
              </span>
            )}

            {/* Verified Badge */}
            <div className="flex items-center gap-1.5 text-xs md:text-sm">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-muted-foreground">Compra Verificada</span>
            </div>

            {/* Secure Badge */}
            <div className="flex items-center gap-1.5 text-xs md:text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Pago Seguro</span>
            </div>

            {/* Reviews */}
            {showReviews && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm">
                {renderStars()}
                <span className="text-foreground font-medium">{rating}</span>
                <span className="text-muted-foreground">({reviewCount} reseñas)</span>
              </div>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-center gap-4">
            {/* Price */}
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold text-foreground">{price}</span>
                {originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
                )}
                <span className="text-sm text-muted-foreground">USD</span>
              </div>
              {!disabled && (
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  Puedes cambiar la moneda de tu país en el checkout
                </p>
              )}
            </div>

            {/* Buy Button */}
            <Button
              variant="hero"
              size="lg"
              className={`whitespace-nowrap shadow-lg ${disabled ? 'bg-amber-500/50 cursor-not-allowed' : ''}`}
              onClick={handleBuy}
              disabled={disabled}
            >
              <span className="hidden sm:inline">{ctaText}</span>
              <span className="sm:hidden">{ctaText.split(' ')[0]}</span>
              {disabled ? <Clock className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
