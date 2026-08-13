import { useCallback, useMemo } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

export type PhysicalBookKey = "english_5000" | "english_8000" | "spanish_5000";

interface PhysicalBookCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: PhysicalBookKey;
  title?: string;
}

export function PhysicalBookCheckout({ open, onOpenChange, book, title }: PhysicalBookCheckoutProps) {
  const stripePromise = useMemo(() => {
    try {
      return getStripe();
    } catch {
      return null;
    }
  }, []);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-physical-checkout", {
      body: {
        book,
        quantity: 1,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || data?.error || "No se pudo iniciar el pago");
    }
    return data.clientSecret as string;
  }, [book]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">
            {title || "Pago seguro — Envío internacional"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-2">
          Envíos: 🇺🇸 USA · 🇨🇦 Canadá · 🇬🇧 UK · 🇦🇺 Australia · 🇳🇿 Nueva Zelanda
        </p>
        {open && stripePromise && (
          <div id="checkout">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
