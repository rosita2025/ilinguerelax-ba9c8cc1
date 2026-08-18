import { useCallback, useMemo } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Truck, ShieldCheck, Globe, Gift } from "lucide-react";

export type PhysicalBookKey = "english_5000" | "english_8000" | "spanish_5000" | "spanish_3000_verbs" | "spanish_grammar_patterns";

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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
        <div className="bg-background rounded-xl shadow-2xl border overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          {/* Left Side: Shipping Summary */}
          <div className="w-full md:w-80 bg-muted/30 p-6 border-b md:border-b-0 md:border-r flex flex-col">
            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  Envío Internacional
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Recibe tu libro físico en la puerta de tu casa.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex gap-3">
                  <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Países disponibles</p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      US · CA · UK · AU · NZ · MX · ES · AR · CL · CO · PE
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Costo de envío</p>
                    <p className="text-[11px] text-muted-foreground">
                      Tarifa plana: <span className="font-bold text-slate-900">$8 USD</span>
                    </p>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mt-1.5 inline-block bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      🎁 GRATIS > $50
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Pago Seguro</p>
                    <p className="text-[11px] text-muted-foreground">
                      Protegido por SSL y Stripe.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Gift className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-600">Digital GRATIS</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Acceso al PDF tras la compra.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Table */}
            <div className="mt-8 pt-6 border-t border-muted-foreground/10 space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Resumen del pedido</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Libro físico</span>
                  <span className="font-black text-slate-900">{book === "english_8000" ? "$34.99" : book === "spanish_5000" ? "$34.99" : book === "spanish_3000_verbs" ? "$17.00" : book === "spanish_grammar_patterns" ? "$45.00" : "$24.00"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Digital (PDF)</span>
                  <span className="text-emerald-600 font-black uppercase tracking-tighter text-xs">GRATIS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Envío</span>
                  <span className="font-black text-slate-900">$8.00</span>
                </div>
                <div className="pt-2 border-t border-slate-900/5 flex justify-between font-black text-lg text-slate-900">
                  <span>Total</span>
                  <span>{book === "english_8000" ? "$42.99" : book === "spanish_5000" ? "$42.99" : book === "spanish_3000_verbs" ? "$25.00" : book === "spanish_grammar_patterns" ? "$53.00" : "$32.00"}</span>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground italic mt-3 leading-tight opacity-70">
                * Despacho internacional vía Amazon Logistics.
              </p>
            </div>
          </div>

          {/* Right Side: Stripe Checkout */}
          <div className="flex-1 p-4 md:p-6 bg-white relative">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl md:text-2xl font-black text-slate-900">
                {title || "Finalizar Compra"}
              </DialogTitle>
            </DialogHeader>

            {open && stripePromise && (
              <div id="checkout" className="min-h-[400px]">
                <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
            
            {!stripePromise && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Configurando pasarela de pago...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
