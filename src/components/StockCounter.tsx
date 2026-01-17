import { useState, useEffect } from "react";
import { AlertTriangle, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StockCounterProps {
  totalStock?: number;
  remainingStock?: number;
  lang?: "es" | "en";
}

export const StockCounter = ({ 
  totalStock = 50, 
  remainingStock: initialStock = 12,
  lang = "es" 
}: StockCounterProps) => {
  const [remaining, setRemaining] = useState(initialStock);

  useEffect(() => {
    // Occasionally decrease stock to create urgency
    const interval = setInterval(() => {
      if (Math.random() > 0.85 && remaining > 3) {
        setRemaining(prev => prev - 1);
      }
    }, 60000); // Every minute, 15% chance

    return () => clearInterval(interval);
  }, [remaining]);

  const percentage = (remaining / totalStock) * 100;
  const isLow = remaining <= 10;
  const isCritical = remaining <= 5;

  const text = lang === "en" ? {
    units: "units left at this price",
    hurry: "Hurry! Almost sold out",
    selling: "Selling fast",
    reserved: "Reserved for you for 15 minutes"
  } : {
    units: "unidades restantes a este precio",
    hurry: "¡Date prisa! Casi agotado",
    selling: "Se vende rápido",
    reserved: "Reservado para ti por 15 minutos"
  };

  return (
    <div className={`p-4 rounded-xl border ${
      isCritical 
        ? "bg-red-500/10 border-red-500/30" 
        : isLow 
          ? "bg-amber-500/10 border-amber-500/30" 
          : "bg-secondary/50 border-border"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          ) : (
            <Package className="w-5 h-5 text-amber-600" />
          )}
          <span className={`font-bold ${isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-foreground"}`}>
            {remaining} {text.units}
          </span>
        </div>
      </div>
      
      <Progress 
        value={percentage} 
        className={`h-3 ${
          isCritical 
            ? "[&>div]:bg-red-500" 
            : isLow 
              ? "[&>div]:bg-amber-500" 
              : "[&>div]:bg-primary"
        }`}
      />
      
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-sm font-medium ${
          isCritical ? "text-red-600 animate-pulse" : isLow ? "text-amber-600" : "text-muted-foreground"
        }`}>
          {isCritical ? text.hurry : isLow ? text.selling : text.reserved}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(100 - percentage)}% {lang === "en" ? "claimed" : "reclamado"}
        </span>
      </div>
    </div>
  );
};
