import { useState } from "react";
import { ArrowRight, Mail, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StoreSubscriptionCardProps {
  logo: string;
  storeName: string;
  type: "coming-soon" | "available";
  buyLink?: string;
}

export const StoreSubscriptionCard = ({
  logo,
  storeName,
  type,
  buyLink,
}: StoreSubscriptionCardProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
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
        },
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "¡Suscrito!",
        description: `Te notificaremos cuando esté disponible en ${storeName}`,
      });
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Error",
        description: "No se pudo suscribir. Intenta de nuevo.",
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
          🛒 Compra Anticipada
        </span>
        <p className="text-sm text-muted-foreground mb-3">¡Disponible ahora!</p>
        <a
          href={buyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Comprar Ahora <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 text-center shadow-card">
      <img src={logo} alt={storeName} className="h-10 mx-auto mb-4 object-contain" />
      <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-medium mb-3">
        📦 Próximamente
      </span>
      
      {isSubscribed ? (
        <div className="flex items-center justify-center gap-2 text-green-600 py-2">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">¡Suscrito!</span>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-2">
          <p className="text-sm text-muted-foreground mb-2">Suscríbete para ser notificado</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="tu@email.com"
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
    </div>
  );
};