import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const EU_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH"
]);

const CONSENT_KEY = "ilr_cookie_consent"; // "accepted" | "rejected"
// Versión del banner: Europa debe volver a elegir al actualizarla.
const CONSENT_VERSION = "2";
const VERSION_KEY = "ilr_cookie_consent_v";

export const getCookieConsent = (): "accepted" | "rejected" | null => {
  try { return localStorage.getItem(CONSENT_KEY) as any; } catch { return null; }
};

export const isEuUser = (): boolean => {
  try {
    const c = (localStorage.getItem("ilr_country") || "").toUpperCase();
    return EU_COUNTRIES.has(c);
  } catch { return false; }
};

/** Europa: si la respuesta es del banner anterior, se borra para volver a preguntar. */
const resetOutdatedConsent = (): void => {
  try {
    if (isEuUser() && localStorage.getItem(VERSION_KEY) !== CONSENT_VERSION) {
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
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<string>("es");

  useEffect(() => {
    resetOutdatedConsent();
    // Wait briefly for ipapi to populate ilr_country
    const check = () => {
      resetOutdatedConsent();
      const already = getCookieConsent();
      if (already) return;
      if (!isEuUser()) return;
      try {
        const l = (localStorage.getItem("ilr_lang") || "es").toLowerCase();
        setLang(COPY[l] ? l : "en");
      } catch { setLang("en"); }
      setVisible(true);
    };
    const t1 = setTimeout(check, 800);
    const t2 = setTimeout(check, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const decide = (v: "accepted" | "rejected") => {
    try {
      localStorage.setItem(CONSENT_KEY, v);
      localStorage.setItem(VERSION_KEY, CONSENT_VERSION);
    } catch {}
    setVisible(false);
    // Notify listeners (Pixel init) immediately
    window.dispatchEvent(new CustomEvent("ilr-cookie-consent", { detail: v }));
  };

  if (!visible) return null;
  const t = COPY[lang] || COPY.en;

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
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => decide("rejected")}>{t.reject}</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => decide("accepted")}>{t.accept}</Button>
        </div>
      </div>
    </div>
  );
};
