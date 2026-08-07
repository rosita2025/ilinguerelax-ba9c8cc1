import { Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

interface VerifiedReviewsProps {
  rating?: number;
  count?: number;
  className?: string;
}

export const VerifiedReviews = ({ rating = 4.8, count = 120, className = "" }: VerifiedReviewsProps) => {
  const { t } = useI18n();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
        ))}
      </div>
      <span className="font-bold text-sm">{rating}/5</span>
      <span className="text-xs text-muted-foreground">({count}+ {(t as any).product.verifiedReviews})</span>
    </div>
  );
};
