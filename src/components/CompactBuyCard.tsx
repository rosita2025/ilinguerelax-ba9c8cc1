import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, CreditCard, Plane, Package, Shield, Check } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

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
  const { t } = useI18n();
  
  return (
    <section className="py-5 md:py-8">
      <div className="container px-4 md:px-6">
        <div className="max-w-sm mx-auto bg-card rounded-2xl border border-border shadow-xl p-4">
          {/* Rating pill */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <span className="text-[11px] font-bold text-foreground">
                {rating} · {reviewsCount} {(t as any).product.verifiedReviews}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl md:text-2xl font-black text-foreground text-center leading-tight">
            {title}
          </h3>

          {/* Price */}
          <div className="flex flex-col items-center gap-1 mt-2">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-black text-foreground">{price}</span>
              {originalPrice && (
                <span className="text-base text-muted-foreground line-through opacity-70">{originalPrice}</span>
              )}
            </div>
            {discountLabel && (
              <span className="px-1.5 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-bold">
                {discountLabel}
              </span>
            )}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              {badges.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 rounded-full border border-border bg-background text-[11px] font-medium text-foreground"
                >
                  <Check className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{b}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <Button
            variant="hero"
            size="lg"
            className="w-full mt-4 text-sm font-black tracking-wide h-12 shadow-lg shadow-primary/20"
            onClick={onBuy}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {ctaText}
          </Button>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-primary" /> {(t as any).checkout?.securePayment || "Pago Seguro"}
            </span>
            <span className="flex items-center gap-1">
              <Plane className="w-3.5 h-3.5 text-primary" /> {(t as any).product?.instantDownload || "Descarga inmediata"}
            </span>
          </div>
          
          {socialProof && (
             <p className="text-[9px] text-center text-muted-foreground mt-2 opacity-80">
               {socialProof}
             </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default CompactBuyCard;