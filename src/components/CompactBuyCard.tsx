import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, CreditCard, Plane, Package } from "lucide-react";

interface CompactBuyCardProps {
  title: string;
  subtitle?: string;
  price: string;
  originalPrice?: string;
  discountLabel?: string;
  rating?: number;
  reviewsCount?: string;
  badges?: string[];
  ctaText: string;
  onBuy: () => void;
  socialProof?: string;
  noteText?: string;
}

export const CompactBuyCard = ({
  title,
  subtitle,
  price,
  originalPrice,
  discountLabel = "AHORRA 89%",
  rating = 4.8,
  reviewsCount = "800+",
  badges = [],
  ctaText,
  onBuy,
  socialProof,
  noteText,
}: CompactBuyCardProps) => {
  return (
    <section className="py-8 md:py-10">
      <div className="container px-4 md:px-6">
        <div className="max-w-md mx-auto bg-card rounded-2xl border border-border shadow-xl p-5 md:p-6">
          {/* Rating pill */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground">
                Rating {rating} | {reviewsCount} Clientes
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-black text-foreground text-center leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground text-center mt-1">
              <span className="font-bold text-accent">NEW:</span> {subtitle}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline justify-center gap-2 mt-3">
            <span className="text-3xl md:text-4xl font-black text-foreground">{price}</span>
            {originalPrice && (
              <span className="text-lg text-muted-foreground line-through">{originalPrice}</span>
            )}
            {discountLabel && (
              <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-bold">
                {discountLabel}
              </span>
            )}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {badges.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-background text-xs font-medium text-foreground"
                >
                  <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </span>
                  <span className="truncate">{b}</span>
                </div>
              ))}
            </div>
          )}

          {socialProof && (
            <p className="text-xs text-center text-muted-foreground mt-4 border-t border-border pt-3">
              {socialProof}
            </p>
          )}

          {/* CTA */}
          <Button
            variant="hero"
            size="xl"
            className="w-full mt-4 text-base font-black tracking-wide"
            onClick={onBuy}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {ctaText}
          </Button>

          {/* Payment icons */}
          <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span className="text-[10px] font-medium uppercase tracking-wider">
              Visa · Mastercard · PayPal · Pix · OXXO
            </span>
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-around mt-3 pt-3 border-t border-border text-xs text-foreground">
            <div className="flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-primary" />
              <span>Descarga inmediata</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-primary" />
              <span>Garantía 7 días</span>
            </div>
          </div>

          {noteText && (
            <p className="text-xs text-center text-accent font-semibold mt-3 italic">
              {noteText}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default CompactBuyCard;