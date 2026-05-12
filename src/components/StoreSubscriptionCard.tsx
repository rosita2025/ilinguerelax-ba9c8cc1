import { useState } from "react";
import { ArrowRight, Mail, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackLead } from "@/hooks/useMetaPixel";
import { useI18n } from "@/i18n/I18nContext";

interface StoreSubscriptionCardProps {
  logo: string;
  storeName: string;
  type: "coming-soon" | "available";
  buyLink?: string;
  productType?: "spanish" | "english";
}

export const StoreSubscriptionCard = ({
  logo,
  storeName,
  type,
  buyLink,
  productType = "english",
}: StoreSubscriptionCardProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Error",
        description: t.storeCards.invalidEmail,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke("send-store-notification", {
        body: {
          email,
          storeName,
          productType,
        },
      });

      if (error) throw error;

      setIsSubscribed(true);
      trackLead(email, {
        content_name: `Store Subscription - ${storeName}`,
        content_category: "Marketplace Notify",
        product_type: productType,
      });
      toast({
        title: t.storeCards.successTitle,
        description: `${t.storeCards.successMessage} ${storeName}`,
      });
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Error",
        description: t.storeCards.errorSubscribing,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (type === "available" && buyLink) {
    return (
      <div className="bg-card rounded-2xl border border-primary/30 p-6 text-center shadow-card ring-2 ring-primary/20">
        <img src={logo} alt={storeName} className="h-10 mx-auto mb-4 object-contain" />
        <span className="inline-block px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium mb-3">
          {t.storeCards.earlyPurchase}
        </span>
        <p className="text-sm text-muted-foreground mb-3">{t.storeCards.availableNow}</p>
        <a
          href={buyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors mb-3"
        >
          {t.storeCards.buyNow} <ArrowRight className="w-4 h-4" />
        </a>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Mail className="w-3 h-3" /> {t.storeCards.contactEmail}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 text-center shadow-card">
      <img src={logo} alt={storeName} className="h-10 mx-auto mb-4 object-contain" />
      <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-medium mb-3">
        {t.storeCards.comingSoon}
      </span>
      
      {isSubscribed ? (
        <div className="flex items-center justify-center gap-2 text-green-600 py-2">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">{t.storeCards.subscribed}</span>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-2">
          <p className="text-sm text-muted-foreground mb-2">{t.storeCards.subscribeNotify}</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder={t.storeCards.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm h-9"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      )}
      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-3">
        <Mail className="w-3 h-3" /> {t.storeCards.contactEmail}
      </p>
    </div>
  );
};
