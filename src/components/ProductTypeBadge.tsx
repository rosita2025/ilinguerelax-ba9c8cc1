import { Package, FileText } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

interface ProductTypeBadgeProps {
  isPhysical?: boolean;
  className?: string;
}

export const ProductTypeBadge = ({ isPhysical = false, className = "" }: ProductTypeBadgeProps) => {
  const { t } = useI18n();
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium ${className}`}>
      {isPhysical ? <Package className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
      <span>{isPhysical ? (t as any).product.productTypePhysical : (t as any).product.productTypeDigital}</span>
    </div>
  );
};
