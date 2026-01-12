import { useState, useEffect } from "react";
import { X, Gift, ArrowRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ExitIntentPopupProps {
  buyUrl?: string;
  onBuyClick?: () => void;
  discount?: string;
  couponCode?: string;
  lang?: "es" | "en";
  storageKey?: string;
}

export const ExitIntentPopup = ({ 
  buyUrl, 
  onBuyClick,
  discount = "10%",
  couponCode = "NEW10",
  lang = "es",
  storageKey = "exit_intent_shown"
}: ExitIntentPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if popup was already shown in this session
    const alreadyShown = sessionStorage.getItem(storageKey);
    if (alreadyShown) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem(storageKey, "true");
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [hasShown, storageKey]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      toast({
        title: lang === "en" ? "Coupon copied!" : "¡Cupón copiado!",
        description: lang === "en" 
          ? `Use code ${couponCode} at checkout` 
          : `Usa el código ${couponCode} al pagar`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: lang === "en" ? "Error" : "Error",
        description: lang === "en" 
          ? "Could not copy coupon" 
          : "No se pudo copiar el cupón",
        variant: "destructive",
      });
    }
  };

  const handleBuy = () => {
    if (onBuyClick) {
      onBuyClick();
    } else if (buyUrl) {
      window.open(buyUrl, "_blank");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const content = lang === "en" ? {
    title: "Wait! Don't leave yet 🎁",
    description: `We're offering you a special ${discount} discount if you complete your purchase now`,
    couponLabel: "Your exclusive coupon:",
    copyButton: copied ? "Copied!" : "Copy",
    urgency: "⏰ This offer expires in 10 minutes",
    cta: "Buy now with discount",
    decline: "No thanks, I prefer to pay full price"
  } : {
    title: "¡Espera! No te vayas todavía 🎁",
    description: `Te ofrecemos un descuento especial del ${discount} si completas tu compra ahora`,
    couponLabel: "Tu cupón exclusivo:",
    copyButton: copied ? "¡Copiado!" : "Copiar",
    urgency: "⏰ Esta oferta expira en 10 minutos",
    cta: "Comprar ahora con descuento",
    decline: "No gracias, prefiero pagar precio completo"
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Gift className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {content.title}
          </h3>
          <p className="text-muted-foreground mb-4">
            {content.description.split(discount)[0]}
            <span className="font-bold text-primary">{discount}</span>
            {content.description.split(discount)[1]}
          </p>

          {/* Coupon Code */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">{content.couponLabel}</p>
            <div className="flex items-center justify-center gap-2">
              <div className="bg-primary/10 border-2 border-dashed border-primary rounded-lg px-6 py-3">
                <span className="text-2xl font-bold text-primary tracking-wider">{couponCode}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCoupon}
                className="flex items-center gap-1"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {content.copyButton}
              </Button>
            </div>
          </div>

          {/* Urgency */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-600 font-medium">
              {content.urgency}
            </p>
          </div>

          {/* CTA */}
          <Button
            variant="hero"
            size="xl"
            className="w-full mb-3"
            onClick={handleBuy}
          >
            {content.cta}
            <ArrowRight className="w-5 h-5" />
          </Button>

          <button
            onClick={handleClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {content.decline}
          </button>
        </div>
      </div>
    </div>
  );
};
