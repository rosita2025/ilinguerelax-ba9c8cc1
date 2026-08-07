import { AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

interface StockAlertProps {
  count?: number;
  className?: string;
}

export const StockAlert = ({ count = 7, className = "" }: StockAlertProps) => {
  const { t } = useI18n();
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold animate-bounce ${className}`}>
      <AlertCircle className="w-4 h-4" />
      <span>{(t as any).product.onlyLeft.replace("{{count}}", String(count))}</span>
    </div>
  );
};
