import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ------------------------------------------------------------------ *
 * Validación de correos (espejo servidor de src/lib/emailGuard.ts)
 * Combina listas fijas + reglas configurables en `email_domain_rules`.
 * ------------------------------------------------------------------ */

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

export type EmailRules = {
  allowDomains: Set<string>;
  blockDomains: Set<string>;
  blockTlds: Set<string>;
  blockEmails: Set<string>;
  typos: Record<string, string>;
};

export type EmailCheck = {
  ok: boolean;
  email: string;
  corrected: boolean;
  reason?: "format" | "blocked_domain" | "blocked_tld" | "blocked_email" | "fake_user";
  message?: string;
};

export function normalizeEmailBasic(raw: string): string {
  let email = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
  email = email.replace(/[.,;]+$/, "");
  if (email.endsWith("@gmail")) email += ".com";
  if (email.endsWith("@hotmail")) email += ".com";
  if (email.endsWith("@outlook")) email += ".com";
  if (email.endsWith("@yahoo")) email += ".com";
  return email;
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
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

function emptyRules(): EmailRules {
  return {
    allowDomains: new Set(),
    blockDomains: new Set(),
    blockTlds: new Set(),
    blockEmails: new Set(),
    typos: {},
  };
}

function fixDomain(domain: string, rules: EmailRules): string {
  if (rules.typos[domain]) return rules.typos[domain];
  if (TYPO_DOMAINS[domain]) return TYPO_DOMAINS[domain];
  const trustedAll = new Set([...TRUSTED_DOMAINS, ...rules.allowDomains]);
  if (trustedAll.has(domain) || BLOCKED_DOMAINS.has(domain) || rules.blockDomains.has(domain)) return domain;
  for (const trusted of trustedAll) {
    if (domain.startsWith(trusted) && domain.length - trusted.length <= 2) return trusted;
  }
  for (const trusted of trustedAll) {
    if (editDistance(domain, trusted) === 1) return trusted;
  }
  return domain;
}

/** Valida un correo aplicando listas fijas + reglas de la base de datos. */
export function checkEmailWithRules(raw: string, rules: EmailRules = emptyRules()): EmailCheck {
  const base = normalizeEmailBasic(raw);
  const at = base.lastIndexOf("@");
  if (at <= 0) return { ok: false, email: base, corrected: false, reason: "format", message: "Correo inválido" };

  const local = base.slice(0, at);
  const fixed = fixDomain(base.slice(at + 1), rules);
  const email = `${local}@${fixed}`;
  const corrected = email !== base;

  if (!EMAIL_RE.test(email)) {
    return { ok: false, email, corrected, reason: "format", message: "Correo inválido" };
  }
  if (rules.blockEmails.has(email)) {
    return { ok: false, email, corrected, reason: "blocked_email", message: "Correo bloqueado" };
  }
  if (rules.allowDomains.has(fixed)) return { ok: true, email, corrected };
  if (BLOCKED_DOMAINS.has(fixed) || rules.blockDomains.has(fixed)) {
    return { ok: false, email, corrected, reason: "blocked_domain", message: "Usa un correo real (no temporal)" };
  }
  const tld = fixed.split(".").pop() || "";
  if (BLOCKED_TLDS.has(tld) || rules.blockTlds.has(tld)) {
    return { ok: false, email, corrected, reason: "blocked_tld", message: "Dominio de correo no válido" };
  }
  if (FAKE_LOCAL_PARTS.has(local)) {
    return { ok: false, email, corrected, reason: "fake_user", message: "Usa tu correo personal real" };
  }
  return { ok: true, email, corrected };
}

let rulesCache: { at: number; rules: EmailRules } | null = null;
const RULES_TTL_MS = 5 * 60 * 1000;

export function invalidateEmailRulesCache() {
  rulesCache = null;
}

/** Carga (con caché de 5 min) las reglas configurables de email_domain_rules. */
export async function loadEmailRules(supabase: SupabaseClient): Promise<EmailRules> {
  if (rulesCache && Date.now() - rulesCache.at < RULES_TTL_MS) return rulesCache.rules;
  const rules = emptyRules();
  try {
    const { data, error } = await supabase
      .from("email_domain_rules")
      .select("list_type, kind, value, maps_to, enabled")
      .eq("enabled", true);
    if (error) throw error;
    for (const r of (data ?? []) as Array<Record<string, unknown>>) {
      const listType = String(r.list_type || "");
      const kind = String(r.kind || "");
      const value = String(r.value || "").trim().toLowerCase();
      if (!value) continue;
      if (listType === "typo" || kind === "typo") {
        const mapsTo = String(r.maps_to || "").trim().toLowerCase();
        if (mapsTo) rules.typos[value] = mapsTo;
      } else if (listType === "allow") {
        rules.allowDomains.add(value);
      } else if (listType === "block") {
        if (kind === "tld") rules.blockTlds.add(value.replace(/^\./, ""));
        else if (kind === "email") rules.blockEmails.add(value);
        else rules.blockDomains.add(value);
      }
    }
  } catch (e) {
    console.warn("[emailGuard] loadEmailRules failed, usando listas fijas:", e);
  }
  rulesCache = { at: Date.now(), rules };
  return rules;
}

/** Atajo: carga reglas y valida el correo. */
export async function guardEmail(supabase: SupabaseClient, raw: string): Promise<EmailCheck> {
  const rules = await loadEmailRules(supabase);
  return checkEmailWithRules(raw, rules);
}

/**
 * Global 24h throttle check for all marketing/automated emails.
 * Prevents credit waste and customer saturation.
 */
export async function checkGlobalEmailThrottle(
  supabase: SupabaseClient,
  email: string
): Promise<{ throttled: boolean; reason?: string }> {
  const norm = email.trim().toLowerCase();
  const window24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: newsletterCount } = await supabase
    .from('newsletter_drip_sends')
    .select('id', { count: 'exact', head: true })
    .eq('email', norm)
    .eq('status', 'sent')
    .gte('sent_at', window24h);

  if ((newsletterCount || 0) > 0) return { throttled: true, reason: 'newsletter_sent_24h' };

  const { count: marketingCount } = await supabase
    .from('marketing_drip_sends')
    .select('id', { count: 'exact', head: true })
    .eq('email', norm)
    .eq('status', 'sent')
    .gte('sent_at', window24h);

  if ((marketingCount || 0) > 0) return { throttled: true, reason: 'marketing_sent_24h' };

  const { count: reviewCount } = await supabase
    .from('review_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', norm)
    .gte('last_email_sent_at', window24h);

  if ((reviewCount || 0) > 0) return { throttled: true, reason: 'review_sent_24h' };

  const { count: abandonedCount } = await supabase
    .from('brevo_sync_logs')
    .select('id', { count: 'exact', head: true })
    .eq('email', norm)
    .in('event_type', ['hotmart_abandoned', 'tienda_abandoned'])
    .eq('status', 'success')
    .gte('created_at', window24h);

  if ((abandonedCount || 0) > 0) return { throttled: true, reason: 'abandoned_sent_24h' };

  return { throttled: false };
}
