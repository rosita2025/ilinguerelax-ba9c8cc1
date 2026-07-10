import { Helmet } from "react-helmet-async";
import { Lock, ShieldCheck, MessageCircle } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { OrderSummary } from "@/components/checkout/OrderSummary";

import { BuyerInfoForm } from "@/components/checkout/BuyerInfoForm";
import { PaymentMethodsGroup } from "@/components/checkout/PaymentMethodsGroup";
import { useCheckoutPruebaStore } from "@/stores/checkoutPruebaStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";

export default function CheckoutPrueba1() {
  const { resetToDefaults } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const isPeru = (region.country || "").toUpperCase() === "PE";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Checkout Prueba 1 · ILINGUE RELAX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PaymentTestModeBanner />

      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <span
            className="text-base sm:text-xl font-bold tracking-tight whitespace-nowrap"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            ILINGUE <span className="text-primary">RELAX</span>
          </span>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">
            <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="hidden sm:inline font-medium">
              {isPeru ? t.stripeSslMP : t.stripeSSL}
            </span>
            <span className="sm:hidden font-medium">SSL</span>
          </div>


        </div>
      </header>

      <div className="lg:hidden max-w-6xl mx-auto px-3 sm:px-4 pt-3">
        <OrderSummary collapsible />
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-10 grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
        <div className="space-y-6">
          <BuyerInfoForm />
          <PaymentMethodsGroup />

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {t.sslEncryption}
            </span>
            {isPeru && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {t.mercadoPagoPeru}
                </span>
              </>
            )}
            <span>·</span>

            <a
              href="https://wa.me/112512724704"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary"
            >
              <MessageCircle className="w-3.5 h-3.5" /> {t.whatsappSupport}
            </a>
          </div>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <OrderSummary />
          
          <button
            type="button"
            onClick={resetToDefaults}
            className="text-xs text-muted-foreground hover:text-primary mt-3 underline underline-offset-2"
          >
            {t.resetTestProducts}
          </button>
        </aside>
      </div>

    </div>
  );
}

