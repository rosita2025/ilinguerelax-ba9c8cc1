import { useEffect, useRef, useState } from "react";
import { Copy, Check, X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { toast } from "sonner";

const COUPON_CODE = "NEW10";
const SESSION_KEY = "exit-coupon-shown-v1";
// 30s de espera cuando el correo sigue vacío, sin usar el gesto de scroll
// (causaba falsas alarmas con desplazamiento normal, no solo intención real
// de irse).
const MOBILE_TIMEOUT_MS = 30000;

interface Props {
  language: string;
}

const COPY: Record<string, { title: string; subtitle: string; apply: string; copied: string; close: string }> = {
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
 * - Todos los dispositivos (respaldo): pasan 30s sin llenar el correo.
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

    // 3) Respaldo (todos los dispositivos): tiempo sin llenar el correo.
    // Antes también existía un disparador por "scroll rápido hacia arriba",
    // pero se activaba con scroll normal (leyendo la página), no solo con
    // intención real de irse — se quitó por dar demasiadas falsas alarmas.
    const mobileTimer = window.setTimeout(() => {
      trigger();
    }, MOBILE_TIMEOUT_MS);

    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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

 setOpen(false)}
    >

 e.stopPropagation()}
      >
         setOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >





          {t.title}


        {t.subtitle}





            {COUPON_CODE}



            {copied ?  : }




          {t.apply}


         setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          {t.close}




  );
}
