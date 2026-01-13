import { useState, useEffect } from "react";
import { X, Gift, ArrowRight, Mail, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExitIntentPopupProps {
  buyUrl?: string;
  onBuyClick?: () => void;
  discount?: string;
  couponCode?: string;
  lang?: "es" | "en";
  storageKey?: string;
}

export const ExitIntentPopup = ({ 
  buyUrl = "https://ilinguerelax.com/products", 
  onBuyClick,
  discount = "10%",
  couponCode = "NEW10",
  lang = "es",
  storageKey = "exit_intent_shown"
}: ExitIntentPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
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

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: lang === "en" ? "Error" : "Error",
        description: lang === "en" 
          ? "Please enter a valid email" 
          : "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke("send-coupon-email", {
        body: {
          email,
          couponCode,
          discount,
          lang,
        },
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: lang === "en" ? "Coupon sent!" : "¡Cupón enviado!",
        description: lang === "en" 
          ? `Check your email for your ${discount} discount code` 
          : `Revisa tu correo para obtener tu código de ${discount} de descuento`,
      });
    } catch (error) {
      console.error("Error sending coupon:", error);
      toast({
        title: lang === "en" ? "Error" : "Error",
        description: lang === "en" 
          ? "Could not send coupon. Please try again." 
          : "No se pudo enviar el cupón. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    description: `Get an exclusive ${discount} discount on all our digital products`,
    emailLabel: "Enter your email to receive your coupon:",
    emailPlaceholder: "your@email.com",
    submitButton: "Send me the coupon",
    successTitle: "🎉 Coupon sent!",
    successDescription: "Check your email inbox",
    cta: "View Products",
    decline: "No thanks, I'll pass"
  } : {
    title: "¡Espera! No te vayas todavía 🎁",
    description: `Obtén un descuento exclusivo del ${discount} en todos nuestros productos digitales`,
    emailLabel: "Ingresa tu email para recibir tu cupón:",
    emailPlaceholder: "tu@email.com",
    submitButton: "Envíame el cupón",
    successTitle: "🎉 ¡Cupón enviado!",
    successDescription: "Revisa tu bandeja de entrada",
    cta: "Ver Productos",
    decline: "No gracias, paso"
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
          <p className="text-muted-foreground mb-6">
            {content.description.split(discount)[0]}
            <span className="font-bold text-primary">{discount}</span>
            {content.description.split(discount)[1]}
          </p>

          {isSubscribed ? (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <Check className="w-6 h-6" />
                  <span className="text-xl font-bold">{content.successTitle}</span>
                </div>
                <p className="text-muted-foreground">{content.successDescription}</p>
              </div>
              
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleBuy}
              >
                {content.cta}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{content.emailLabel}</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={content.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    {content.submitButton}
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {content.decline}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};