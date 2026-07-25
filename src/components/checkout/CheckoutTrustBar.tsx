import { Zap, ShieldCheck, RefreshCw, Headphones } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

type Lang = "es" | "en" | "fr" | "pt";

const COPY: Record<Lang, { title: string; items: string[]; note: string }> = {
  es: {
    title: "Compra protegida",
    items: [
      "Entrega inmediata por email",
      "Pago 100% seguro y cifrado",
      "Garantía de 7 días",
      "Soporte real por WhatsApp",
    ],
    note: "Solo toma 1 minuto: elige tu método de pago y recibes el acceso al instante.",
  },
  en: {
    title: "Protected purchase",
    items: [
      "Instant delivery by email",
      "100% secure encrypted payment",
      "7-day guarantee",
      "Real WhatsApp support",
    ],
    note: "It takes 1 minute: choose your payment method and get instant access.",
  },
  fr: {
    title: "Achat protégé",
    items: [
      "Livraison immédiate par email",
      "Paiement 100 % sécurisé",
      "Garantie 7 jours",
      "Assistance WhatsApp réelle",
    ],
    note: "1 minute suffit : choisissez votre moyen de paiement et recevez l'accès immédiatement.",
  },
  pt: {
    title: "Compra protegida",
    items: [
      "Entrega imediata por email",
      "Pagamento 100% seguro",
      "Garantia de 7 dias",
      "Suporte real por WhatsApp",
    ],
    note: "Leva 1 minuto: escolha o método de pagamento e receba o acesso na hora.",
  },
};

const ICONS = [Zap, ShieldCheck, RefreshCw, Headphones];

export function CheckoutTrustBar() {
  const { language } = useI18n();
  const copy = COPY[(language as Lang)] ?? COPY.es;

  return (
    <div className="rounded-2xl border bg-card/60 p-3 sm:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {copy.items.map((label, i) => {
          const Icon = ICONS[i];
          return (
            <div key={label} className="flex items-start gap-2 min-w-0">
              <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1.5">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </span>
              <span className="text-[11px] sm:text-xs font-medium leading-snug text-foreground/90">
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2.5 text-[11px] sm:text-xs text-muted-foreground text-center">
        {copy.note}
      </p>
    </div>
  );
}

export default CheckoutTrustBar;
