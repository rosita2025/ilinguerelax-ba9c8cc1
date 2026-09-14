import { useEffect, useRef, useState } from "react";
import { Copy, Check, X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { toast } from "sonner";

const COUPON_CODE = "NEW10";
const SESSION_KEY = "exit-coupon-shown-v1";

interface Props {
  language: string;
}

/**
 * Popup de "no te vayas": aparece una sola vez por sesión cuando el
 * comprador está a punto de abandonar (mueve el mouse hacia la pestaña en
 * escritorio, o pasa un tiempo sin actividad en móvil) Y todavía no llenó
 * su correo — es decir, el sistema de recuperación de carrito ni siquiera
 * podría contactarlo después. Ofrece el cupón NEW10 (10% de descuento),
 * con un botón para aplicarlo directo (atómico) y también el texto para
 * copiar/pegar manualmente.
 */
export function ExitIntentCouponPopup({ language }: Props) {
  const buyerEmail = useCheckoutPruebaStore((s) => s.buyer.email);
  const applyCoupon = useCheckoutPruebaStore((s) => s.applyCoupon);
  const coupon = useCheckoutPruebaStore((s) => s.coupon);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    // Ya se mostró en esta sesión de pestaña, o ya hay un cupón aplicado, o
    // el correo ya está lleno (ya no aplica el motivo de este popup).
    if (shownRef.current) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const emailFilled = (buyerEmail || "").trim().length > 3;

    const trigger = () => {
      if (shownRef.current) return;
      if ((buyerEmail || "").trim().length > 3) return; // recheck at trigger time
      shownRef.current = true;
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    };

    // Escritorio: el mouse sale por arriba de la ventana (intención real de
    // cerrar pestaña / cambiar de sitio).
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    // Móvil (no hay "mouseleave" confiable): si pasan 25s sin llenar el
    // correo, es una señal razonable de que puede estar por irse.
    const mobileTimer = window.setTimeout(() => {
      if (!emailFilled) trigger();
    }, 25000);

    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.clearTimeout(mobileTimer);
    };
  }, [buyerEmail]);

  if (!open || coupon) return null;

  const t = {
    title: language === "en" ? "Wait, don't go!" : "¡Espera, no te vayas!",
    subtitle:
      language === "en"
        ? "Take 10% off your order — just apply this code before you check out."
        : "Llévate 10% de descuento en tu pedido — solo aplica este código antes de pagar.",
    apply: language === "en" ? "Apply discount" : "Aplicar descuento",
    applied: language === "en" ? "Applied ✓" : "Aplicado ✓",
    copied: language === "en" ? "Copied!" : "¡Copiado!",
    close: language === "en" ? "No thanks, continue" : "No gracias, continuar",
  };

  const handleApply = () => {
    const ok = applyCoupon(COUPON_CODE);
    if (ok) {
      toast.success(
        language === "en" ? "10% discount applied!" : "¡10% de descuento aplicado!",
      );
      setOpen(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable, still show the code visually */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-coupon-title"
    >
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Gift className="w-7 h-7 text-primary" />
          </div>

          <div className="space-y-1">
            <h2
              id="exit-coupon-title"
              className="text-xl sm:text-2xl font-bold tracking-tight"
            >
              {t.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <div className="w-full flex items-stretch gap-2 rounded-xl border border-dashed border-border bg-muted/50 p-2">
            <div className="flex-1 flex items-center justify-center rounded-lg bg-background border border-border font-bold tracking-widest text-sm sm:text-base select-all">
              {COUPON_CODE}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              aria-label="Copiar código"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  {t.copied}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {language === "en" ? "Copy" : "Copiar"}
                </>
              )}
            </button>
          </div>

          <Button
            type="button"
            onClick={handleApply}
            className="w-full rounded-xl font-semibold"
            size="lg"
          >
            {t.apply}
          </Button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
