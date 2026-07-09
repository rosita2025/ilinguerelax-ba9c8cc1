import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Lock, ShieldCheck, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { AddProductForm } from "@/components/checkout/AddProductForm";
import { MercadoPagoButton } from "@/components/checkout/MercadoPagoButton";
import { useCheckoutPruebaStore, calcTotals } from "@/stores/checkoutPruebaStore";
import { toast } from "@/hooks/use-toast";

export default function CheckoutPrueba1() {
  const { items, coupon, couponPercent, resetToDefaults } = useCheckoutPruebaStore();
  const { total } = calcTotals(items, couponPercent);
  const [showStripe, setShowStripe] = useState(false);

  const stripePromise = useMemo(() => {
    try {
      return getStripe();
    } catch {
      return null;
    }
  }, []);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    if (items.length === 0) throw new Error("Carrito vacío");
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
        // Datos mínimos — Stripe recoge email + dirección en su propio form
        contact: {
          email: "guest@ilinguerelax.com",
          phone: "+10000000000",
          firstName: "Guest",
          lastName: "Checkout",
          country: (localStorage.getItem("ilr_country") || "PE").toUpperCase().slice(0, 2),
        },
        returnUrl: `${window.location.origin}/checkouts/return?session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if (error || !data?.clientSecret) {
      const msg = error?.message || "No se pudo crear la sesión de pago";
      toast({ title: "Error de pago", description: msg, variant: "destructive" });
      throw new Error(msg);
    }
    return data.clientSecret;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable — Stripe no permite cambiar clientSecret después de montar

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

      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            ILINGUE <span className="text-primary">RELAX</span>
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            Pago 100% seguro
          </div>
        </div>
      </header>

      <div className="lg:hidden max-w-6xl mx-auto px-4 pt-4">
        <OrderSummary collapsible />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Finalizar compra</h1>
            <p className="text-sm text-muted-foreground">
              Total a pagar: <span className="font-semibold text-foreground">${total.toFixed(2)} USD</span>
              {" · "}Google Pay, Apple Pay, PayPal, Link y tarjetas.
            </p>
          </div>

          <MercadoPagoButton />

          <div className="rounded-xl border overflow-hidden bg-background">
            {items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Tu carrito está vacío.</div>
            ) : !showStripe ? (
              <button
                type="button"
                onClick={() => setShowStripe(true)}
                className="w-full p-6 text-left hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Pagar con tarjeta, PayPal, Google Pay o Apple Pay
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Powered by Stripe · Toca para abrir el formulario seguro
                  </div>
                </div>
                <span className="text-primary text-sm font-medium shrink-0">Abrir →</span>
              </button>
            ) : (
              <div className="min-h-[500px]">
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={{ fetchClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </div>


          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
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
              <MessageCircle className="w-3.5 h-3.5" /> Soporte WhatsApp
            </a>
          </div>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <OrderSummary />
          <AddProductForm />
          <button
            type="button"
            onClick={resetToDefaults}
            className="text-xs text-muted-foreground hover:text-primary mt-3 underline underline-offset-2"
          >
            Restablecer productos de prueba
          </button>
        </aside>
      </div>

      <div className="lg:hidden max-w-6xl mx-auto px-4 pb-8">
        <AddProductForm />
      </div>
    </div>
  );
}
