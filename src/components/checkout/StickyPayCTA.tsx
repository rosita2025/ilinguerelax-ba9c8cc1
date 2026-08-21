import { Lock, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { isBuyerValid } from "@/components/checkout/BuyerInfoForm";

/**
 * Barra fija en la parte inferior del checkout (solo móvil).
 *
 * Es consciente del paso en el que está el comprador:
 * - Si todavía no llenó nombre/correo (paso 1), apunta hacia ARRIBA, al
 *   formulario, y lo dice explícitamente.
 * - Una vez el formulario es válido (paso 2), cambia a "elige tu método de
 *   pago" y apunta hacia ABAJO, a la lista de métodos.
 */
export function StickyPayCTA() {
  const { language } = useI18n();
  const buyer = useCheckoutPruebaStore((s) => s.buyer);
  const hasPhysicalItems = useCheckoutPruebaStore((s) => s.hasPhysicalItems());
  const valid = isBuyerValid(buyer, hasPhysicalItems);

  const label = valid
    ? (language === "en"
        ? "Choose your payment method below"
        : language === "pt"
          ? "Escolha a forma de pagamento abaixo"
          : language === "fr"
            ? "Choisissez le mode de paiement ci-dessous"
            : "Elige tu método de pago abajo")
    : (language === "en"
        ? "Complete your info above first"
        : language === "pt"
          ? "Complete seus dados acima primeiro"
          : language === "fr"
            ? "Complétez vos infos ci-dessus d'abord"
            : "Completa tus datos arriba primero");

  const scrollToTarget = () => {
    const el = document.getElementById(valid ? "payment-methods-section" : "buyer-info-section");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-3 py-2.5">
        <button
          type="button"
          onClick={scrollToTarget}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] transition-transform"
        >
          {valid ? <CreditCard className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{label}</span>
          {valid ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
