import { Shield, Check, Star } from "lucide-react";
import { motion } from "framer-motion";

export const GuaranteeSeal = () => {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 text-emerald-700"
    >
      <div className="relative mb-2">
        <Shield className="w-12 h-12 text-emerald-600" strokeWidth={1.5} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="w-5 h-5 text-emerald-600 mt-0.5" strokeWidth={3} />
        </div>
      </div>
      <span className="text-xs font-black uppercase tracking-wider mb-0.5">Risk-Free</span>
      <span className="text-sm font-bold text-center leading-tight">7-Day Money Back<br/>Guarantee</span>
    </motion.div>
  );
};

export const TrustBadges = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-500" />
          ))}
        </div>
        <span className="text-[10px] font-bold tracking-tighter uppercase">Trustpilot</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Shield className="w-4 h-4 text-slate-800" />
        <span className="text-[10px] font-bold tracking-tighter uppercase text-slate-800">Stripe Secured</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Globe className="w-4 h-4 text-slate-800" />
        <span className="text-[10px] font-bold tracking-tighter uppercase text-slate-800">Global Delivery</span>
      </div>
    </div>
  );
};

import { Globe } from "lucide-react";
