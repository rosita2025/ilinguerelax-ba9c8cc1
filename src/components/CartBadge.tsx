import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

interface CartBadgeProps {
  className?: string;
}

export const CartBadge = ({ className = "" }: CartBadgeProps) => {
  const { t } = useI18n();
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Randomized number between 12 and 48
    setCount(Math.floor(Math.random() * 36) + 12);
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 text-xs font-bold animate-pulse ${className}`}>
      <Users className="w-3.5 h-3.5" />
      <span>{count} {(t as any).product.peopleInCart}</span>
    </div>
  );
};
