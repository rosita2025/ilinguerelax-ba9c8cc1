/**
 * Consentimiento de cookies de Europa (píxel de Meta).
 * Un solo lugar para saber si el visitante está en Europa y si ya decidió. Lo usan el aviso de cookies, el píxel y la atribución.
 */
export const EU_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH",
]);

export const CONSENT_KEY = "ilr_cookie_consent"; // "accepted" | "rejected"
const COUNTRY_KEY = "ilr_country";

export const getCookieConsent = (): "accepted" | "rejected" | null => {
  try { return localStorage.getItem(CONSENT_KEY) as "accepted" | "rejected" | null; } catch { return null; }
};

/** Mientras no se sabe el país, la zona horaria de Europa ya indica que hay que pedir permiso (así no dependemos de una consulta que puede tardar o fallar). */
const europeByTimezone = (): boolean => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return tz.startsWith("Europe/") || ["Atlantic/Canary", "Atlantic/Madeira", "Atlantic/Azores", "Atlantic/Reykjavik", "Atlantic/Faroe"].includes(tz);
  } catch { return false; }
};

export const isEuUser = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const c = (localStorage.getItem(COUNTRY_KEY) || "").toUpperCase();
    if (c.length === 2) return EU_COUNTRIES.has(c);
  } catch { /* sin almacenamiento */ }
  return europeByTimezone();
};

let asked = false;
/**
 * Detecta el país del visitante al ENTRAR al sitio (antes solo se detectaba dentro del formulario del pago, cuando ya era tarde para
 * pedir permiso). Lo guarda en `ilr_country` y avisa con el evento `ilr-country`.
 */
export function ensureVisitorCountry(): void {
  if (typeof window === "undefined" || asked) return;
  asked = true;
  try {
    const cached = localStorage.getItem(COUNTRY_KEY);
    if (cached && cached.length === 2) return;
  } catch { return; }
  fetch("https://ipwho.is/")
    .then((r) => r.json())
    .then((d: { country_code?: string }) => {
      const code = String(d?.country_code || "").toUpperCase();
      if (!/^[A-Z]{2}$/.test(code)) return;
      try { localStorage.setItem(COUNTRY_KEY, code); } catch { /* sin almacenamiento */ }
      window.dispatchEvent(new CustomEvent("ilr-country", { detail: code }));
    })
    .catch(() => { /* sin país: se usa la zona horaria */ });
}
