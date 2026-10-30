import { useEffect, useRef, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { logCheckoutAction } from "@/hooks/useMetaPixel";

const SESSION_KEY = "exit-coupon-shown-v1";
// Sin temporizador: el popup solo sale en escritorio cuando el mouse sale por arriba de la ventana.
// En celular no sale (confundía a personas mayores y bloqueaba el botón "atrás").

interface Props {
  language: string;
}

const WHATSAPP_NUMBER = "12512724704";

// El idioma llega desde el checkout y ya sigue la categoría del producto
// (español = hispanohablantes que aprenden inglés · inglés = angloparlantes que aprenden español).
const COPY: Record<string, { title: string; sub: string; cta: string; close: string; waMsg: (product: string) => string }> = {
  es: {
    title: "Espera, no cierres la pantalla",
    sub: "¿Tienes dudas? Te ayudamos por WhatsApp",
    cta: "Escríbenos ahora",
    close: "No gracias",
    waMsg: (p) => `Hola, me interesa ${p || "este producto"} y quiero pagar / tengo una duda.`,
  },
  en: {
    title: "Wait, don't close the screen",
    sub: "Any questions? We'll help you on WhatsApp",
    cta: "Message us now",
    close: "No thanks",
    waMsg: (p) => `Hi, I'm interested in ${p || "this product"} and I want to pay / I have a question.`,
  },
  fr: {
    title: "Attendez, ne fermez pas l'écran",
    sub: "Des questions ? Nous vous aidons sur WhatsApp",
    cta: "Écrivez-nous maintenant",
    close: "Non merci",
    waMsg: (p) => `Bonjour, je suis intéressé(e) par ${p || "ce produit"} et je veux payer / j'ai une question.`,
  },
  pt: {
    title: "Espere, não feche a tela",
    sub: "Tem dúvidas? Ajudamos você pelo WhatsApp",
    cta: "Fale conosco agora",
    close: "Não, obrigado",
    waMsg: (p) => `Olá, tenho interesse em ${p || "este produto"} e quero pagar / tenho uma dúvida.`,
  },
  it: {
    title: "Aspetta, non chiudere la schermata",
    sub: "Hai dubbi? Ti aiutiamo su WhatsApp",
    cta: "Scrivici ora",
    close: "No grazie",
    waMsg: (p) => `Ciao, sono interessato/a a ${p || "questo prodotto"} e voglio pagare / ho un dubbio.`,
  },
};

/**
 * Popup de "no cierres esta pantalla" (ya NO ofrece cupón: el 10% se entrega por el popup de
 * suscripción por correo). Muestra un botón de ayuda por WhatsApp con el mensaje ya escrito.
 * Aparece una sola vez por sesión cuando el
 * comprador da una señal razonable de estar por abandonar Y todavía no
 * llenó su correo (si ya lo llenó, el sistema de recuperación de carrito
 * ya puede contactarlo por email, así que este popup no hace falta).
 *
 * Señal usada (solo escritorio con mouse): el mouse sale por arriba de la ventana.
 * En celular no sale: volver a la pestaña es normal al pagar con la app del banco, y
 * atrapar el botón "atrás" confundía a personas mayores.
 * SIN temporizador (decisión de Rosa).
 *
 * NOTA: no es posible interceptar el cierre real de la pestaña/navegador
 * para mostrar un popup propio — los navegadores lo bloquean por seguridad
 * y solo permiten su propio aviso genérico, sin diseño personalizado.
 */
export function ExitIntentCouponPopup({ language }: Props) {
  const buyerEmail = useCheckoutPruebaStore((s) => s.buyer.email);
  const items = useCheckoutPruebaStore((s) => s.items);
  const [open, setOpen] = useState(false);
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
      logCheckoutAction("popup_cierres_visto");
    };

    // 1) Escritorio: mouse sale por arriba de la ventana.
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    // Solo escritorio con mouse. En celular NO se muestra nada: ni al volver a la pestaña
    // (mucha gente sale a su app del banco/Yape y regresa) ni al tocar "atrás".
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [buyerEmail]);

  if (!open) return null;

  const t = COPY[language] || COPY.es;
  // Producto principal del pedido (el primero que no sea un upsell).
  const productName =
    (items.find((i) => !String(i.id).toLowerCase().startsWith("upsell-")) ?? items[0])?.name ?? "";
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.waMsg(productName))}`;

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

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/15">
          <MessageCircle className="h-6 w-6 text-[#128C7E]" />
        </div>

        <h3 className="text-lg font-bold">{t.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>

        <a
          href={waUrl}
          onClick={() => logCheckoutAction("whatsapp_popup")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20bd5a]"
        >
          <MessageCircle className="h-4 w-4" />
          {t.cta}
        </a>

        <button
          onClick={() => { logCheckoutAction("popup_cierres_cerrado"); setOpen(false); }}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground underline"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
