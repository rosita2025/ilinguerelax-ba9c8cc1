import { useState, useEffect } from "react";
import { Eye } from "lucide-react";

interface LiveViewersProps {
  minViewers?: number;
  maxViewers?: number;
}

export const LiveViewers = ({ minViewers = 12, maxViewers = 28 }: LiveViewersProps) => {
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    // Generate initial random number
    const initial = Math.floor(Math.random() * (maxViewers - minViewers + 1)) + minViewers;
    setViewers(initial);

    // Update every 5-15 seconds with slight variation
    const interval = setInterval(() => {
      setViewers(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const newValue = prev + change;
        return Math.max(minViewers, Math.min(maxViewers, newValue));
      });
    }, Math.random() * 10000 + 5000);

    return () => clearInterval(interval);
  }, [minViewers, maxViewers]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
      <div className="relative">
        <Eye className="w-4 h-4 text-green-600" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>
      <span className="text-sm font-medium text-green-700">
        {viewers} personas viendo esto ahora
      </span>
    </div>
  );
};
