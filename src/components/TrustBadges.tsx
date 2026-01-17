import { Shield, CreditCard, RefreshCw, Lock, Award, CheckCircle } from "lucide-react";

interface TrustBadgesProps {
  lang?: "es" | "en";
  variant?: "horizontal" | "grid";
}

export const TrustBadges = ({ lang = "es", variant = "grid" }: TrustBadgesProps) => {
  const badges = lang === "en" ? [
    { icon: Shield, label: "100% Secure", color: "text-green-600 bg-green-500/10 border-green-500/20" },
    { icon: Lock, label: "SSL Encrypted", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
    { icon: RefreshCw, label: "7-Day Guarantee", color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
    { icon: CreditCard, label: "Multiple Payment Methods", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
    { icon: Award, label: "+800 5-Star Reviews", color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20" },
    { icon: CheckCircle, label: "Instant Delivery", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  ] : [
    { icon: Shield, label: "100% Seguro", color: "text-green-600 bg-green-500/10 border-green-500/20" },
    { icon: Lock, label: "Cifrado SSL", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
    { icon: RefreshCw, label: "Garantía 7 Días", color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
    { icon: CreditCard, label: "Múltiples Métodos de Pago", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
    { icon: Award, label: "+800 Reseñas 5 Estrellas", color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20" },
    { icon: CheckCircle, label: "Entrega Inmediata", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  ];

  if (variant === "horizontal") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {badges.slice(0, 4).map((badge) => (
          <div 
            key={badge.label} 
            className={`flex items-center gap-2 px-3 py-2 rounded-full border ${badge.color}`}
          >
            <badge.icon className="w-4 h-4" />
            <span className="text-xs font-medium">{badge.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {badges.map((badge) => (
        <div 
          key={badge.label} 
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all hover:scale-105 ${badge.color}`}
        >
          <badge.icon className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-medium">{badge.label}</span>
        </div>
      ))}
    </div>
  );
};
