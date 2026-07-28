/**
 * Validación de correos en el checkout / popups.
 * Lista blanca (proveedores confiables), lista negra (desechables / TLD falsos)
 * y correcciones automáticas de errores típicos (.mxm -> .mx, gmial -> gmail).
 * El backend repite la misma validación con reglas configurables en la base
 * de datos (tabla email_domain_rules) antes de gastar envíos de Brevo.
 */

export const TRUSTED_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.com.mx", "yahoo.es", "yahoo.com.ar", "yahoo.com.br", "yahoo.com.pe",
  "outlook.com", "outlook.es", "outlook.com.pe", "outlook.com.mx",
  "hotmail.com", "hotmail.es", "hotmail.com.mx", "hotmail.com.ar", "hotmail.fr",
  "live.com", "live.com.mx", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com",
  "aol.com", "gmx.com", "zoho.com", "yandex.com",
  "terra.com.pe", "uol.com.br", "bol.com.br",
]);

export const BLOCKED_DOMAINS = new Set([
  "mailinator.com", "yopmail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "guerrillamail.com", "sharklasers.com", "trashmail.com",
  "getnada.com", "dispostable.com", "maildrop.cc", "fakeinbox.com",
  "throwawaymail.com", "mohmal.com", "emailondeck.com", "spam4.me",
]);

export const BLOCKED_TLDS = new Set([
  "zzz", "test", "invalid", "local", "example", "localhost", "xx", "aa",
]);

/** Dominios mal escritos -> dominio correcto */
export const TYPO_DOMAINS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com",
  "gmail.con": "gmail.com", "gmail.co": "gmail.com", "gmail.cm": "gmail.com",
  "gmail.comm": "gmail.com", "gmaill.com": "gmail.com", "gmail.om": "gmail.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.con": "hotmail.com",
  "hotmail.co": "hotmail.com", "hotmail.comm": "hotmail.com",
  "outlok.com": "outlook.com", "outloo.com": "outlook.com", "outlook.con": "outlook.com",
  "outlok.com.pe": "outlook.com.pe", "outlok.es": "outlook.es",
  "yahoo.con": "yahoo.com", "yaho.com": "yahoo.com", "yahho.com": "yahoo.com",
  "yahoo.com.mxm": "yahoo.com.mx", "yahoo.com.mxm1": "yahoo.com.mx",
  "yahoo.com.mx1": "yahoo.com.mx", "yahoo.com.mxx": "yahoo.com.mx",
  "icloud.con": "icloud.com", "iclod.com": "icloud.com", "iclould.com": "icloud.com",
  "live.con": "live.com", "protonmai.com": "protonmail.com",
};

const FAKE_LOCAL_PARTS = new Set([
  "test", "asdf", "asd", "qwerty", "12345", "1234", "123", "abc", "aaa",
  "prueba", "noemail", "nomail", "fake", "xxx", "correo",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

export type EmailCheck = {
  ok: boolean;
  /** Correo normalizado y corregido */
  email: string;
  /** true si se corrigió automáticamente */
  corrected: boolean;
  reason?: "format" | "blocked_domain" | "blocked_tld" | "blocked_email" | "fake_user";
  message?: string;
};

/** Distancia de edición (Levenshtein) simple para detectar typos de 1 letra. */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

/** Corrige el dominio si coincide con un typo conocido o con una variante de un dominio confiable. */
function fixDomain(domain: string): string {
  if (TYPO_DOMAINS[domain]) return TYPO_DOMAINS[domain];
  if (TRUSTED_DOMAINS.has(domain) || BLOCKED_DOMAINS.has(domain)) return domain;
  // "yahoo.com.mxm1" / "gmail.comx" -> recorta la basura final si el prefijo es confiable
  for (const trusted of TRUSTED_DOMAINS) {
    if (domain.startsWith(trusted) && domain.length - trusted.length <= 2) return trusted;
  }
  // "gmaily.com" / "gmail.xom" -> dominio confiable a 1 letra de distancia
  for (const trusted of TRUSTED_DOMAINS) {
    if (editDistance(domain, trusted) === 1) return trusted;
  }
  return domain;
}


export function normalizeEmailBasic(raw: string): string {
  let email = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
  email = email.replace(/[.,;]+$/, "");
  if (email.endsWith("@gmail")) email += ".com";
  if (email.endsWith("@hotmail")) email += ".com";
  if (email.endsWith("@outlook")) email += ".com";
  if (email.endsWith("@yahoo")) email += ".com";
  return email;
}

export function checkEmail(raw: string): EmailCheck {
  const base = normalizeEmailBasic(raw);
  const at = base.lastIndexOf("@");
  if (at <= 0) return { ok: false, email: base, corrected: false, reason: "format", message: "Correo inválido" };

  const local = base.slice(0, at);
  const fixed = fixDomain(base.slice(at + 1));
  const email = `${local}@${fixed}`;
  const corrected = email !== base;

  if (!EMAIL_RE.test(email)) {
    return { ok: false, email, corrected, reason: "format", message: "Correo inválido" };
  }
  if (BLOCKED_DOMAINS.has(fixed)) {
    return { ok: false, email, corrected, reason: "blocked_domain", message: "Usa un correo real (no temporal)" };
  }
  const tld = fixed.split(".").pop() || "";
  if (BLOCKED_TLDS.has(tld)) {
    return { ok: false, email, corrected, reason: "blocked_tld", message: "Dominio de correo no válido" };
  }
  if (FAKE_LOCAL_PARTS.has(local)) {
    return { ok: false, email, corrected, reason: "fake_user", message: "Usa tu correo personal real" };
  }
  return { ok: true, email, corrected };
}

export function isEmailAcceptable(raw: string): boolean {
  return checkEmail(raw).ok;
}
