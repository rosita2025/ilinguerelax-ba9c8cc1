/**
 * Guarda de correos para el backend: misma lógica que src/lib/emailGuard.ts
 * pero con reglas configurables desde la tabla public.email_domain_rules
 * (lista blanca, lista negra de dominios/TLD/correos y correcciones de typos).
 * Se usa ANTES de enviar cualquier cosa a Brevo para no gastar consumo.
 */

const TRUSTED_DOMAINS = new Set([
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

const BLOCKED_DOMAINS = new Set([
  "mailinator.com", "yopmail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "guerrillamail.com", "sharklasers.com", "trashmail.com",
  "getnada.com", "dispostable.com", "maildrop.cc", "fakeinbox.com",
  "throwawaymail.com", "mohmal.com", "emailondeck.com", "spam4.me",
]);

const BLOCKED_TLDS = new Set(["zzz", "test", "invalid", "local", "example", "localhost", "xx", "aa"]);

const TYPO_DOMAINS: Record<string, string> = {
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

export type EmailRules = {
  allowDomains: Set<string>;
  blockDomains: Set<string>;
  blockTlds: Set<string>;
  blockEmails: Set<string>;
  typos: Record<string, string>;
};

type RuleRow = { list_type: string; kind: string; value: string; maps_to: string | null; enabled: boolean };
type RulesClient = {
  from: (table: "email_domain_rules") => {
    select: (columns: string) => {
      eq: (col: string, val: boolean) => PromiseLike<{ data: RuleRow[] | null; error: unknown }>;
    };
  };
};

let cache: { at: number; rules: EmailRules } | null = null;
const TTL_MS = 5 * 60 * 1000;

function baseRules(): EmailRules {
  return {
    allowDomains: new Set(TRUSTED_DOMAINS),
    blockDomains: new Set(BLOCKED_DOMAINS),
    blockTlds: new Set(BLOCKED_TLDS),
    blockEmails: new Set<string>(),
    typos: { ...TYPO_DOMAINS },
  };
}

export function invalidateEmailRulesCache() { cache = null; }

export async function loadEmailRules(sb: unknown): Promise<EmailRules> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules;
  const rules = baseRules();
  try {
    const { data, error } = await (sb as RulesClient)
      .from("email_domain_rules")
      .select("list_type, kind, value, maps_to, enabled")
      .eq("enabled", true);
    if (error) throw error;
    for (const row of data ?? []) {
      const value = String(row.value || "").trim().toLowerCase();
      if (!value) continue;
      if (row.list_type === "typo" || row.kind === "typo") {
        const to = String(row.maps_to || "").trim().toLowerCase();
        if (to) rules.typos[value] = to;
        continue;
      }
      const block = row.list_type === "block";
      if (row.kind === "domain") {
        if (block) { rules.blockDomains.add(value); rules.allowDomains.delete(value); }
        else { rules.allowDomains.add(value); rules.blockDomains.delete(value); }
      } else if (row.kind === "tld") {
        const tld = value.replace(/^\./, "");
        if (block) rules.blockTlds.add(tld); else rules.blockTlds.delete(tld);
      } else if (row.kind === "email") {
        if (block) rules.blockEmails.add(value); else rules.blockEmails.delete(value);
      }
    }
  } catch (e) {
    console.warn("[emailGuard] usando reglas por defecto:", e instanceof Error ? e.message : String(e));
  }
  cache = { at: Date.now(), rules };
  return rules;
}

export type EmailCheck = {
  ok: boolean;
  email: string;
  corrected: boolean;
  reason?: "format" | "blocked_domain" | "blocked_tld" | "blocked_email" | "fake_user";
};

export function normalizeEmailBasic(raw: unknown): string {
  let email = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
  email = email.replace(/[.,;]+$/, "");
  for (const p of ["gmail", "hotmail", "outlook", "yahoo"]) {
    if (email.endsWith(`@${p}`)) email += ".com";
  }
  return email;
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

export function checkEmailWithRules(raw: unknown, rules: EmailRules): EmailCheck {
  const base = normalizeEmailBasic(raw);
  const at = base.lastIndexOf("@");
  if (at <= 0) return { ok: false, email: base, corrected: false, reason: "format" };

  const local = base.slice(0, at);
  let domain = base.slice(at + 1);
  if (rules.typos[domain]) {
    domain = rules.typos[domain];
  } else if (!rules.allowDomains.has(domain) && !rules.blockDomains.has(domain)) {
    let fixed = "";
    for (const trusted of rules.allowDomains) {
      if (domain.startsWith(trusted) && domain.length - trusted.length <= 2) { fixed = trusted; break; }
    }
    if (!fixed) {
      for (const trusted of rules.allowDomains) {
        if (editDistance(domain, trusted) === 1) { fixed = trusted; break; }
      }
    }
    if (fixed) domain = fixed;
  }

  const email = `${local}@${domain}`;
  const corrected = email !== base;

  if (!EMAIL_RE.test(email)) return { ok: false, email, corrected, reason: "format" };
  if (rules.blockEmails.has(email)) return { ok: false, email, corrected, reason: "blocked_email" };
  if (rules.blockDomains.has(domain)) return { ok: false, email, corrected, reason: "blocked_domain" };
  const tld = domain.split(".").pop() || "";
  if (rules.blockTlds.has(tld)) return { ok: false, email, corrected, reason: "blocked_tld" };
  if (FAKE_LOCAL_PARTS.has(local)) return { ok: false, email, corrected, reason: "fake_user" };
  return { ok: true, email, corrected };
}

/** Atajo: carga reglas (cacheadas) y valida. */
export async function guardEmail(sb: unknown, raw: unknown): Promise<EmailCheck> {
  const rules = await loadEmailRules(sb);
  return checkEmailWithRules(raw, rules);
}
