import React from "react";
import { ShieldCheck, Zap, Download, RefreshCcw } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

export function TrustBadges({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  
  const badges = [
    {
      icon: ShieldCheck,
      label: (t as any).trust?.securePayment || "Pago Seguro",
      color: "text-blue-500",
    },
    {
      icon: Zap,
      label: (t as any).trust?.instantDownload || "Acceso Inmediato",
      color: "text-yellow-500",
    },
    {
      icon: Download,
      label: (t as any).trust?.lifetimeAccess || "Descarga Digital",
      color: "text-primary",
    },
    {
      icon: RefreshCcw,
      label: (t as any).trust?.moneyBack || "Garantía 7 Días",
      color: "text-green-500",
    },
  ];

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {badges.map((badge, idx) => (
        <div 
          key={idx} 
          className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/50 shadow-sm"
        >
          <badge.icon className={`w-5 h-5 ${badge.color} shrink-0`} />
          <span className="text-[11px] font-semibold leading-tight text-foreground/80">
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  );
}
