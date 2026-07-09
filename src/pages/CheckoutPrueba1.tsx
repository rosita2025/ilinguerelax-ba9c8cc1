import { useState, useCallback, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { ArrowLeft, ShieldCheck, Lock, CreditCard, Wallet, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { ContactForm, ContactData } from "@/components/checkout/ContactForm";
import { useCheckoutPruebaStore, calcTotals } from "@/stores/checkoutPruebaStore";
import { toast } from "@/hooks/use-toast";

export default function CheckoutPrueba1() {
  const { items, coupon, couponPercent, resetToDefaults } = useCheckoutPruebaStore();
  const { total } = calcTotals(items, couponPercent);

  const [stage, setStage] = useState<"form" | "paying">("form");
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [formValid, setFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const partialRef = useRef<Partial<ContactData>>({});

  const stripePromise = useMemo(() => {
    try {
      return getStripe();
    } catch {
      return null;
    }
  }, []);

  const handleFormChange = useCallback((isValid: boolean, data: Partial<ContactData>) => {
    setFormValid(isValid);
    partialRef.current = data;
  }, []);

  const handleValid = (data: ContactData) => {
    setContactData(data);
    setStage("paying");
  };

  const startPayment = () => {
    // Trigger form submission
    const formEl = document.getElementById("checkout-contact-form") as HTMLFormElement | null;
    if (formEl) formEl.requestSubmit();
  };

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    if (!contactData) throw new Error("Faltan datos del comprador");
    if (items.length === 0) throw new Error("Carrito vacío");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-prueba", {
        body: {
          environment: getStripeEnvironment(),
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            description: i.description,
          })),
          currency: "usd",
          couponPercent,
          couponCode: coupon ?? undefined,
          contact: contactData,
          returnUrl: `${window.location.origin}/checkouts/return?session_id={CHECKOUT_SESSION_ID}`,
        },
      });
      if (error || !data?.clientSecret) {
        const msg = error?.message || "No se pudo crear la sesión de pago";
        toast({ title: "Error de pago", description: msg, variant: "destructive" });
        throw new Error(msg);
      }
      return data.clientSecret;
    } finally {
      setLoading(false);
    }
  }, [contactData, items, coupon, couponPercent]);

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-xl font-bold mb-2">Pagos no configurados</h1>
          <p className="text-muted-foreground">
            Completa la configuración de Stripe para habilitar este checkout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Checkout Prueba 1 · ILINGUE RELAX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PaymentTestModeBanner />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              ILINGUE <span className="text-primary">RELAX</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            Pago 100% seguro
          </div>
        </div>
      </header>

      {/* Mobile order summary (collapsible) */}
      <div className="lg:hidden max-w-6xl mx-auto px-4 pt-4">
        <OrderSummary collapsible />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 grid lg:grid-cols-[1fr_400px] gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {stage === "form" ? (
            <>
              {/* Express checkout section */}
              <section className="space-y-3">
                <div className="flex items-center gap-3 text-center">
                  <div className="flex-1 border-t" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Express checkout
                  </span>
                  <div className="flex-1 border-t" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled
                    className="h-11 rounded-md bg-black text-white text-sm font-medium flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
                    aria-label="Google Pay (disponible en Stripe)"
                  >
                    <Wallet className="w-4 h-4" /> G Pay
                  </button>
                  <button
                    type="button"
                    disabled
                    className="h-11 rounded-md bg-black text-white text-sm font-medium flex items-center justify-center opacity-70 cursor-not-allowed"
                    aria-label="Apple Pay (disponible en Stripe)"
                  >
                     Pay
                  </button>
                  <button
                    type="button"
                    disabled
                    className="h-11 rounded-md bg-[#ffc439] text-[#003087] text-sm font-bold flex items-center justify-center opacity-70 cursor-not-allowed"
                    aria-label="PayPal (disponible en Stripe)"
                  >
                    PayPal
                  </button>
                </div>
                <p className="text-[11px] text-center text-muted-foreground">
                  Los métodos express aparecerán al iniciar el pago según tu dispositivo.
                </p>
              </section>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">O completa tus datos</span>
                <div className="flex-1 border-t" />
              </div>

              <ContactForm onValid={handleValid} onChange={handleFormChange} />

              <div className="space-y-3 pt-2">
                <Button
                  onClick={startPayment}
                  disabled={!formValid || items.length === 0 || loading}
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Continuar al pago · ${total.toFixed(2)}
                </Button>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> SSL Stripe
                  </span>
                  <span>·</span>
                  <span>Garantía 30 días</span>
                  <span>·</span>
                  <a
                    href="https://wa.me/15752160934"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStage("form")}
                className="mb-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Cambiar datos
              </Button>
              <div className="rounded-xl border overflow-hidden bg-background">
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={{ fetchClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN — desktop only */}
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <OrderSummary />
          <button
            type="button"
            onClick={resetToDefaults}
            className="text-xs text-muted-foreground hover:text-primary mt-3 underline underline-offset-2"
          >
            Restablecer productos de prueba
          </button>
        </aside>
      </div>
    </div>
  );
}
