import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const EU_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH"
]);

const CONSENT_KEY = "ilr_cookie_consent"; // "accepted" | "rejected"

export const getCookieConsent = (): "accepted" | "rejected" | null => {
  try { return localStorage.getItem(CONSENT_KEY) as any; } catch { return null; }
};

export const isEuUser = (): boolean => {
  try {
    const c = (localStorage.getItem("ilr_country") || "").toUpperCase();
    return EU_COUNTRIES.has(c);
  } catch { return false; }
};

const COPY: Record<string, { title: string; body: string; accept: string; reject: string }> = {
  es: { title: "🍪 Usamos cookies", body: "Usamos cookies para mejorar tu experiencia y medir el rendimiento de nuestros anuncios (Meta Pixel). Puedes aceptar o rechazar.", accept: "Aceptar", reject: "Rechazar" },
  en: { title: "🍪 We use cookies", body: "We use cookies to improve your experience and measure ad performance (Meta Pixel). You can accept or reject.", accept: "Accept", reject: "Reject" },
  fr: { title: "🍪 Nous utilisons des cookies", body: "Nous utilisons des cookies pour améliorer votre expérience et mesurer les performances publicitaires (Meta Pixel). Vous pouvez accepter ou refuser.", accept: "Accepter", reject: "Refuser" },
  pt: { title: "🍪 Usamos cookies", body: "Usamos cookies para melhorar sua experiência e medir o desempenho de anúncios (Meta Pixel). Você pode aceitar ou rejeitar.", accept: "Aceitar", reject: "Rejeitar" },
  de: { title: "🍪 Wir verwenden Cookies", body: "Wir verwenden Cookies, um Ihre Erfahrung zu verbessern und die Anzeigenleistung zu messen (Meta Pixel). Sie können akzeptieren oder ablehnen.", accept: "Akzeptieren", reject: "Ablehnen" },
  it: { title: "🍪 Usiamo i cookie", body: "Usiamo i cookie per migliorare la tua esperienza e misurare le prestazioni degli annunci (Meta Pixel). Puoi accettare o rifiutare.", accept: "Accetta", reject: "Rifiuta" },
};

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<string>("es");

  useEffect(() => {
    // Wait briefly for ipapi to populate ilr_country
    const check = () => {
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
    try { localStorage.setItem(CONSENT_KEY, v); } catch {}
    setVisible(false);
    // Notify listeners (Pixel init) immediately
    window.dispatchEvent(new CustomEvent("ilr-cookie-consent", { detail: v }));
  };

  if (!visible) return null;
  const t = COPY[lang] || COPY.en;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[60] md:max-w-md">
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">{t.title}</h3>
            <p className="text-sm text-muted-foreground leading-snug">{t.body}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => decide("rejected")}>{t.reject}</Button>
          <Button variant="hero" size="sm" onClick={() => decide("accepted")}>{t.accept}</Button>
        </div>
      </div>
    </div>
  );
};
