import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { buildSupportUrl, type SupportContext, type SupportReason } from "@/lib/support";
import { logCheckoutAction } from "@/hooks/useMetaPixel";

const COPY: Record<string, { cta: string; pick: string; reasons: Record<SupportReason, string> }> = {
  es: { cta: "¿Problemas para pagar? Escríbenos por WhatsApp", pick: "¿Qué te pasó?", reasons: { problem: "Tengo un problema de pago", error: "Me salió un error de pago", other: "Quiero otro método de pago", question: "Tengo una duda" } },
  en: { cta: "Trouble paying? Message us on WhatsApp", pick: "What happened?", reasons: { problem: "I have a payment problem", error: "I got a payment error", other: "I want another payment method", question: "I have a question" } },
  fr: { cta: "Un souci de paiement ? Écrivez-nous sur WhatsApp", pick: "Que s'est-il passé ?", reasons: { problem: "J'ai un problème de paiement", error: "J'ai eu une erreur de paiement", other: "Je veux un autre moyen de paiement", question: "J'ai une question" } },
  pt: { cta: "Problemas para pagar? Fale conosco no WhatsApp", pick: "O que aconteceu?", reasons: { problem: "Tenho um problema de pagamento", error: "Deu erro no pagamento", other: "Quero outro método de pagamento", question: "Tenho uma dúvida" } },
  it: { cta: "Problemi con il pagamento? Scrivici su WhatsApp", pick: "Cosa è successo?", reasons: { problem: "Ho un problema di pagamento", error: "Ho avuto un errore di pagamento", other: "Voglio un altro metodo di pagamento", question: "Ho un dubbio" } },
};

const ORDER: SupportReason[] = ["problem", "error", "other", "question"];
// Cada motivo con su propio color y emoji (el verde de WhatsApp queda solo en el encabezado).
const STYLE: Record<SupportReason, { emoji: string; cls: string }> = {
  problem: { emoji: "💳", cls: "border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-100" },
  error: { emoji: "⚠️", cls: "border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100" },
  other: { emoji: "🔄", cls: "border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100" },
  question: { emoji: "❓", cls: "border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-100" },
};

/**
 * Ayuda por WhatsApp: el cliente elige qué le pasó y se abre el chat con el mensaje ya escrito
 * (pedido, nombre, correo, producto, upsell o "sin upsell", precio, método, error y link del checkout).
 * Si todavía no llenó sus datos, el mensaje solo lleva el producto y el link (sin pedido).
 */
export function SupportWhatsApp({
  language = "es",
  variant = "menu",
  ...ctx
}: Omit<SupportContext, "reason"> & { variant?: "menu" | "error" }) {
  const c = COPY[language] ?? COPY.es;
  const [open, setOpen] = useState(false);
  const link = (reason: SupportReason) => buildSupportUrl({ language, ...ctx, reason });

  if (variant === "error") {
    // Un solo enlace discreto (sin botones de color) para no competir con el botón de pago.
    return (
      <a
        href={link("error")}
        onClick={() => logCheckoutAction("whatsapp_ayuda", "error")}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-[#128C7E] underline underline-offset-2"
      >
        <MessageCircle className="h-4 w-4" /> {c.reasons.error}
      </a>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-300 bg-white shadow-sm dark:border-emerald-900/50 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-center gap-2 px-3 py-2 text-center text-xs font-bold text-emerald-700 dark:text-emerald-200 sm:text-sm"
      >
        <span className="text-base leading-none" aria-hidden="true">🆘</span> {c.cta}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <p className="text-center text-xs text-muted-foreground">{c.pick}</p>
          {ORDER.map((r) => (
            <a
              key={r}
              href={link(r)}
              onClick={() => logCheckoutAction("whatsapp_ayuda", r)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-11 items-center justify-start gap-2.5 rounded-lg border px-3 py-2 text-sm font-semibold ${STYLE[r].cls}`}
            >
              <span className="text-lg leading-none" aria-hidden="true">{STYLE[r].emoji}</span>
              {c.reasons[r]}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
