import { useEffect, useRef, useState } from "react";
import { X, Gift, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_KEY_PREFIX = "product-exit-popup-shown-";
// Respaldo por tiempo: los datos reales mostraron visitas de 1 sola hit
// (rebote rápido) desde el navegador integrado de Facebook/Instagram en
// celular — 15s es más corto que en checkout porque aquí ni siquiera hay un
// formulario empezado, solo alguien mirando el producto.
const TIME_TRIGGER_MS = 15000;

interface Props {
  productSlug: string;
  productName: string;
  learnerLanguage?: string; // "es" | "en" | ... — del producto, no del visitante
}

const COPY: Record<string, { title: string; subtitle: string; placeholder: string; submit: string; success: string; close: string; invalid: string; doneTitle: string; doneHint: string; copy: string; copied: string }> = {
  es: {
    title: "¡Espera! Llévate 10% de descuento",
    subtitle: "Déjanos tu correo y te lo enviamos ahora mismo — sin compromiso.",
    placeholder: "tucorreo@email.com",
    submit: "Enviarme el descuento",
    success: "¡Listo! Te enviamos tu código NEW10.",
    close: "No gracias",
    invalid: "Escribe un correo válido",
    doneTitle: "¡Listo! Revisa tu correo",
    doneHint: "Copia tu código y pégalo en el checkout para tener 10% de descuento.",
    copy: "Copiar",
    copied: "¡Copiado!",
  },
  en: {
    title: "Wait! Get 10% off",
    subtitle: "Leave your email and we'll send it right now — no obligation.",
    placeholder: "your@email.com",
    submit: "Send me the discount",
    success: "Done! We sent you your NEW10 code.",
    close: "No thanks",
    invalid: "Enter a valid email",
    doneTitle: "Done! Check your email",
    doneHint: "Copy your code and paste it at checkout to get 10% off.",
    copy: "Copy",
    copied: "Copied!",
  },
  fr: {
    title: "Attendez ! Profitez de 10 % de réduction",
    subtitle: "Laissez-nous votre email et on vous l'envoie tout de suite — sans engagement.",
    placeholder: "votre@email.com",
    submit: "M'envoyer la réduction",
    success: "C'est fait ! Nous vous avons envoyé votre code NEW10.",
    close: "Non merci",
    invalid: "Entrez un email valide",
    doneTitle: "C'est fait ! Vérifiez votre email",
    doneHint: "Copiez votre code et collez-le au paiement pour obtenir 10 % de réduction.",
    copy: "Copier",
    copied: "Copié !",
  },
  pt: {
    title: "Espera! Ganhe 10% de desconto",
    subtitle: "Deixe seu email e enviamos agora mesmo — sem compromisso.",
    placeholder: "seu@email.com",
    submit: "Enviar meu desconto",
    success: "Pronto! Enviamos seu código NEW10.",
    close: "Não, obrigado",
    invalid: "Digite um email válido",
    doneTitle: "Pronto! Confira seu email",
    doneHint: "Copie seu código e cole no checkout para ter 10% de desconto.",
    copy: "Copiar",
    copied: "Copiado!",
  },
  it: {
    title: "Aspetta! Ottieni il 10% di sconto",
    subtitle: "Lasciaci la tua email e te lo inviamo subito, senza impegno.",
    placeholder: "tu@email.com",
    submit: "Inviami lo sconto",
    success: "Fatto! Ti abbiamo inviato il codice NEW10.",
    close: "No grazie",
    invalid: "Inserisci un'email valida",
    doneTitle: "Fatto! Controlla la tua email",
    doneHint: "Copia il codice e incollalo al checkout per ottenere il 10% di sconto.",
    copy: "Copia",
    copied: "Copiato!",
  },
};

/**
 * Popup de captura de correo para páginas de PRODUCTO (no checkout).
 * A diferencia del popup de checkout, aquí no hay ningún formulario
 * empezado — la mayoría de estas visitas son rebotes de 1 sola vista desde
 * el navegador integrado de Facebook/Instagram en celular, así que el
 * objetivo es simplemente capturar el correo antes de que se vayan, para
 * poder darles seguimiento después (aunque no compren en esta visita).
 *
 * El idioma se decide por `learnerLanguage` (el público objetivo DEL
 * PRODUCTO, configurado en /admin/productos), no por el idioma detectado
 * del visitante — mismo criterio que ya usamos en el resto de la página.
 */
export function ProductPageEmailCapturePopup({ productSlug, productName, learnerLanguage }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const shownRef = useRef(false);
  const sessionKey = `${SESSION_KEY_PREFIX}${productSlug}`;

  useEffect(() => {
    if (shownRef.current) return;
    if (sessionStorage.getItem(sessionKey)) return;

    const trigger = () => {
      if (shownRef.current) return;
      shownRef.current = true;
      sessionStorage.setItem(sessionKey, "1");
      setOpen(true);
    };

    // 1) Escritorio: mouse sale por arriba de la ventana.
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    // 2) Respaldo (todos los dispositivos, sobre todo móvil): tiempo en la
    // página sin interactuar.
    const timeTrigger = window.setTimeout(trigger, TIME_TRIGGER_MS);

    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.clearTimeout(timeTrigger);
    };
  }, [sessionKey]);

  if (!open) return null;

  const t = COPY[learnerLanguage || "es"] || COPY.es;

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      toast.error(t.invalid);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: {
          email: trimmed,
          source: "product-exit-popup",
          language: learnerLanguage || "es",
          product: productName,
          productSlug,
        },
      });
      if (error) throw error;
      // El cupón NO se aplica solo: el checkout empieza limpio y el cliente elige pegar NEW10 o pagar sin cupón.
      setDone(true);
      toast.success(t.success);
    } catch (err) {
      console.error("Error guardando correo del popup de producto:", err);
      toast.error(err instanceof Error ? err.message : "Error, intenta de nuevo");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText("NEW10");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* portapapeles no disponible: el código se ve en pantalla */ }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border bg-background p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {done ? <Mail className="h-6 w-6 text-primary" /> : <Gift className="h-6 w-6 text-primary" />}
        </div>

        <h3 className="text-lg font-bold">{done ? t.doneTitle : t.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{done ? t.doneHint : t.subtitle}</p>

        {done && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="rounded-lg border-2 border-dashed border-primary bg-primary/5 px-4 py-2 text-lg font-black tracking-widest">NEW10</span>
            <Button type="button" onClick={copyCode}>{copied ? t.copied : t.copy}</Button>
          </div>
        )}

        {!done && (
          <>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.placeholder}
              className="mb-3 mt-4 text-center"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "…" : t.submit}
            </Button>
            <button
              onClick={() => setOpen(false)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground underline"
            >
              {t.close}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
