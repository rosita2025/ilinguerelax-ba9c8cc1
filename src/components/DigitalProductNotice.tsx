import { FileText } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

const TEXTS: Record<string, { title: string; body: string }> = {
  es: {
    title: "Material digital en PDF descargable",
    body: "No es un curso: no incluye clases en vivo, profesor ni tutorías. Acceso inmediato por correo tras la compra.",
  },
  en: {
    title: "Downloadable digital PDF material",
    body: "This is not a course: no live classes, teacher or tutoring included. Instant access by email after purchase.",
  },
  pt: {
    title: "Material digital em PDF para download",
    body: "Não é um curso: não inclui aulas ao vivo, professor nem tutoria. Acesso imediato por e-mail após a compra.",
  },
  fr: {
    title: "Matériel numérique en PDF téléchargeable",
    body: "Ce n'est pas un cours : sans cours en direct, professeur ni tutorat. Accès immédiat par e-mail après l'achat.",
  },
};

interface Props {
  className?: string;
  compact?: boolean;
}

/** Aviso unificado: los productos son PDFs descargables, no clases en vivo. */
export function DigitalProductNotice({ className, compact = false }: Props) {
  const { language } = useI18n();
  const t = TEXTS[language] ?? TEXTS.es;

  return (
    <div
      className={cn(
        "flex gap-2.5 items-start rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5",
        className,
      )}
    >
      <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <p className={cn("text-muted-foreground leading-snug", compact ? "text-[11px]" : "text-xs")}>
        <strong className="text-foreground font-semibold">{t.title}.</strong> {t.body}
      </p>
    </div>
  );
}

export default DigitalProductNotice;
