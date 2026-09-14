import { useEffect, useRef, useState } from "react";
import { Copy, Check, X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { toast } from "sonner";

const COUPON_CODE = "NEW10";
const SESSION_KEY = "exit-coupon-shown-v1";
// Antes 25s — se sentía muy lento. 12s da tiempo de terminar de escribir el
// nombre sin ser tan tarde como para perder a alguien que ya se está yendo.
const MOBILE_TIMEOUT_MS = 12000;
// Scroll hacia arriba más rápido que esto (px/ms) se interpreta como
// "puede estar por irse" (gesto típico antes de cerrar o cambiar de app).
const FAST_SCROLL_UP_THRESHOLD = 1.2;

interface Props {
  language: string;
}

interface CopyEntry {
  title: string;
  subtitle: string;
  apply: string;
  copied: string;
  close: string;
}

const COPY: Record<string, CopyEntry> = {
  es: {
    title: "¡Espera, no te vayas!",
    subtitle: "Llévate 10% de descuento en tu pedido — solo aplica este código antes de pagar.",
    apply: "Aplicar descuento",
    copied: "¡Copiado!",
    close: "No gracias, continuar",
  },
  en: {
    title: "Wait, don't go!",
    subtitle: "Take 10% off your order — just apply this code before you check out.",
    apply: "Apply discount",
    copied: "Copied!",
    close: "No thanks, continue",
  },
  fr: {
    title: "Attendez, ne partez pas !",
    subtitle: "Profitez de 10 % de réduction — appliquez ce code avant de payer.",
    apply: "Appliquer la réduction",
    copied: "Copié !",
    close: "Non merci, continuer",
  },
  pt: {
    title: "Espera, não vá embora!",
    subtitle: "Ganhe 10% de desconto no seu pedido — é só aplicar este código antes de pagar.",
    apply: "Aplicar desconto",
    copied: "Copiado!",
    close: "Não, obrigado, continuar",
  },
};

/**
 * Popup de "no te vayas": aparece una sola vez por sesión cuando el
 * comprador da una señal razonable de estar por abandonar Y todavía no
 * llenó su correo (si ya lo llenó, el sistema de recuperación de carrito
 * ya puede contactarlo por email, así que este popup no hace falta).
 *
 * Señales de abandono usadas:
 * - Escritorio: el mouse sale por arriba de la ventana.
 * - Todos los dispositivos: vuelve a la pestaña después de estar en otra
 *   (cambiar de app/pestaña y regresar es una señal común de duda).
 * - Todos los dispositivos: scroll rápido hacia arriba (gesto típico antes
 *   de cerrar o salir).
 * - Móvil (respaldo): pasan 12s sin llenar el correo.
 *
 * NOTA: no es posible interceptar el cierre real de la pestaña/navegador
 * para mostrar un popup propio — los navegadores lo bloquean por seguridad
 * y solo permiten su propio aviso genérico, sin diseño personalizado.
 */
export function ExitIntentCouponPopup({ language }: Props) {
  const buyerEmail = useCheckoutPruebaStore((s) => s.buyer.email);
  const applyCoupon = useCheckoutPruebaStore((s) => s.applyCoupon);
  const coupon = useCheckoutPruebaStore((s) => s.coupon);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const trigger = () => {
      if (shownRef.current) return;
      if ((buyerEmail || "").trim().length > 3) return; // correo ya lleno: no hace falta
      shownRef.current = true;
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    };

    // 1) Escritorio: mouse sale por arriba de la ventana.
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    // 2) Vuelve a la pestaña después de estar en otra (todos los dispositivos).
    let wasHidden = false;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
      } else if (document.visibilityState === "visible" && wasHidden) {
        trigger();
      }
    };

    // 3) Scroll rápido hacia arriba (todos los dispositivos).
    let lastScrollY = window.scrollY;
    let lastScrollT = Date.now();
    const onScroll = () => {
      const now = Date.now();
      const dy = lastScrollY - window.scrollY; // positivo = scroll hacia arriba
      const dt = Math.max(1, now - lastScrollT);
      if (dy > 0 && dy / dt > FAST_SCROLL_UP_THRESHOLD) trigger();
      lastScrollY = window.scrollY;
      lastScrollT = now;
    };

    // 4) Respaldo en móvil: tiempo sin llenar el correo.
    const mobileTimer = window.setTimeout(() => {
      trigger();
    }, MOBILE_TIMEOUT_MS);

    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(mobileTimer);
    };
  }, [buyerEmail]);

  if (!open || coupon) return null;

  const t = COPY[language] || COPY.es;

  const handleApply = () => {
    const ok = applyCoupon(COUPON_CODE);
    if (ok) {
      toast.success(t.apply + " ✓");
      setOpen(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable, still show the code visually */ }
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
