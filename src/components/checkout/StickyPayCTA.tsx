import { Lock, ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

/**
 * Barra fija en la parte inferior del checkout (solo móvil).
 *
 * Problema que resuelve: en móvil, el botón real de pago vive al final de
 * PaymentMethodsGroup, después del formulario de datos y del panel de
 * upsells. El comprador puede hacer mucho scroll sin ver nunca un botón de
 * "pagar" visible, lo que genera abandono silencioso.
 *
 * Esta barra no duplica el cálculo de totales (para no arriesgar
 * inconsistencias de precio): solo da un CTA persistente que lleva al
 * comprador directo a la sección de métodos de pago, donde ya está el total
 * real y el botón de pago funcional.
 */
export function StickyPayCTA() {
  const { language } = useI18n();

  const label =
    language === "en"
      ? "Continue to payment"
      : language === "pt"
        ? "Continuar para pagamento"
        : language === "fr"
          ? "Continuer vers le paiement"
          : "Continuar al pago";

  const scrollToPayment = () => {
    const el = document.getElementById("payment-methods-section");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-3 py-2.5">
        <button
          type="button"
          onClick={scrollToPayment}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] transition-transform"
        >
          <Lock className="w-4 h-4" />
          <span>{label}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
