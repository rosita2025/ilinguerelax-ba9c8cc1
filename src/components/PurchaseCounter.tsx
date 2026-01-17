import { useState, useEffect } from "react";
import { ShoppingBag, TrendingUp, Users } from "lucide-react";

interface PurchaseCounterProps {
  baseCount?: number;
  lang?: "es" | "en";
}

export const PurchaseCounter = ({ baseCount = 1247, lang = "es" }: PurchaseCounterProps) => {
  const [count, setCount] = useState(baseCount);
  const [recentBuyers, setRecentBuyers] = useState(0);

  useEffect(() => {
    // Simulate recent buyers in last 24h (between 3-8)
    setRecentBuyers(Math.floor(Math.random() * 6) + 3);
    
    // Occasionally increment the counter to show activity
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setCount(prev => prev + 1);
        setRecentBuyers(prev => prev + 1);
      }
    }, 45000); // Every 45 seconds, 30% chance

    return () => clearInterval(interval);
  }, []);

  const text = lang === "en" ? {
    sold: "copies sold",
    recent: "purchased in the last 24h",
    trending: "Trending Now"
  } : {
    sold: "copias vendidas",
    recent: "compraron en las últimas 24h",
    trending: "Tendencia Actual"
  };

  return (
    <div className="space-y-3">
      {/* Main counter */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">
            +{count.toLocaleString()} {text.sold}
          </p>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>{recentBuyers} {text.recent}</span>
          </div>
        </div>
      </div>

      {/* Trending badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="relative flex items-center">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        <span className="text-sm font-semibold text-red-600">
          🔥 {text.trending}
        </span>
      </div>
    </div>
  );
};
