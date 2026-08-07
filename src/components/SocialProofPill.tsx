import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

interface SocialProofPillProps {
  className?: string;
}

const NAMES = ["Michelle", "Carlos", "Sarah", "Elena", "David", "Juan", "Maria", "Robert"];

export const SocialProofPill = ({ className = "" }: SocialProofPillProps) => {
  const { t } = useI18n();
  const [name, setName] = useState(NAMES[0]);
  const [count, setCount] = useState(3806);

  useEffect(() => {
    setName(NAMES[Math.floor(Math.random() * NAMES.length)]);
    setCount(3800 + Math.floor(Math.random() * 200));
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/20 to-primary/20 border border-primary/30 text-primary text-xs font-bold shadow-sm ${className}`}>
      <Sparkles className="w-3.5 h-3.5 text-primary animate-spin-slow" />
      <span>{(t as any).product.socialProofMessage.replace("{{name}}", name).replace("{{count}}", String(count))}</span>
    </div>
  );
};
