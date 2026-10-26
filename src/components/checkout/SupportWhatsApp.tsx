import { MessageCircle } from "lucide-react";
import { buildSupportUrl, type SupportContext } from "@/lib/support";

const COPY: Record<string, { cta: string; problem: string }> = {
  es: { cta: "¿Problemas para pagar? Escríbenos por WhatsApp", problem: "Escribir por WhatsApp con mi pedido" },
  en: { cta: "Trouble paying? Message us on WhatsApp", problem: "Message us on WhatsApp with my order" },
  fr: { cta: "Un souci de paiement ? Écrivez-nous sur WhatsApp", problem: "Écrire sur WhatsApp avec ma commande" },
  pt: { cta: "Problemas para pagar? Fale conosco no WhatsApp", problem: "Falar no WhatsApp com meu pedido" },
  it: { cta: "Problemi con il pagamento? Scrivici su WhatsApp", problem: "Scrivici su WhatsApp con il mio ordine" },
};

/**
 * Botón de WhatsApp con el mensaje ya escrito (pedido, producto, correo, país, monto, método y error),
 * para que el cliente solo toque "enviar" y no haya que adivinar de qué pago habla.
 */
export function SupportWhatsApp({ language = "es", variant = "link", ...ctx }: SupportContext & { variant?: "link" | "error" }) {
  const c = COPY[language] ?? COPY.es;
  const href = buildSupportUrl({ language, ...ctx, kind: "problem" });
  if (variant === "error") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#20bd5a]"
      >
        <MessageCircle className="h-4 w-4" /> {c.problem}
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-center text-xs font-semibold text-emerald-800 hover:border-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200 sm:text-sm"
    >
      <MessageCircle className="h-4 w-4 shrink-0 text-[#128C7E]" /> {c.cta}
    </a>
  );
}
