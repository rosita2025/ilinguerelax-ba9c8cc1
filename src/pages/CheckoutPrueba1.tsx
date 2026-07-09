import { Helmet } from "react-helmet-async";
import { Lock, ShieldCheck, MessageCircle } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { AddProductForm } from "@/components/checkout/AddProductForm";
import { BuyerInfoForm } from "@/components/checkout/BuyerInfoForm";
import { PaymentMethodsGroup } from "@/components/checkout/PaymentMethodsGroup";
import { useCheckoutPruebaStore } from "@/stores/checkoutPruebaStore";

export default function CheckoutPrueba1() {
  const { resetToDefaults } = useCheckoutPruebaStore();

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
        <div className="space-y-6">
          <BuyerInfoForm />
          <PaymentMethodsGroup />

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

