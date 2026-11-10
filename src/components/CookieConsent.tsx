import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

import { CONSENT_KEY, ensureVisitorCountry, getCookieConsent as readConsent, isEuUser as euUser } from "@/lib/euConsent";

export const getCookieConsent = readConsent;
export const isEuUser = euUser;

// Versión del banner: Europa debe volver a elegir al actualizarla.
const CONSENT_VERSION = "2";
const VERSION_KEY = "ilr_cookie_consent_v";

/** Europa: si la respuesta es del banner anterior, se borra para volver a preguntar. */
const resetOutdatedConsent = (): void => {
  try {
    if (euUser() && localStorage.getItem(VERSION_KEY) !== CONSENT_VERSION) {
      localStorage.removeItem(CONSENT_KEY);
    }
  } catch { /* noop */ }
};

// Invalidar antes de que los efectos de la página consulten el consentimiento.
resetOutdatedConsent();

const COPY: Record<string, { body: string; more: string; accept: string; reject: string }> = {
  es: { body: "Usamos cookies para medir nuestros anuncios (Meta Pixel). Tú decides.", more: "Más info", accept: "Aceptar", reject: "Rechazar" },
  en: { body: "We use cookies to measure our ads (Meta Pixel). It's your choice.", more: "More info", accept: "Accept", reject: "Reject" },
  fr: { body: "Nous utilisons des cookies pour mesurer nos publicités (Meta Pixel). C'est vous qui décidez.", more: "En savoir plus", accept: "Accepter", reject: "Refuser" },
  pt: { body: "Usamos cookies para medir nossos anúncios (Meta Pixel). Você decide.", more: "Saiba mais", accept: "Aceitar", reject: "Rejeitar" },
  de: { body: "Wir verwenden Cookies, um unsere Anzeigen zu messen (Meta Pixel). Sie entscheiden.", more: "Mehr Infos", accept: "Akzeptieren", reject: "Ablehnen" },
  it: { body: "Usiamo i cookie per misurare i nostri annunci (Meta Pixel). Decidi tu.", more: "Maggiori info", accept: "Accetta", reject: "Rifiuta" },
};

export const CookieConsent = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<string>("es");

  useEffect(() => {
    // El país se detecta al entrar al sitio (no solo en el formulario del pago) para poder pedir permiso a tiempo.
    ensureVisitorCountry();
    const check = () => {
      resetOutdatedConsent();
      const already = getCookieConsent();
      if (already) return;
      if (!euUser()) return;
      try {
        const l = (localStorage.getItem("ilr_lang") || "es").toLowerCase();
        setLang(COPY[l] ? l : "en");
      } catch { setLang("en"); }
      setVisible(true);
    };
    check();
    const t1 = setTimeout(check, 800);
    const t2 = setTimeout(check, 2500);
    // Llegó el país (consulta por IP): se vuelve a revisar.
    window.addEventListener("ilr-country", check);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("ilr-country", check); };
  }, []);

  const decide = (v: "accepted" | "rejected") => {
    try {
      localStorage.setItem(CONSENT_KEY, v);
      localStorage.setItem(VERSION_KEY, CONSENT_VERSION);
    } catch { /* sin almacenamiento */ }
    setVisible(false);
    // Notify listeners (Pixel init) immediately
    window.dispatchEvent(new CustomEvent("ilr-cookie-consent", { detail: v }));
  };

  if (!visible) return null;
  const t = COPY[lang] || COPY.en;
  const inCheckout = pathname.startsWith("/checkout");

  // En el pago: barra fina arriba (no tapa el formulario ni los botones de pago). Antes aquí no se mostraba y, como el país se
  // detectaba justo en el pago, quien venía de Europa nunca podía aceptar y el píxel no veía ni el checkout ni la compra.
  if (inCheckout) {
    return (
      <div role="dialog" aria-label="Cookies" className="fixed inset-x-0 top-0 z-[70] border-b border-border bg-card/98 px-3 py-2 shadow-md backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Cookie className="hidden h-4 w-4 shrink-0 text-primary sm:block" />
          <p className="min-w-0 flex-1 text-xs leading-snug text-muted-foreground">
            {t.body} <a href="/privacidad" className="underline underline-offset-2 text-foreground/80">{t.more}</a>
          </p>
          {/* Mismo tamaño y mismo nivel de visibilidad para Aceptar y Rechazar. */}
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={() => decide("rejected")}>{t.reject}</Button>
            <Button variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={() => decide("accepted")}>{t.accept}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Cookies"
      className="fixed bottom-52 left-2 right-2 md:left-auto md:right-4 lg:bottom-28 z-[60] md:max-w-sm"
    >
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-3">
        <div className="flex items-start gap-2.5">
          <Cookie className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-snug">
            {t.body}{" "}
            <a href="/privacidad" className="underline underline-offset-2 text-foreground/80">{t.more}</a>
          </p>
        </div>
        {/* Mismo tamaño y mismo nivel de visibilidad para Aceptar y Rechazar. */}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => decide("rejected")}>{t.reject}</Button>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => decide("accepted")}>{t.accept}</Button>
        </div>
      </div>
    </div>
  );
};
