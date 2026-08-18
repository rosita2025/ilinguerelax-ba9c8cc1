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
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Envío Internacional
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recibe tu libro físico en la puerta de tu casa.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Países disponibles</p>
                    <p className="text-xs text-muted-foreground">
                      🇺🇸 USA · 🇨🇦 Canadá · 🇬🇧 UK · 🇦🇺 Australia · 🇳🇿 Nueva Zelanda · 🇲🇽 México · 🇪🇸 España · 🇦🇷 Argentina · 🇨🇱 Chile · 🇨🇴 Colombia · 🇵🇪 Perú
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Costo de envío</p>
                    <p className="text-xs text-muted-foreground">
                      Tarifa plana: <span className="font-bold">$8 USD</span>
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium leading-tight mt-1">
                      🎁 GRATIS en pedidos mayores a $50
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Pago Seguro</p>
                    <p className="text-xs text-muted-foreground">
                      Tus datos y dirección están protegidos por Stripe.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Gift className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Digital GRATIS</p>
                    <p className="text-xs text-muted-foreground">
                      Acceso inmediato al PDF tras la compra.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Table */}
            <div className="mt-8 pt-6 border-t border-muted/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumen del pedido</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Libro físico</span>
                  <span className="font-medium">{book === "english_8000" ? "$34.99" : book === "spanish_5000" ? "$34.99" : book === "spanish_3000_verbs" ? "$17.00" : book === "spanish_grammar_patterns" ? "$45.00" : "$24.00"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Digital (PDF)</span>
                  <span className="text-emerald-600 font-bold">GRATIS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-medium">$8.00</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{book === "english_8000" ? "$42.99" : book === "spanish_5000" ? "$42.99" : book === "spanish_3000_verbs" ? "$25.00" : book === "spanish_grammar_patterns" ? "$53.00" : "$32.00"}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic mt-2">
                * El tiempo de entrega estimado es de 7 a 15 días hábiles después del despacho.
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
